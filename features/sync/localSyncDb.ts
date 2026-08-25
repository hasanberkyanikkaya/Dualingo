import type { SQLiteDatabase } from 'expo-sqlite';

import { getDatabase } from '@/lib/database';

import { createMutationId } from './id';
import type { JsonObject, SyncEntityType, SyncMutation, SyncOperation } from './types';

const OWNED_TABLES = [
  'activity_day',
  'badge_unlock',
  'learning_attempt',
  'prayer_log',
  'progress_state',
  'quran_goal',
  'quran_goal_reminder',
  'quran_read_event',
  'quran_reading_position',
] as const;

let enqueueSuppressed = false;

type IdentityRow = {
  installation_id: string;
  active_owner_id: string;
};

export function getActiveOwnerId(database: SQLiteDatabase = requireDatabase()): string {
  const row = database.getFirstSync<IdentityRow>(
    'SELECT installation_id, active_owner_id FROM sync_identity WHERE singleton_id = 1;',
  );
  return row?.active_owner_id ?? 'local:unavailable';
}

export function getInstallationId(database: SQLiteDatabase = requireDatabase()): string {
  const row = database.getFirstSync<IdentityRow>(
    'SELECT installation_id, active_owner_id FROM sync_identity WHERE singleton_id = 1;',
  );
  return row?.installation_id ?? 'unavailable';
}

export function isCloudOwner(ownerId: string): boolean {
  return ownerId.startsWith('user:');
}

/** İlk girişte mevcut hesapsız veriyi doğrulanmış hesaba atomik olarak bağlar. */
export function adoptLocalData(userId: string): void {
  const database = getDatabase();
  if (database === null) {
    return;
  }

  const currentOwner = getActiveOwnerId(database);
  const nextOwner = `user:${userId}`;
  if (currentOwner === nextOwner) {
    return;
  }

  const now = Date.now();
  database.withTransactionSync(() => {
    if (!isCloudOwner(currentOwner)) {
      queueOwnerSnapshot(database, currentOwner);
      for (const table of OWNED_TABLES) {
        database.runSync(`UPDATE ${table} SET owner_id = ? WHERE owner_id = ?;`, [
          nextOwner,
          currentOwner,
        ]);
      }
      database.runSync('UPDATE sync_outbox SET owner_id = ? WHERE owner_id = ?;', [
        nextOwner,
        currentOwner,
      ]);
    }

    database.runSync(
      `UPDATE sync_identity
          SET active_owner_id = ?, updated_at = ?, deleted_at = NULL
        WHERE singleton_id = 1;`,
      [nextOwner, now],
    );
    database.runSync(
      `INSERT INTO sync_state (owner_id, pull_version, updated_at, deleted_at)
       VALUES (?, 0, ?, NULL)
       ON CONFLICT(owner_id) DO UPDATE SET deleted_at = NULL, updated_at = excluded.updated_at;`,
      [nextOwner, now],
    );
    database.runSync(
      `INSERT INTO sync_consent
         (owner_id, prayer_sync_enabled, updated_at, deleted_at)
       VALUES (?, 0, ?, NULL)
       ON CONFLICT(owner_id) DO NOTHING;`,
      [nextOwner, now],
    );
  });
}

