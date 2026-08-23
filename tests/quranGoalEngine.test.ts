import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildQuranGoalProgress,
  isQuranGoalDate,
  quranGoalMonthRange,
  validateQuranGoalInput,
} from '@/features/quran/goalEngine';

import type { QuranGoal, QuranGoalInput, QuranGoalRead } from '@/types';

const juzTotals = Array.from({ length: 30 }, () => 2);

function goal(overrides: Partial<QuranGoal> = {}): QuranGoal {
  return {
    goalId: 'goal-test',
    type: 'daily_pages',
    targetValue: 2,
    targetDate: null,
    startDate: '2026-08-20',
    contentRevision: 'test',
    reminderEnabled: true,
    reminderHour: 20,
    reminderMinute: 0,
    createdAt: 1,
    updatedAt: 1,
    deletedAt: null,
    ...overrides,
  };
}

function read(
  date: string,
  pageNumber: number,
  verseKey: string,
  juzNumber = 1,
): QuranGoalRead {
  return { date, pageNumber, verseKey, juzNumber, deletedAt: null };
}

describe('Kur’an hedef tarihleri', () => {
  it('takvimde olmayan tarihi reddeder', () => {
    assert.equal(isQuranGoalDate('2026-02-29'), false);
    assert.equal(isQuranGoalDate('2028-02-29'), true);
  });

  it('ay aralığını yıl ve artık gün sınırlarıyla kurar', () => {
    assert.deepEqual(quranGoalMonthRange('2028-02-14'), {
      from: '2028-02-01',
      to: '2028-02-29',
    });
    assert.equal(quranGoalMonthRange('bozuk'), null);
  });
});

describe('Kur’an hedef girdisi', () => {
  function input(overrides: Partial<QuranGoalInput> = {}): QuranGoalInput {
    return {
      type: 'daily_pages',
      targetValue: 2,
      targetDate: null,
      startDate: '2026-08-20',
      contentRevision: 'test',
      reminderEnabled: true,
      reminderHour: 20,
      reminderMinute: 0,
      ...overrides,
    };
  }

  it('geçerli günlük hedefi kabul eder', () => {
    assert.deepEqual(validateQuranGoalInput(input(), '2026-08-20'), []);
  });

  it('gelecek başlangıcı, taşan miktarı ve saati reddeder', () => {
    assert.deepEqual(
      validateQuranGoalInput(
        input({ startDate: '2026-08-21', targetValue: 605, reminderHour: 24 }),
        '2026-08-20',
      ),
      ['future_start_date', 'invalid_target_value', 'invalid_reminder_time'],
    );
  });

  it('hatim hedefinde bitiş tarihini zorunlu tutar', () => {
    assert.deepEqual(
      validateQuranGoalInput(input({ type: 'finish_by_date', targetValue: 604 }), '2026-08-20'),
      ['invalid_target_date'],
    );
  });
});

describe('Kur’an hedef ilerlemesi', () => {
  it('günlük hedefte aynı sayfayı bir kez sayar ve gün değişince sıfırlar', () => {
    const reads = [
      read('2026-08-20', 1, '1:1'),
      read('2026-08-20', 1, '1:2'),
      read('2026-08-20', 2, '2:1'),
      read('2026-08-21', 3, '2:6'),
    ];

    assert.equal(buildQuranGoalProgress(goal(), reads, 604, juzTotals, '2026-08-20').percent, 100);
    assert.equal(buildQuranGoalProgress(goal(), reads, 604, juzTotals, '2026-08-21').percent, 50);
  });

  it('silinmiş, bozuk, gelecek ve hedef öncesi okumaları yok sayar', () => {
    const deleted = { ...read('2026-08-20', 1, '1:1'), deletedAt: 10 };
    const reads = [
      deleted,
      read('2026-08-19', 2, '2:1'),
      read('2026-08-21', 3, '2:6'),
      read('bozuk', 4, '2:17'),
      read('2026-08-20', 0, 'bozuk'),
    ];

    assert.equal(buildQuranGoalProgress(goal(), reads, 604, juzTotals, '2026-08-20').completedPages, 0);
  });

  it('aylık cüz hedefini 604/30 sayfa eşdeğeriyle ölçer', () => {
    const reads = Array.from({ length: 21 }, (_, index) =>
      read('2026-08-20', index + 1, `1:${index + 1}`),
    );
    const progress = buildQuranGoalProgress(
      goal({ type: 'monthly_juz', targetValue: 1 }),
      reads,
      604,
      juzTotals,
      '2026-08-20',
    );

    assert.equal(progress.targetPages, 604 / 30);
    assert.equal(progress.status, 'complete');
  });

  it('aylık hedefte önceki ayı dışarıda bırakır', () => {
    const reads = [read('2026-08-31', 1, '1:1'), read('2026-09-01', 2, '1:2')];
    const progress = buildQuranGoalProgress(
      goal({ type: 'monthly_juz', targetValue: 1 }),
      reads,
      604,
      juzTotals,
      '2026-09-01',
    );

    assert.equal(progress.completedPages, 1);
    assert.equal(progress.periodStart, '2026-09-01');
    assert.equal(progress.periodEnd, '2026-09-30');
  });

  it('hatim hedefini son tarihten sonra gecikmiş sayar', () => {
    const progress = buildQuranGoalProgress(
      goal({ type: 'finish_by_date', targetValue: 604, targetDate: '2026-08-21' }),
      [read('2026-08-20', 1, '1:1')],
      604,
      juzTotals,
      '2026-08-22',
    );

    assert.equal(progress.status, 'overdue');
  });

  it('günlük ortalamadan tahmini bitiş tarihini üretir', () => {
    const reads = [
      read('2026-08-20', 1, '1:1'),
      read('2026-08-20', 2, '1:2'),
      read('2026-08-21', 3, '2:1'),
      read('2026-08-21', 4, '2:2'),
    ];
    const progress = buildQuranGoalProgress(goal(), reads, 10, juzTotals, '2026-08-21');

    assert.equal(progress.dailyAveragePages, 2);
    assert.equal(progress.estimatedCompletionDate, '2026-08-24');
  });

  it('okuma yokken uydurma tahmin üretmez', () => {
    const progress = buildQuranGoalProgress(goal(), [], 604, juzTotals, '2026-08-20');
    assert.equal(progress.estimatedCompletionDate, null);
  });

  it('cüz ızgarasında ayeti tekilleştirir ve oranı taşırmaz', () => {
    const reads = [
      read('2026-08-20', 1, '1:1'),
      read('2026-08-20', 1, '1:1'),
      read('2026-08-20', 2, '1:2'),
      read('2026-08-20', 3, '1:3'),
    ];
    const progress = buildQuranGoalProgress(goal(), reads, 604, juzTotals, '2026-08-20');

    assert.deepEqual(progress.juzProgress[0], {
      juzNumber: 1,
      readVerseCount: 2,
      totalVerseCount: 2,
      ratio: 1,
    });
  });
});
