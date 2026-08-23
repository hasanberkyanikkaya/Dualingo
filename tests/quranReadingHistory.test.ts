import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { summarizeQuranReadingDays } from '@/features/quran/readingHistory';

import type { QuranReadEvent } from '@/types';

function event(
  date: string,
  verseKey: string,
  firstReadAt: number,
  lastReadAt = firstReadAt,
): QuranReadEvent {
  return {
    date,
    verseKey,
    firstReadAt,
    lastReadAt,
    updatedAt: lastReadAt,
    deletedAt: null,
  };
}

describe('günlük Kur’an okuma özeti', () => {
  it('aynı gün aynı ayeti bir kez sayar ve zaman aralığını genişletir', () => {
    const summary = summarizeQuranReadingDays([
      event('2026-08-23', '99:1', 200, 250),
      event('2026-08-23', '99:1', 100, 300),
    ]);

    assert.deepEqual(summary, [
      {
        date: '2026-08-23',
        uniqueVerseCount: 1,
        firstReadAt: 100,
        lastReadAt: 300,
      },
    ]);
  });

  it('günleri sıralar ve farklı ayetleri ayrı sayar', () => {
    const summary = summarizeQuranReadingDays([
      event('2026-08-24', '99:1', 300),
      event('2026-08-23', '99:2', 200),
      event('2026-08-23', '99:1', 100),
    ]);

    assert.deepEqual(
      summary.map(({ date, uniqueVerseCount }) => ({ date, uniqueVerseCount })),
      [
        { date: '2026-08-23', uniqueVerseCount: 2 },
        { date: '2026-08-24', uniqueVerseCount: 1 },
      ],
    );
  });

  it('silinmiş, tarihi bozuk ve ters zamanlı olayları yok sayar', () => {
    const deleted = { ...event('2026-08-23', '99:1', 100), deletedAt: 200 };
    const summary = summarizeQuranReadingDays([
      deleted,
      event('23-08-2026', '99:2', 100),
      event('2026-08-23', '99:3', 200, 100),
    ]);

    assert.deepEqual(summary, []);
  });
});