/** Hesap öncesi kayıtları ilk girişte yeniden oynatılabilir outbox öğelerine çevirir. */
function queueOwnerSnapshot(database: SQLiteDatabase, ownerId: string): void {
  const activities = database.getAllSync<{
    date: string; first_at: number; last_at: number; lesson_count: number;
    xp_earned: number; updated_at: number; deleted_at: number | null;
  }>('SELECT * FROM activity_day WHERE owner_id = ?;', [ownerId]);
  for (const row of activities) {
    enqueueMutation(database, 'activity_day', row.date, row.deleted_at === null ? 'upsert' : 'delete', {
      date: row.date, firstAt: row.first_at, lastAt: row.last_at,
      lessonCount: row.lesson_count, xpEarned: row.xp_earned,
    }, row.updated_at);
  }

  const badges = database.getAllSync<{
    badge_id: string; earned_at: number; updated_at: number; deleted_at: number | null;
  }>('SELECT * FROM badge_unlock WHERE owner_id = ?;', [ownerId]);
  for (const row of badges) {
    enqueueMutation(database, 'badge_unlock', row.badge_id, row.deleted_at === null ? 'upsert' : 'delete', {
      badgeId: row.badge_id, earnedAt: row.earned_at,
    }, row.updated_at);
  }

  const prayers = database.getAllSync<{
    date: string; prayer: string; status: string; updated_at: number; deleted_at: number | null;
  }>('SELECT * FROM prayer_log WHERE owner_id = ?;', [ownerId]);
  for (const row of prayers) {
    enqueueMutation(database, 'prayer_log', `${row.date}:${row.prayer}`, row.deleted_at === null ? 'upsert' : 'delete', {
      date: row.date, prayer: row.prayer,
    }, row.updated_at);
  }

  const positions = database.getAllSync<{
    position_id: string; verse_key: string; content_revision: string; saved_at: number;
    updated_at: number; deleted_at: number | null;
  }>('SELECT * FROM quran_reading_position WHERE owner_id = ?;', [ownerId]);
  for (const row of positions) {
    enqueueMutation(database, 'quran_reading_position', row.position_id, row.deleted_at === null ? 'upsert' : 'delete', {
      positionId: row.position_id, verseKey: row.verse_key,
      contentRevision: row.content_revision, savedAt: row.saved_at,
    }, row.updated_at);
  }

  const readEvents = database.getAllSync<{
    date: string; verse_key: string; first_read_at: number; last_read_at: number;
    updated_at: number; deleted_at: number | null;
  }>('SELECT * FROM quran_read_event WHERE owner_id = ?;', [ownerId]);
  for (const row of readEvents) {
    enqueueMutation(database, 'quran_read_event', `${row.date}:${row.verse_key}`, row.deleted_at === null ? 'upsert' : 'delete', {
      date: row.date, verseKey: row.verse_key,
      firstReadAt: row.first_read_at, lastReadAt: row.last_read_at,
    }, row.updated_at);
  }

  const goals = database.getAllSync<{
    goal_id: string; goal_type: string; target_value: number; target_date: string | null;
    start_date: string; content_revision: string; created_at: number;
    updated_at: number; deleted_at: number | null;
  }>('SELECT * FROM quran_goal WHERE owner_id = ?;', [ownerId]);
  for (const row of goals) {
    enqueueMutation(database, 'quran_goal', row.goal_id, row.deleted_at === null ? 'upsert' : 'delete', {
      goalId: row.goal_id, goalType: row.goal_type, targetValue: row.target_value,
      targetDate: row.target_date, startDate: row.start_date,
      contentRevision: row.content_revision, createdAt: row.created_at,
    }, row.updated_at);
  }

  const progress = database.getFirstSync<{
    state_json: string; baseline_xp: number; baseline_attempt_counts_json: string;
    updated_at: number; deleted_at: number | null;
  }>(
    `SELECT state_json, baseline_xp, baseline_attempt_counts_json, updated_at, deleted_at
       FROM progress_state WHERE owner_id = ?;`,
    [ownerId],
  );
  if (progress !== null) {
    enqueueMutation(database, 'progress_state', 'main', progress.deleted_at === null ? 'upsert' : 'delete', {
      state: progress.state_json,
      baselineXp: progress.baseline_xp,
      baselineAttemptCounts: progress.baseline_attempt_counts_json,
    }, progress.updated_at);
  }

  const attempts = database.getAllSync<{
    attempt_id: string; level_id: string; stars: number; accuracy: number; xp_earned: number;
    completed_at: number; updated_at: number; deleted_at: number | null;
  }>('SELECT * FROM learning_attempt WHERE owner_id = ?;', [ownerId]);
  for (const row of attempts) {
    enqueueMutation(database, 'learning_attempt', row.attempt_id, row.deleted_at === null ? 'upsert' : 'delete', {
      attemptId: row.attempt_id, levelId: row.level_id, stars: row.stars,
      accuracy: row.accuracy, xpEarned: row.xp_earned, completedAt: row.completed_at,
    }, row.updated_at);
  }
}

