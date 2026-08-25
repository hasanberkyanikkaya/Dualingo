import { getDatabase } from '@/lib/database';
import { enqueueMutation, getActiveOwnerId } from '@/features/sync/localSyncDb';

import type {
  IsoDate,
  QuranReadEvent,
  QuranReadingPosition,
  QuranVerseKey,
  Timestamp,
} from '@/types';

type PositionRow = {
  position_id: 'last_read';
  verse_key: string;
  content_revision: string;
  saved_at: number;
  updated_at: number;
  deleted_at: number | null;
};

type ReadEventRow = {
  date: string;
  verse_key: string;
  first_read_at: number;
  last_read_at: number;
  updated_at: number;
  deleted_at: number | null;
};

function toPosition(row: PositionRow): QuranReadingPosition {
  return {
    positionId: row.position_id,
    verseKey: row.verse_key,
    contentRevision: row.content_revision,
    savedAt: row.saved_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

function toReadEvent(row: ReadEventRow): QuranReadEvent {
  return {
    date: row.date,
    verseKey: row.verse_key,
    firstReadAt: row.first_read_at,
    lastReadAt: row.last_read_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

/** Son görülen ayeti tekil `last_read` kaydı olarak yazar ve silinmişse diriltir. */
export function saveLastReadPosition(
  verseKey: QuranVerseKey,
  contentRevision: string,
  at: Timestamp,
): void {
  const database = getDatabase();
  if (database === null) {
    return;
  }
  const ownerId = getActiveOwnerId(database);

  database.withTransactionSync(() => {
    database.runSync(
    `INSERT INTO quran_reading_position
       (owner_id, position_id, verse_key, content_revision, saved_at, updated_at, deleted_at)
     VALUES (?, 'last_read', ?, ?, ?, ?, NULL)
     ON CONFLICT(owner_id, position_id) DO UPDATE SET
       verse_key        = excluded.verse_key,
       content_revision = excluded.content_revision,
       saved_at         = excluded.saved_at,
       updated_at       = excluded.updated_at,
       deleted_at       = NULL;`,
      [ownerId, verseKey, contentRevision, at, at],
    );
    enqueueMutation(
      database,
      'quran_reading_position',
      'last_read',
      'upsert',
      { positionId: 'last_read', verseKey, contentRevision, savedAt: at },
      at,
    );
  });
}

export function readLastReadPosition(): QuranReadingPosition | null {
  const database = getDatabase();
  if (database === null) {
    return null;
  }

  const row = database.getFirstSync<PositionRow>(
    `SELECT position_id, verse_key, content_revision, saved_at, updated_at, deleted_at
      FROM quran_reading_position
      WHERE owner_id = ? AND position_id = 'last_read' AND deleted_at IS NULL;`,
    [getActiveOwnerId(database)],
  );
  return row === null ? null : toPosition(row);
}

/** Aynı gün aynı ayeti tekrar yazmak sayacı artırmaz; yalnız zaman aralığını genişletir. */
export function recordQuranRead(date: IsoDate, verseKey: QuranVerseKey, at: Timestamp): void {
  const database = getDatabase();
  if (database === null) {
    return;
  }
  const ownerId = getActiveOwnerId(database);

  database.withTransactionSync(() => {
    database.runSync(
    `INSERT INTO quran_read_event
       (owner_id, date, verse_key, first_read_at, last_read_at, updated_at, deleted_at)
     VALUES (?, ?, ?, ?, ?, ?, NULL)
     ON CONFLICT(owner_id, date, verse_key) DO UPDATE SET
       first_read_at = MIN(quran_read_event.first_read_at, excluded.first_read_at),
       last_read_at  = MAX(quran_read_event.last_read_at, excluded.last_read_at),
       updated_at    = excluded.updated_at,
       deleted_at    = NULL;`,
      [ownerId, date, verseKey, at, at, at],
    );
    const row = database.getFirstSync<{ first_read_at: number; last_read_at: number }>(
      `SELECT first_read_at, last_read_at FROM quran_read_event
        WHERE owner_id = ? AND date = ? AND verse_key = ?;`,
      [ownerId, date, verseKey],
    );
    if (row !== null) {
      enqueueMutation(
        database,
        'quran_read_event',
        `${date}:${verseKey}`,
        'upsert',
        {
          date,
          verseKey,
          firstReadAt: row.first_read_at,
          lastReadAt: row.last_read_at,
        },
        at,
      );
    }
  });
}

export function readQuranEventsBetween(start: IsoDate, end: IsoDate): QuranReadEvent[] {
  const database = getDatabase();
  if (database === null) {
    return [];
  }

  return database
    .getAllSync<ReadEventRow>(
      `SELECT date, verse_key, first_read_at, last_read_at, updated_at, deleted_at
         FROM quran_read_event
        WHERE owner_id = ? AND date >= ? AND date <= ? AND deleted_at IS NULL
        ORDER BY date ASC, first_read_at ASC, verse_key ASC;`,
      [getActiveOwnerId(database), start, end],
    )
    .map(toReadEvent);
}

/** Geliştirme sıfırlaması için Kur'an ilerlemesi ve hedefini yumuşak siler. */
export function softDeleteAllQuranProgress(now: Timestamp): void {
  const database = getDatabase();
  if (database === null) {
    return;
  }
  const ownerId = getActiveOwnerId(database);

  database.withTransactionSync(() => {
    const positions = database.getAllSync<{
      position_id: string; verse_key: string; content_revision: string; saved_at: number;
    }>(
      `SELECT position_id, verse_key, content_revision, saved_at FROM quran_reading_position
        WHERE owner_id = ? AND deleted_at IS NULL;`,
      [ownerId],
    );
    const events = database.getAllSync<{
      date: string; verse_key: string; first_read_at: number; last_read_at: number;
    }>(
      `SELECT date, verse_key, first_read_at, last_read_at FROM quran_read_event
        WHERE owner_id = ? AND deleted_at IS NULL;`,
      [ownerId],
    );
    const goals = database.getAllSync<{
      goal_id: string; goal_type: string; target_value: number; target_date: string | null;
      start_date: string; content_revision: string; created_at: number;
    }>(
      `SELECT goal_id, goal_type, target_value, target_date, start_date,
              content_revision, created_at FROM quran_goal
        WHERE owner_id = ? AND deleted_at IS NULL;`,
      [ownerId],
    );
    database.runSync(
      `UPDATE quran_reading_position SET deleted_at = ?, updated_at = ?
        WHERE owner_id = ? AND deleted_at IS NULL;`,
      [now, now, ownerId],
    );
    database.runSync(
      `UPDATE quran_read_event SET deleted_at = ?, updated_at = ?
        WHERE owner_id = ? AND deleted_at IS NULL;`,
      [now, now, ownerId],
    );
    database.runSync(
      `UPDATE quran_goal SET deleted_at = ?, updated_at = ?
        WHERE owner_id = ? AND deleted_at IS NULL;`,
      [now, now, ownerId],
    );
    for (const row of positions) {
      enqueueMutation(database, 'quran_reading_position', row.position_id, 'delete', {
        positionId: row.position_id,
        verseKey: row.verse_key,
        contentRevision: row.content_revision,
        savedAt: row.saved_at,
      }, now);
    }
    for (const row of events) {
      enqueueMutation(
        database,
        'quran_read_event',
        `${row.date}:${row.verse_key}`,
        'delete',
        {
          date: row.date,
          verseKey: row.verse_key,
          firstReadAt: row.first_read_at,
          lastReadAt: row.last_read_at,
        },
        now,
      );
    }
    for (const row of goals) {
      enqueueMutation(database, 'quran_goal', row.goal_id, 'delete', {
        goalId: row.goal_id,
        goalType: row.goal_type,
        targetValue: row.target_value,
        targetDate: row.target_date,
        startDate: row.start_date,
        contentRevision: row.content_revision,
        createdAt: row.created_at,
      }, now);
    }
  });
}
