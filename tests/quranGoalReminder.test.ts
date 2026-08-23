import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  formatQuranReminderTime,
  parseQuranReminderTime,
  quranReminderSignature,
} from '@/features/quran/goalReminder';

import type { QuranGoal } from '@/types';

function goal(overrides: Partial<QuranGoal> = {}): QuranGoal {
  return {
    goalId: 'goal-test',
    type: 'daily_pages',
    targetValue: 2,
    targetDate: null,
    startDate: '2026-08-23',
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

describe('Kur’an hedef hatırlatma saati', () => {
  it('tek basamaklı saati okur ve sıfırla doldurur', () => {
    assert.deepEqual(parseQuranReminderTime('9:05'), { hour: 9, minute: 5 });
    assert.equal(formatQuranReminderTime(9, 5), '09:05');
  });

  it('aralık dışı ve bozuk saati reddeder', () => {
    assert.equal(parseQuranReminderTime('24:00'), null);
    assert.equal(parseQuranReminderTime('20:7'), null);
    assert.equal(formatQuranReminderTime(-1, 0), '');
  });

  it('açık hedefi tek günlük plan imzasına çevirir', () => {
    assert.equal(quranReminderSignature(goal()), 'quran-goal@20:00');
  });

  it('kapalı veya silinmiş hedef için plan üretmez', () => {
    assert.equal(quranReminderSignature(goal({ reminderEnabled: false })), 'off');
    assert.equal(quranReminderSignature(goal({ deletedAt: 2 })), 'off');
    assert.equal(quranReminderSignature(null), 'off');
  });
});