/** Oturum açılmış ama bu cihazda yerel veri olmayan bir hesabı etkinleştirir. */
export function activateCloudOwner(userId: string): void {
  adoptLocalData(userId);
}

export function setPrayerSyncConsent(enabled: boolean): void {
  const database = getDatabase();
  if (database === null) {
    return;
  }
  const ownerId = getActiveOwnerId(database);
  const now = Date.now();
  const wasEnabled = hasPrayerSyncConsent(database);
  database.withTransactionSync(() => {
    database.runSync(
      `INSERT INTO sync_consent
         (owner_id, prayer_sync_enabled, updated_at, deleted_at)
       VALUES (?, ?, ?, NULL)
       ON CONFLICT(owner_id) DO UPDATE SET
         prayer_sync_enabled = excluded.prayer_sync_enabled,
         updated_at = excluded.updated_at,
         deleted_at = NULL;`,
      [ownerId, enabled ? 1 : 0, now],
    );

    // Namaz kapalıyken pull imleci hassas satırların ötesine geçmiş olabilir.
    // İlk/yeniden onayda sıfırdan çekmek, arada atlanan satırları geri getirir;
    // server_version denetimi diğer varlıklarda bu tekrarı etkisiz kılar.
    if (enabled && !wasEnabled) {
      database.runSync(
        'UPDATE sync_state SET pull_version = 0, updated_at = ? WHERE owner_id = ?;',
        [now, ownerId],
      );
    }
  });
}

export function hasPrayerSyncConsent(database: SQLiteDatabase = requireDatabase()): boolean {
  const ownerId = getActiveOwnerId(database);
  const row = database.getFirstSync<{ prayer_sync_enabled: number }>(
    `SELECT prayer_sync_enabled FROM sync_consent
      WHERE owner_id = ? AND deleted_at IS NULL;`,
    [ownerId],
  );
  return row?.prayer_sync_enabled === 1;
}

export function enqueueMutation(
  database: SQLiteDatabase,
  entityType: SyncEntityType,
  entityKey: string,
  operation: SyncOperation,
  payload: JsonObject,
  clientUpdatedAt: number,
): string {
  if (enqueueSuppressed) {
    return '';
  }
  const mutationId = createMutationId();
  const ownerId = getActiveOwnerId(database);
  database.runSync(
    `INSERT INTO sync_outbox
       (mutation_id, owner_id, entity_type, entity_key, operation, payload_json,
        client_updated_at, created_at, retry_count, last_error, sent_at, updated_at, deleted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, NULL, ?, NULL);`,
    [
      mutationId,
      ownerId,
      entityType,
      entityKey,
      operation,
      JSON.stringify(payload),
      clientUpdatedAt,
      clientUpdatedAt,
      clientUpdatedAt,
    ],
  );
  return mutationId;
}

/** Uzak değişiklikleri yerelde uygularken yeni bir gönderim döngüsü oluşmasını engeller. */
export function withoutEnqueue<T>(operation: () => T): T {
  const previous = enqueueSuppressed;
  enqueueSuppressed = true;
  try {
    return operation();
  } finally {
    enqueueSuppressed = previous;
  }
}

export function readPendingMutations(limit = 100): SyncMutation[] {
  const database = getDatabase();
  if (database === null) {
    return [];
  }
  const ownerId = getActiveOwnerId(database);
  const prayerEnabled = hasPrayerSyncConsent(database);
  const rows = database.getAllSync<{
    mutation_id: string;
    entity_type: SyncEntityType;
    entity_key: string;
    operation: SyncOperation;
    payload_json: string;
    client_updated_at: number;
  }>(
    `SELECT mutation_id, entity_type, entity_key, operation, payload_json, client_updated_at
       FROM sync_outbox
      WHERE owner_id = ? AND sent_at IS NULL AND deleted_at IS NULL
        AND (? = 1 OR entity_type <> 'prayer_log')
      ORDER BY created_at ASC
      LIMIT ?;`,
    [ownerId, prayerEnabled ? 1 : 0, limit],
  );

  return rows.flatMap((row) => {
    try {
      return [
        {
          mutationId: row.mutation_id,
          entityType: row.entity_type,
          entityKey: row.entity_key,
          operation: row.operation,
          payload: JSON.parse(row.payload_json) as JsonObject,
          clientUpdatedAt: row.client_updated_at,
        },
      ];
    } catch {
      return [];
    }
  });
}

