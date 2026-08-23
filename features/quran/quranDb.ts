import { getDatabase } from '@/lib/database';

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

  database.runSync(
    `INSERT INTO quran_reading_position
       (position_id, verse_key, content_revision, saved_at, updated_at, deleted_at)
     VALUES ('last_read', ?, ?, ?, ?, NULL)
     ON CONFLICT(position_id) DO UPDATE SET
       verse_key        = excluded.verse_key,
       content_revision = excluded.content_revision,
       saved_at         = excluded.saved_at,
       updated_at       = excluded.updated_at,
       deleted_at       = NULL;`,
    [verseKey, contentRevision, at, at],
  );
}

export function readLastReadPosition(): QuranReadingPosition | null {
  const database = getDatabase();
  if (database === null) {
    return null;
  }

  const row = database.getFirstSync<PositionRow>(
    `SELECT position_id, verse_key, content_revision, saved_at, updated_at, deleted_at
       FROM quran_reading_position
      WHERE position_id = 'last_read' AND deleted_at IS NULL;`,
  );
  return row === null ? null : toPosition(row);
}

/** Aynı gün aynı ayeti tekrar yazmak sayacı artırmaz; yalnız zaman aralığını genişletir. */
export function recordQuranRead(date: IsoDate, verseKey: QuranVerseKey, at: Timestamp): void {
  const database = getDatabase();
  if (database === null) {
    return;
  }

  database.runSync(
    `INSERT INTO quran_read_event
       (date, verse_key, first_read_at, last_read_at, updated_at, deleted_at)
     VALUES (?, ?, ?, ?, ?, NULL)
     ON CONFLICT(date, verse_key) DO UPDATE SET
       first_read_at = MIN(quran_read_event.first_read_at, excluded.first_read_at),
       last_read_at  = MAX(quran_read_event.last_read_at, excluded.last_read_at),
       updated_at    = excluded.updated_at,
       deleted_at    = NULL;`,
    [date, verseKey, at, at, at],
  );
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
        WHERE date >= ? AND date <= ? AND deleted_at IS NULL
        ORDER BY date ASC, first_read_at ASC, verse_key ASC;`,
      [start, end],
    )
    .map(toReadEvent);
}

/** Geliştirme sıfırlaması için Kur'an ilerlemesi ve hedefini yumuşak siler. */
export function softDeleteAllQuranProgress(now: Timestamp): void {
  const database = getDatabase();
  if (database === null) {
    return;
  }

  database.withTransactionSync(() => {
    database.runSync(
      'UPDATE quran_reading_position SET deleted_at = ?, updated_at = ? WHERE deleted_at IS NULL;',
      [now, now],
    );
    database.runSync(
      'UPDATE quran_read_event SET deleted_at = ?, updated_at = ? WHERE deleted_at IS NULL;',
      [now, now],
    );
    database.runSync(
      'UPDATE quran_goal SET deleted_at = ?, updated_at = ? WHERE deleted_at IS NULL;',
      [now, now],
    );
  });
}
