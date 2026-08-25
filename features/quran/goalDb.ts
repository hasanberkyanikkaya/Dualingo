import { getDatabase } from '@/lib/database';
import { enqueueMutation, getActiveOwnerId } from '@/features/sync/localSyncDb';

import type { QuranGoal, QuranGoalInput, QuranGoalType, Timestamp } from '@/types';

type GoalRow = {
  goal_id: string;
  goal_type: string;
  target_value: number;
  target_date: string | null;
  start_date: string;
  content_revision: string;
  reminder_enabled: number;
  reminder_hour: number;
  reminder_minute: number;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
};

function isGoalType(value: string): value is QuranGoalType {
  return value === 'daily_pages' || value === 'monthly_juz' || value === 'finish_by_date';
}

function toGoal(row: GoalRow): QuranGoal | null {
  if (row.goal_id.length === 0 || !isGoalType(row.goal_type)) {
    return null;
  }

  return {
    goalId: row.goal_id,
    type: row.goal_type,
    targetValue: row.target_value,
    targetDate: row.target_date,
    startDate: row.start_date,
    contentRevision: row.content_revision,
    reminderEnabled: row.reminder_enabled !== 0,
    reminderHour: row.reminder_hour,
    reminderMinute: row.reminder_minute,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export function readActiveQuranGoal(): QuranGoal | null {
  const database = getDatabase();
  if (database === null) {
    return null;
  }

  const row = database.getFirstSync<GoalRow>(
    `SELECT g.goal_id, g.goal_type, g.target_value, g.target_date, g.start_date,
            g.content_revision,
            COALESCE(r.reminder_enabled, 0) AS reminder_enabled,
            COALESCE(r.reminder_hour, 20) AS reminder_hour,
            COALESCE(r.reminder_minute, 0) AS reminder_minute,
            g.created_at, g.updated_at, g.deleted_at
       FROM quran_goal AS g
       LEFT JOIN quran_goal_reminder AS r
         ON r.owner_id = g.owner_id AND r.goal_id = g.goal_id AND r.deleted_at IS NULL
      WHERE g.owner_id = ? AND g.deleted_at IS NULL
      ORDER BY g.created_at DESC
      LIMIT 1;`,
    [getActiveOwnerId(database)],
  );
  return row === null ? null : toGoal(row);
}

export function saveActiveQuranGoal(input: QuranGoalInput, now: Timestamp): QuranGoal | null {
  const database = getDatabase();
  if (database === null) {
    return null;
  }
  const ownerId = getActiveOwnerId(database);

  const current = readActiveQuranGoal();
  const definitionChanged =
    current === null ||
    current.type !== input.type ||
    current.targetValue !== input.targetValue ||
    current.targetDate !== input.targetDate ||
    current.startDate !== input.startDate;

  database.withTransactionSync(() => {
    if (definitionChanged) {
      database.runSync(
        `UPDATE quran_goal SET deleted_at = ?, updated_at = ?
          WHERE owner_id = ? AND deleted_at IS NULL;`,
        [now, now, ownerId],
      );
      if (current !== null) {
        enqueueMutation(database, 'quran_goal', current.goalId, 'delete', {
          goalId: current.goalId,
          goalType: current.type,
          targetValue: current.targetValue,
          targetDate: current.targetDate,
          startDate: current.startDate,
          contentRevision: current.contentRevision,
          createdAt: current.createdAt,
        }, now);
      }
      const goalId = `goal-${now}`;
      database.runSync(
        `INSERT INTO quran_goal
           (owner_id, goal_id, goal_type, target_value, target_date, start_date,
            content_revision, created_at, updated_at, deleted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL);`,
        [
          ownerId,
          goalId,
          input.type,
          input.targetValue,
          input.targetDate,
          input.startDate,
          input.contentRevision,
          now,
          now,
        ],
      );
      database.runSync(
        `INSERT INTO quran_goal_reminder
           (owner_id, goal_id, reminder_enabled, reminder_hour, reminder_minute,
            updated_at, deleted_at)
         VALUES (?, ?, ?, ?, ?, ?, NULL);`,
        [
          ownerId,
          goalId,
          input.reminderEnabled ? 1 : 0,
          input.reminderHour,
          input.reminderMinute,
          now,
        ],
      );
      enqueueMutation(
        database,
        'quran_goal',
        goalId,
        'upsert',
        {
          goalId,
          goalType: input.type,
          targetValue: input.targetValue,
          targetDate: input.targetDate,
          startDate: input.startDate,
          contentRevision: input.contentRevision,
          createdAt: now,
        },
        now,
      );
      return;
    }

    database.runSync(
      `UPDATE quran_goal
          SET content_revision = ?, updated_at = ?, deleted_at = NULL
        WHERE owner_id = ? AND goal_id = ?;`,
      [input.contentRevision, now, ownerId, current.goalId],
    );
    database.runSync(
      `INSERT INTO quran_goal_reminder
         (owner_id, goal_id, reminder_enabled, reminder_hour, reminder_minute,
          updated_at, deleted_at)
       VALUES (?, ?, ?, ?, ?, ?, NULL)
       ON CONFLICT(owner_id, goal_id) DO UPDATE SET
         reminder_enabled = excluded.reminder_enabled,
         reminder_hour = excluded.reminder_hour,
         reminder_minute = excluded.reminder_minute,
         updated_at = excluded.updated_at,
         deleted_at = NULL;`,
      [
        ownerId,
        current.goalId,
        input.reminderEnabled ? 1 : 0,
        input.reminderHour,
        input.reminderMinute,
        now,
      ],
    );
    enqueueMutation(
      database,
      'quran_goal',
      current.goalId,
      'upsert',
      {
        goalId: current.goalId,
        goalType: current.type,
        targetValue: current.targetValue,
        targetDate: current.targetDate,
        startDate: current.startDate,
        contentRevision: input.contentRevision,
        createdAt: current.createdAt,
      },
      now,
    );
  });

  return readActiveQuranGoal();
}

export function softDeleteActiveQuranGoal(now: Timestamp): void {
  const database = getDatabase();
  if (database === null) {
    return;
  }
  const ownerId = getActiveOwnerId(database);
  const current = readActiveQuranGoal();

  database.withTransactionSync(() => {
    database.runSync(
      `UPDATE quran_goal
          SET deleted_at = ?, updated_at = ?
        WHERE owner_id = ? AND deleted_at IS NULL;`,
      [now, now, ownerId],
    );
    if (current !== null) {
      enqueueMutation(database, 'quran_goal', current.goalId, 'delete', {
        goalId: current.goalId,
        goalType: current.type,
        targetValue: current.targetValue,
        targetDate: current.targetDate,
        startDate: current.startDate,
        contentRevision: current.contentRevision,
        createdAt: current.createdAt,
      }, now);
    }
  });
}