export function markMutationsSent(mutationIds: readonly string[], at: number): void {
  const database = getDatabase();
  if (database === null) {
    return;
  }
  database.withTransactionSync(() => {
    for (const mutationId of mutationIds) {
      database.runSync(
        `UPDATE sync_outbox
            SET sent_at = ?, last_error = NULL, updated_at = ?
          WHERE mutation_id = ?;`,
        [at, at, mutationId],
      );
    }
  });
}

export function markMutationError(mutationIds: readonly string[], message: string, at: number): void {
  const database = getDatabase();
  if (database === null) {
    return;
  }
  database.withTransactionSync(() => {
    for (const mutationId of mutationIds) {
      database.runSync(
        `UPDATE sync_outbox
            SET retry_count = retry_count + 1, last_error = ?, updated_at = ?
          WHERE mutation_id = ?;`,
        [message.slice(0, 500), at, mutationId],
      );
    }
  });
}

export function readPullVersion(): number {
  const database = getDatabase();
  if (database === null) {
    return 0;
  }
  const ownerId = getActiveOwnerId(database);
  return (
    database.getFirstSync<{ pull_version: number }>(
      'SELECT pull_version FROM sync_state WHERE owner_id = ?;',
      [ownerId],
    )?.pull_version ?? 0
  );
}

export function writeSyncResult(version: number, error: string | null, at: number): void {
  const database = getDatabase();
  if (database === null) {
    return;
  }
  const ownerId = getActiveOwnerId(database);
  database.runSync(
    `INSERT INTO sync_state
       (owner_id, pull_version, last_started_at, last_completed_at, last_error, updated_at, deleted_at)
     VALUES (?, ?, ?, ?, ?, ?, NULL)
     ON CONFLICT(owner_id) DO UPDATE SET
       pull_version = MAX(sync_state.pull_version, excluded.pull_version),
       last_completed_at = excluded.last_completed_at,
       last_error = excluded.last_error,
       updated_at = excluded.updated_at,
       deleted_at = NULL;`,
    [ownerId, version, at, error === null ? at : null, error, at],
  );
}

/**
 * Gizlilik amaçlı cihaz temizliği. Normal alan silmeleri soft-delete kullanır;
 * bu işlev yalnızca kullanıcının açık "bu cihazdan kaldır" eyleminde çağrılır.
 */
export function purgeActiveCloudOwnerFromDevice(): void {
  const database = getDatabase();
  if (database === null) {
    return;
  }
  const ownerId = getActiveOwnerId(database);
  if (!isCloudOwner(ownerId)) {
    return;
  }
  const installationId = getInstallationId(database);
  const nextOwner = `local:${installationId}:guest`;
  const now = Date.now();

  database.withTransactionSync(() => {
    for (const table of OWNED_TABLES) {
      database.runSync(`DELETE FROM ${table} WHERE owner_id = ?;`, [ownerId]);
    }
    database.runSync('DELETE FROM sync_outbox WHERE owner_id = ?;', [ownerId]);
    database.runSync('DELETE FROM sync_state WHERE owner_id = ?;', [ownerId]);
    database.runSync('DELETE FROM sync_consent WHERE owner_id = ?;', [ownerId]);
    database.runSync(
      'UPDATE sync_identity SET active_owner_id = ?, updated_at = ? WHERE singleton_id = 1;',
      [nextOwner, now],
    );
  });
}

function requireDatabase(): SQLiteDatabase {
  const database = getDatabase();
  if (database === null) {
    throw new Error('SQLite kullanılamıyor.');
  }
  return database;
}
