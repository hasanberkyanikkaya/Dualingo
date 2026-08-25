import { getDatabase } from '@/lib/database';

import { getActiveOwnerId } from './localSyncDb';
import {
  emptyProgressStorageJson,
  reconcileProgressStorageJson,
  type SyncedLearningAttempt,
} from './progressSnapshot';

/** Uzak snapshot'ı, hesapta görülen bütün benzersiz ders olaylarıyla uzlaştırır. */
export function reconcileActiveProgress(): boolean {
  const database = getDatabase();
  if (database === null) return false;
  const ownerId = getActiveOwnerId(database);
  const attempts = database.getAllSync<{
    level_id: string;
    stars: number;
    accuracy: number;
    xp_earned: number;
    completed_at: number;
  }>(
    `SELECT level_id, stars, accuracy, xp_earned, completed_at
       FROM learning_attempt
      WHERE owner_id = ? AND deleted_at IS NULL;`,
    [ownerId],
  );
  if (attempts.length === 0) return false;

  const row = database.getFirstSync<{
    state_json: string;
    baseline_xp: number;
    baseline_attempt_counts_json: string;
  }>(
    `SELECT state_json, baseline_xp, baseline_attempt_counts_json
       FROM progress_state WHERE owner_id = ?;`,
    [ownerId],
  );
  const normalized: SyncedLearningAttempt[] = attempts.map((attempt) => ({
    levelId: attempt.level_id,
    stars: attempt.stars,
    accuracy: attempt.accuracy,
    xpEarned: attempt.xp_earned,
    completedAt: attempt.completed_at,
  }));
  const current = row?.state_json ?? emptyProgressStorageJson();
  let attemptCounts: Record<string, number> = {};
  try {
    const parsed = JSON.parse(row?.baseline_attempt_counts_json ?? '{}') as unknown;
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      attemptCounts = Object.fromEntries(
        Object.entries(parsed).filter((entry): entry is [string, number] => (
          typeof entry[1] === 'number' && Number.isFinite(entry[1]) && entry[1] >= 0
        )),
      );
    }
  } catch {
    attemptCounts = {};
  }
  const reconciled = reconcileProgressStorageJson(current, normalized, {
    xpTotal: Math.max(0, row?.baseline_xp ?? 0),
    attemptCounts,
  });
  if (reconciled === current && row !== null) return false;

  const now = Date.now();
  database.runSync(
    `INSERT INTO progress_state
       (owner_id, state_json, updated_at, deleted_at, server_version)
     VALUES (?, ?, ?, NULL, 0)
     ON CONFLICT(owner_id) DO UPDATE SET
       state_json = excluded.state_json,
       updated_at = excluded.updated_at,
       deleted_at = NULL;`,
    [ownerId, reconciled, now],
  );
  return true;
}
