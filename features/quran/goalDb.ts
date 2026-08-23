import { getDatabase } from '@/lib/database';

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
    `SELECT goal_id, goal_type, target_value, target_date, start_date,
            content_revision, reminder_enabled, reminder_hour, reminder_minute,
            created_at, updated_at, deleted_at
       FROM quran_goal
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1;`,
  );
  return row === null ? null : toGoal(row);
}

export function saveActiveQuranGoal(input: QuranGoalInput, now: Timestamp): QuranGoal | null {
  const database = getDatabase();
  if (database === null) {
    return null;
  }

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
        'UPDATE quran_goal SET deleted_at = ?, updated_at = ? WHERE deleted_at IS NULL;',
        [now, now],
      );
      database.runSync(
        `INSERT INTO quran_goal
           (goal_id, goal_type, target_value, target_date, start_date, content_revision,
            reminder_enabled, reminder_hour, reminder_minute, created_at, updated_at, deleted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL);`,
        [
          `goal-${now}`,
          input.type,
          input.targetValue,
          input.targetDate,
          input.startDate,
          input.contentRevision,
          input.reminderEnabled ? 1 : 0,
          input.reminderHour,
          input.reminderMinute,
          now,
          now,
        ],
      );
      return;
    }

    database.runSync(
      `UPDATE quran_goal
          SET content_revision = ?, reminder_enabled = ?, reminder_hour = ?,
              reminder_minute = ?, updated_at = ?, deleted_at = NULL
        WHERE goal_id = ?;`,
      [
        input.contentRevision,
        input.reminderEnabled ? 1 : 0,
        input.reminderHour,
        input.reminderMinute,
        now,
        current.goalId,
      ],
    );
  });

  return readActiveQuranGoal();
}

export function softDeleteActiveQuranGoal(now: Timestamp): void {
  const database = getDatabase();
  if (database === null) {
    return;
  }

  database.runSync(
    `UPDATE quran_goal
        SET deleted_at = ?, updated_at = ?
      WHERE deleted_at IS NULL;`,
    [now, now],
  );
}
