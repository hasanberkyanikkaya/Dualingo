import { getDatabase } from '@/lib/database';

import { getActiveOwnerId, hasPrayerSyncConsent, withoutEnqueue } from './localSyncDb';
import { earliestTimestamp, mergeActivity, mergeReadEvent, shouldApplyRemote } from './merge';
import type { JsonObject, JsonValue, RemoteSyncChange } from './types';

function stringValue(payload: JsonObject, key: string): string | null {
  const value: JsonValue | undefined = payload[key];
  return typeof value === 'string' ? value : null;
}

function numberValue(payload: JsonObject, key: string): number | null {
  const value: JsonValue | undefined = payload[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function localVersion(
  table: string,
  ownerId: string,
  keySql: string,
  params: readonly (string | number | null)[],
): number {
  const database = getDatabase();
  if (database === null) {
    return 0;
  }
  const row = database.getFirstSync<{ server_version: number }>(
    `SELECT server_version FROM ${table} WHERE owner_id = ? AND ${keySql};`,
    [ownerId, ...params],
  );
  return row?.server_version ?? 0;
}

export function applyRemoteChange(change: RemoteSyncChange): boolean {
  const database = getDatabase();
  if (database === null) {
    return false;
  }
  const ownerId = getActiveOwnerId(database);
  if (change.entity_type === 'prayer_log' && !hasPrayerSyncConsent(database)) {
    return false;
  }

  return withoutEnqueue(() => {
    switch (change.entity_type) {
      case 'activity_day': {
        const date = stringValue(change.payload, 'date');
        const firstAt = numberValue(change.payload, 'firstAt');
        const lastAt = numberValue(change.payload, 'lastAt');
        const lessonCount = numberValue(change.payload, 'lessonCount');
        const xpEarned = numberValue(change.payload, 'xpEarned');
        if (date === null || firstAt === null || lastAt === null || lessonCount === null || xpEarned === null) return false;
        if (!shouldApplyRemote(localVersion('activity_day', ownerId, 'date = ?', [date]), change.server_version)) return false;
        const local = database.getFirstSync<{ first_at: number; last_at: number; lesson_count: number; xp_earned: number }>(
          'SELECT first_at, last_at, lesson_count, xp_earned FROM activity_day WHERE owner_id = ? AND date = ?;',
          [ownerId, date],
        );
        const merged = local === null ? { firstAt, lastAt, lessonCount, xpEarned } : mergeActivity(
          { firstAt: local.first_at, lastAt: local.last_at, lessonCount: local.lesson_count, xpEarned: local.xp_earned },
          { firstAt, lastAt, lessonCount, xpEarned },
        );
        database.runSync(
          `INSERT INTO activity_day
             (owner_id, date, first_at, last_at, lesson_count, xp_earned, updated_at, deleted_at, server_version)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(owner_id, date) DO UPDATE SET
             first_at = excluded.first_at, last_at = excluded.last_at,
             lesson_count = excluded.lesson_count, xp_earned = excluded.xp_earned,
             updated_at = excluded.updated_at, deleted_at = excluded.deleted_at,
             server_version = excluded.server_version;`,
          [ownerId, date, merged.firstAt, merged.lastAt, merged.lessonCount, merged.xpEarned, Date.now(), change.deleted_at, change.server_version],
        );
        return true;
      }
      case 'badge_unlock': {
        const badgeId = stringValue(change.payload, 'badgeId');
        const earnedAt = numberValue(change.payload, 'earnedAt');
        if (badgeId === null || earnedAt === null) return false;
        if (!shouldApplyRemote(localVersion('badge_unlock', ownerId, 'badge_id = ?', [badgeId]), change.server_version)) return false;
        const local = database.getFirstSync<{ earned_at: number }>(
          'SELECT earned_at FROM badge_unlock WHERE owner_id = ? AND badge_id = ?;', [ownerId, badgeId],
        );
        database.runSync(
          `INSERT INTO badge_unlock
             (owner_id, badge_id, earned_at, updated_at, deleted_at, server_version)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT(owner_id, badge_id) DO UPDATE SET
             earned_at = excluded.earned_at, updated_at = excluded.updated_at,
             deleted_at = excluded.deleted_at, server_version = excluded.server_version;`,
          [ownerId, badgeId, local === null ? earnedAt : earliestTimestamp(local.earned_at, earnedAt), Date.now(), change.deleted_at, change.server_version],
        );
        return true;
      }
      case 'learning_attempt': {
        const attemptId = stringValue(change.payload, 'attemptId');
        const levelId = stringValue(change.payload, 'levelId');
        const stars = numberValue(change.payload, 'stars');
        const accuracy = numberValue(change.payload, 'accuracy');
        const xpEarned = numberValue(change.payload, 'xpEarned');
        const completedAt = numberValue(change.payload, 'completedAt');
        if (attemptId === null || levelId === null || stars === null || accuracy === null || xpEarned === null || completedAt === null) return false;
        const existingVersion = localVersion('learning_attempt', ownerId, 'attempt_id = ?', [attemptId]);
        if (!shouldApplyRemote(existingVersion, change.server_version)) return false;
        database.runSync(
          `INSERT INTO learning_attempt
             (owner_id, attempt_id, level_id, stars, accuracy, xp_earned,
              completed_at, updated_at, deleted_at, server_version)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(owner_id, attempt_id) DO UPDATE SET
             deleted_at = excluded.deleted_at, server_version = excluded.server_version;`,
          [ownerId, attemptId, levelId, stars, accuracy, xpEarned, completedAt, Date.now(), change.deleted_at, change.server_version],
        );
        return true;
      }
      case 'progress_state': {
        const state = stringValue(change.payload, 'state');
        const baselineXp = numberValue(change.payload, 'baselineXp') ?? 0;
        const baselineAttemptCounts = stringValue(change.payload, 'baselineAttemptCounts') ?? '{}';
        if (state === null) return false;
        if (!shouldApplyRemote(localVersion('progress_state', ownerId, '1 = 1', []), change.server_version)) return false;
        database.runSync(
          `INSERT INTO progress_state
             (owner_id, state_json, baseline_xp, baseline_attempt_counts_json,
              updated_at, deleted_at, server_version)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(owner_id) DO UPDATE SET state_json = excluded.state_json,
             baseline_xp = excluded.baseline_xp,
             baseline_attempt_counts_json = excluded.baseline_attempt_counts_json,
             updated_at = excluded.updated_at, deleted_at = excluded.deleted_at,
             server_version = excluded.server_version;`,
          [ownerId, state, Math.max(0, baselineXp), baselineAttemptCounts,
            Date.now(), change.deleted_at, change.server_version],
        );
        return true;
      }
      case 'prayer_log': {
        const date = stringValue(change.payload, 'date');
        const prayer = stringValue(change.payload, 'prayer');
        if (date === null || prayer === null) return false;
        if (!shouldApplyRemote(localVersion('prayer_log', ownerId, 'date = ? AND prayer = ?', [date, prayer]), change.server_version)) return false;
        database.runSync(
          `INSERT INTO prayer_log
             (owner_id, date, prayer, status, updated_at, deleted_at, server_version)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(owner_id, date, prayer) DO UPDATE SET status = excluded.status,
             updated_at = excluded.updated_at, deleted_at = excluded.deleted_at,
             server_version = excluded.server_version;`,
          [ownerId, date, prayer, 'kilindi', Date.now(), change.deleted_at, change.server_version],
        );
        return true;
      }
      case 'quran_reading_position': {
        const positionId = stringValue(change.payload, 'positionId') ?? 'last_read';
        const verseKey = stringValue(change.payload, 'verseKey');
        const contentRevision = stringValue(change.payload, 'contentRevision');
        const savedAt = numberValue(change.payload, 'savedAt');
        if (verseKey === null || contentRevision === null || savedAt === null) return false;
        if (!shouldApplyRemote(localVersion('quran_reading_position', ownerId, 'position_id = ?', [positionId]), change.server_version)) return false;
        database.runSync(
          `INSERT INTO quran_reading_position
             (owner_id, position_id, verse_key, content_revision, saved_at,
              updated_at, deleted_at, server_version)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(owner_id, position_id) DO UPDATE SET verse_key = excluded.verse_key,
             content_revision = excluded.content_revision, saved_at = excluded.saved_at,
             updated_at = excluded.updated_at, deleted_at = excluded.deleted_at,
             server_version = excluded.server_version;`,
          [ownerId, positionId, verseKey, contentRevision, savedAt, Date.now(), change.deleted_at, change.server_version],
        );
        return true;
      }
      case 'quran_read_event': {
        const date = stringValue(change.payload, 'date');
        const verseKey = stringValue(change.payload, 'verseKey');
        const firstReadAt = numberValue(change.payload, 'firstReadAt');
        const lastReadAt = numberValue(change.payload, 'lastReadAt');
        if (date === null || verseKey === null || firstReadAt === null || lastReadAt === null) return false;
        if (!shouldApplyRemote(localVersion('quran_read_event', ownerId, 'date = ? AND verse_key = ?', [date, verseKey]), change.server_version)) return false;
        const local = database.getFirstSync<{ first_read_at: number; last_read_at: number }>(
          'SELECT first_read_at, last_read_at FROM quran_read_event WHERE owner_id = ? AND date = ? AND verse_key = ?;',
          [ownerId, date, verseKey],
        );
        const merged = local === null ? { firstReadAt, lastReadAt } : mergeReadEvent(
          { firstReadAt: local.first_read_at, lastReadAt: local.last_read_at }, { firstReadAt, lastReadAt },
        );
        database.runSync(
          `INSERT INTO quran_read_event
             (owner_id, date, verse_key, first_read_at, last_read_at,
              updated_at, deleted_at, server_version)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(owner_id, date, verse_key) DO UPDATE SET
             first_read_at = excluded.first_read_at, last_read_at = excluded.last_read_at,
             updated_at = excluded.updated_at, deleted_at = excluded.deleted_at,
             server_version = excluded.server_version;`,
          [ownerId, date, verseKey, merged.firstReadAt, merged.lastReadAt, Date.now(), change.deleted_at, change.server_version],
        );
        return true;
      }
      case 'quran_goal': {
        const goalId = stringValue(change.payload, 'goalId');
        const goalType = stringValue(change.payload, 'goalType');
        const targetValue = numberValue(change.payload, 'targetValue');
        const targetDateValue = change.payload.targetDate;
        const targetDate = typeof targetDateValue === 'string' ? targetDateValue : null;
        const startDate = stringValue(change.payload, 'startDate');
        const contentRevision = stringValue(change.payload, 'contentRevision');
        const createdAt = numberValue(change.payload, 'createdAt');
        if (goalId === null || goalType === null || targetValue === null || startDate === null || contentRevision === null || createdAt === null) return false;
        if (!shouldApplyRemote(localVersion('quran_goal', ownerId, 'goal_id = ?', [goalId]), change.server_version)) return false;
        database.runSync(
          `INSERT INTO quran_goal
             (owner_id, goal_id, goal_type, target_value, target_date, start_date,
              content_revision, created_at, updated_at, deleted_at, server_version)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(owner_id, goal_id) DO UPDATE SET goal_type = excluded.goal_type,
             target_value = excluded.target_value, target_date = excluded.target_date,
             start_date = excluded.start_date, content_revision = excluded.content_revision,
             updated_at = excluded.updated_at, deleted_at = excluded.deleted_at,
             server_version = excluded.server_version;`,
          [ownerId, goalId, goalType, targetValue, targetDate, startDate, contentRevision, createdAt, Date.now(), change.deleted_at, change.server_version],
        );
        return true;
      }
    }
  });
}
