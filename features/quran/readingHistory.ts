import { isValidIsoDate } from '@/features/progress/streak';

import type { QuranReadEvent, QuranReadingDaySummary } from '@/types';

type DayAccumulator = {
  verseKeys: Set<string>;
  firstReadAt: number;
  lastReadAt: number;
};

/**
 * Olaylardan günlük benzersiz ayet özetini türetir.
 *
 * Girdi sırasına güvenmez, silinmiş/bozuk olayları atar ve aynı anahtarı
 * tekilleştirir. Bu dosya SQLite bilmez; Node testinde doğrudan sınanır.
 */
export function summarizeQuranReadingDays(
  events: readonly QuranReadEvent[],
): QuranReadingDaySummary[] {
  const days = new Map<string, DayAccumulator>();

  for (const event of events) {
    if (
      event.deletedAt !== null ||
      !isValidIsoDate(event.date) ||
      event.verseKey.length === 0 ||
      event.firstReadAt > event.lastReadAt
    ) {
      continue;
    }

    const current = days.get(event.date);
    if (current === undefined) {
      days.set(event.date, {
        verseKeys: new Set([event.verseKey]),
        firstReadAt: event.firstReadAt,
        lastReadAt: event.lastReadAt,
      });
      continue;
    }

    current.verseKeys.add(event.verseKey);
    current.firstReadAt = Math.min(current.firstReadAt, event.firstReadAt);
    current.lastReadAt = Math.max(current.lastReadAt, event.lastReadAt);
  }

  return [...days.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, day]) => ({
      date,
      uniqueVerseCount: day.verseKeys.size,
      firstReadAt: day.firstReadAt,
      lastReadAt: day.lastReadAt,
    }));
}
