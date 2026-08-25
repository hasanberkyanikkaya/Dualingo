import type { LessonSummary } from '@/features/learning/lessonSession';
import { createMutationId } from '@/features/sync/id';
import { enqueueMutation, getActiveOwnerId } from '@/features/sync/localSyncDb';
import { getDatabase } from '@/lib/database';

/** Ders sonuçlarını cihazlar arasında kayıpsız birleşebilen olaylar olarak saklar. */
export function recordLearningAttempt(summary: LessonSummary): void {
  const database = getDatabase();
  if (database === null) {
    return;
  }
  const ownerId = getActiveOwnerId(database);
  const attemptId = createMutationId();
  const at = summary.completedAt;

  database.withTransactionSync(() => {
    database.runSync(
      `INSERT INTO learning_attempt
         (owner_id, attempt_id, level_id, stars, accuracy, xp_earned,
          completed_at, updated_at, deleted_at, server_version)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, 0);`,
      [
        ownerId,
        attemptId,
        summary.levelId,
        summary.stars,
        summary.accuracy,
        Math.max(0, summary.xpEarned),
        at,
        at,
      ],
    );
    enqueueMutation(
      database,
      'learning_attempt',
      attemptId,
      'upsert',
      {
        attemptId,
        levelId: summary.levelId,
        stars: summary.stars,
        accuracy: summary.accuracy,
        xpEarned: Math.max(0, summary.xpEarned),
        completedAt: at,
      },
      at,
    );
  });
}

/** İlerleme sıfırlanınca eski olayların başka cihazdan XP'yi geri getirmesini önler. */
export function softDeleteAllLearningAttempts(at: number): void {
  const database = getDatabase();
  if (database === null) return;
  const ownerId = getActiveOwnerId(database);
  const rows = database.getAllSync<{
    attempt_id: string;
    level_id: string;
    stars: number;
    accuracy: number;
    xp_earned: number;
    completed_at: number;
  }>(
    `SELECT attempt_id, level_id, stars, accuracy, xp_earned, completed_at
       FROM learning_attempt
      WHERE owner_id = ? AND deleted_at IS NULL;`,
    [ownerId],
  );

  database.withTransactionSync(() => {
    for (const row of rows) {
      database.runSync(
        `UPDATE learning_attempt SET updated_at = ?, deleted_at = ?
          WHERE owner_id = ? AND attempt_id = ?;`,
        [at, at, ownerId, row.attempt_id],
      );
      enqueueMutation(
        database,
        'learning_attempt',
        row.attempt_id,
        'delete',
        {
          attemptId: row.attempt_id,
          levelId: row.level_id,
          stars: row.stars,
          accuracy: row.accuracy,
          xpEarned: row.xp_earned,
          completedAt: row.completed_at,
        },
        at,
      );
    }
    database.runSync(
      `UPDATE progress_state
          SET baseline_xp = 0, baseline_attempt_counts_json = '{}', updated_at = ?
        WHERE owner_id = ?;`,
      [at, ownerId],
    );
  });
}
