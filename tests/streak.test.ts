import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { advanceStreak, emptyStreak, toLocalIsoDate } from '@/features/progress/streak';

import type { StreakState } from '@/types';

const NOW = 1_755_000_000_000;

function streak(currentDays: number, longestDays: number, lastActiveDate: string): StreakState {
  return { currentDays, longestDays, lastActiveDate, updatedAt: NOW };
}

describe('toLocalIsoDate', () => {
  it("YEREL takvim gününü verir — akşam saatinde günü ileri ATMAZ", () => {
    // Yerel saatle 23:30. `toISOString()` kullanılsaydı UTC+3'te ertesi güne
    // düşerdi ve seri bir gün erken sayılırdı.
    const lateEvening = new Date(2026, 7, 19, 23, 30, 0).getTime();
    assert.equal(toLocalIsoDate(lateEvening), '2026-08-19');
  });

  it('ay ve günü iki basamağa doldurur', () => {
    assert.equal(toLocalIsoDate(new Date(2026, 0, 3, 12, 0, 0).getTime()), '2026-01-03');
  });
});

describe('advanceStreak', () => {
  it('aynı gün tekrar ders bitirmek seriyi ARTIRMAZ', () => {
    const next = advanceStreak(streak(5, 9, '2026-08-19'), '2026-08-19', NOW);

    assert.equal(next.currentDays, 5);
    assert.equal(next.longestDays, 9);
  });

  it('ertesi gün seriyi bir artırır', () => {
    assert.equal(advanceStreak(streak(5, 9, '2026-08-19'), '2026-08-20', NOW).currentDays, 6);
  });

  it('bir gün atlanınca seri 1e sıfırlanır', () => {
    assert.equal(advanceStreak(streak(5, 9, '2026-08-19'), '2026-08-21', NOW).currentDays, 1);
  });

  it('uzun boşluktan sonra da 1e sıfırlanır', () => {
    assert.equal(advanceStreak(streak(30, 30, '2026-01-01'), '2026-08-19', NOW).currentDays, 1);
  });

  it('longestDays ASLA düşmez', () => {
    assert.equal(advanceStreak(streak(5, 9, '2026-08-19'), '2026-08-21', NOW).longestDays, 9);
  });

  it('yeni rekor kurulunca longestDays yükselir', () => {
    assert.equal(advanceStreak(streak(9, 9, '2026-08-19'), '2026-08-20', NOW).longestDays, 10);
  });

  it('ilk ders (boş lastActiveDate) seriyi 1 yapar', () => {
    const next = advanceStreak(emptyStreak(), '2026-08-19', NOW);

    assert.equal(next.currentDays, 1);
    assert.equal(next.longestDays, 1);
    assert.equal(next.lastActiveDate, '2026-08-19');
  });

  it('ay sınırını doğru geçer', () => {
    assert.equal(advanceStreak(streak(3, 3, '2026-08-31'), '2026-09-01', NOW).currentDays, 4);
  });

  it('yıl sınırını doğru geçer', () => {
    assert.equal(advanceStreak(streak(3, 3, '2026-12-31'), '2027-01-01', NOW).currentDays, 4);
  });

  it('yaz saati geçişinin olduğu gün sınırını doğru sayar', () => {
    // 25 saatlik gün. Epoch farkı 86.400.000'e bölünseydi 1.04 çıkar,
    // yuvarlama yönüne göre seri kırılabilirdi.
    assert.equal(advanceStreak(streak(2, 2, '2026-10-24'), '2026-10-25', NOW).currentDays, 3);
  });

  it('bozuk tarih biçiminde seriyi güvenli tarafa (1) çeker', () => {
    assert.equal(advanceStreak(streak(5, 9, 'bozuk'), '2026-08-19', NOW).currentDays, 1);
  });

  it('ileri tarihli kayıt seriyi sıfırlar', () => {
    assert.equal(advanceStreak(streak(5, 9, '2026-08-25'), '2026-08-19', NOW).currentDays, 1);
  });
});
