import NetInfo from '@react-native-community/netinfo';
import { create } from 'zustand';

import { getSupabaseClient } from '@/features/account/supabase';
import { reloadProgressForActiveOwner } from '@/features/progress/store';

import { applyRemoteChange } from './applyRemoteChange';
import { reconcileActiveProgress } from './reconcileProgressDb';
import {
  activateCloudOwner,
  getActiveOwnerId,
  hasPrayerSyncConsent,
  markMutationError,
  markMutationsSent,
  readPendingMutations,
  readPullVersion,
  writeSyncResult,
} from './localSyncDb';
import type { RemoteSyncChange, SyncStatus } from './types';

type SyncStore = {
  status: SyncStatus;
  lastSyncedAt: number | null;
  error: string | null;
};

export const useSyncStore = create<SyncStore>(() => ({
  status: 'idle',
  lastSyncedAt: null,
  error: null,
}));

let running: Promise<void> | null = null;

function isExpectedOwner(ownerId: string): boolean {
  try {
    return getActiveOwnerId() === ownerId;
  } catch {
    return false;
  }
}

function isRemoteChange(value: unknown): value is RemoteSyncChange {
  if (typeof value !== 'object' || value === null) return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.entity_type === 'string' &&
    typeof row.entity_key === 'string' &&
    typeof row.payload === 'object' &&
    row.payload !== null &&
    (row.deleted_at === null || typeof row.deleted_at === 'number') &&
    typeof row.server_version === 'number'
  );
}

export function requestSync(): Promise<void> {
  if (running !== null) {
    return running;
  }
  running = runSync().finally(() => {
    running = null;
  });
  return running;
}

async function runSync(): Promise<void> {
  const client = getSupabaseClient();
  if (client === null) {
    useSyncStore.setState({ status: 'disabled', error: null });
    return;
  }
  const { data: sessionData } = await client.auth.getSession();
  if (sessionData.session === null) {
    useSyncStore.setState({ status: 'idle', error: null });
    return;
  }
  // NetInfo dinleyicisi Auth store hidrasyonundan önce uyanabilir. Senkron
  // hiçbir koşulda doğrulanmış oturumu yerel misafir sahibine yazmamalı.
  activateCloudOwner(sessionData.session.user.id);
  const expectedOwner = `user:${sessionData.session.user.id}`;
  const network = await NetInfo.fetch();
  if (!isExpectedOwner(expectedOwner)) {
    useSyncStore.setState({ status: 'idle', error: null });
    return;
  }
  if (!network.isConnected) {
    useSyncStore.setState({ status: 'offline', error: null });
    return;
  }

  useSyncStore.setState({ status: 'syncing', error: null });
  const startedAt = Date.now();
  let version = readPullVersion();
  try {
    for (;;) {
      const pending = readPendingMutations();
      if (pending.length === 0) break;
      const payload = pending.map((mutation) => ({
        mutation_id: mutation.mutationId,
        entity_type: mutation.entityType,
        entity_key: mutation.entityKey,
        operation: mutation.operation,
        payload: mutation.payload,
        client_updated_at: mutation.clientUpdatedAt,
      }));
      const { error } = await client.rpc('push_sync_batch', { p_mutations: payload });
      if (!isExpectedOwner(expectedOwner)) {
        useSyncStore.setState({ status: 'idle', error: null });
        return;
      }
      if (error !== null) {
        markMutationError(pending.map((item) => item.mutationId), error.message, Date.now());
        throw error;
      }
      markMutationsSent(pending.map((item) => item.mutationId), Date.now());
      if (pending.length < 100) break;
    }

    let progressChanged = false;
    for (;;) {
      const { data, error } = await client.rpc('pull_sync_changes', {
        p_after_version: version,
        p_limit: 250,
        p_include_prayer: hasPrayerSyncConsent(),
      });
      if (!isExpectedOwner(expectedOwner)) {
        useSyncStore.setState({ status: 'idle', error: null });
        return;
      }
      if (error !== null) throw error;
      const changes = Array.isArray(data) ? data.filter(isRemoteChange) : [];
      for (const change of changes) {
        progressChanged = applyRemoteChange(change) || progressChanged;
        version = Math.max(version, change.server_version);
      }
      if (changes.length < 250) break;
    }

    progressChanged = reconcileActiveProgress() || progressChanged;
    if (!isExpectedOwner(expectedOwner)) {
      useSyncStore.setState({ status: 'idle', error: null });
      return;
    }

    const completedAt = Date.now();
    writeSyncResult(version, null, completedAt);
    if (progressChanged) {
      await reloadProgressForActiveOwner();
    }
    useSyncStore.setState({ status: 'idle', lastSyncedAt: completedAt, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Senkronizasyon tamamlanamadı.';
    writeSyncResult(version, message, startedAt);
    useSyncStore.setState({ status: 'error', error: message });
  }
}
