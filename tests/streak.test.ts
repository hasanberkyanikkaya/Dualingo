import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { addDays, dayDifference, emptyStreak, toLocalIsoDate } from '@/features/progress/streak';

/**
 * Yerel gün aritmetiği testleri.
 *
 * ⚠️ Seri KARARLARI burada sınanmıyor — onlar `tests/dayLog.test.ts`te.
 * Faz 3.1 öncesinde bu dosyada `advanceStreak`in 11 testi vardı; fonksiyon
 * kaldırıldığı için o vakalar `computeStreak` üzerine taşındı.
 */

describe('toLocalIsoDate', () => {
  it('akşam saatinde günü ileri atmaz (UTC kayması yok)', () => {
    // 19 Ağustos 23:30 YEREL. `toISOString()` kullanılsaydı Türkiye'de 20'ye
    // düşerdi ve o günün dersi ertesi güne yazılırdı.
    const evening = new Date(2026, 7, 19, 23, 30).getTime();
    assert.equal(toLocalIsoDate(evening), '2026-08-19');
  });

  it('ay ve günü iki basamağa doldurur', () => {
    assert.equal(toLocalIsoDate(new Date(2026, 0, 3, 12).getTime()), '2026-01-03');
  });
});

describe('dayDifference', () => {
  it('aynı gün için 0 verir', () => {
    assert.equal(dayDifference('2026-08-19', '2026-08-19'), 0);
  });

  it('ertesi gün için 1 verir', () => {
    assert.equal(dayDifference('2026-08-19', '2026-08-20'), 1);
  });

  it('geriye doğru negatif verir', () => {
    assert.equal(dayDifference('2026-08-20', '2026-08-19'), -1);
  });

  it('ay sınırını doğru geçer', () => {
    assert.equal(dayDifference('2026-08-31', '2026-09-01'), 1);
  });

  it('yıl sınırını doğru geçer', () => {
    assert.equal(dayDifference('2026-12-31', '2027-01-01'), 1);
  });

  it('yaz saati geçişindeki 25 saatlik günü 1 sayar', () => {
    // Avrupa'da yaz saati 25 Ekim 2026'da bitiyor; o gün 25 saat sürüyor.
    // Epoch farkını 86.400.000'e bölmek burada 1,04 verir ve `Math.floor` ile
    // 1'e düşse bile ters yöndeki geçiş (23 saat) 0,96 → 0 verirdi.
    assert.equal(dayDifference('2026-10-24', '2026-10-25'), 1);
    assert.equal(dayDifference('2026-10-25', '2026-10-26'), 1);
  });

  it('biçimi bozuk tarih için null verir', () => {
    assert.equal(dayDifference('', '2026-08-19'), null);
    assert.equal(dayDifference('2026-8-19', '2026-08-19'), null);
    assert.equal(dayDifference('2026-08-19', 'bugün'), null);
  });
});

describe('addDays', () => {
  it('gün ekler ve ay sınırını geçer', () => {
    assert.equal(addDays('2026-08-31', 1), '2026-09-01');
  });

  it('negatif değerle geri gider', () => {
    assert.equal(addDays('2027-01-01', -1), '2026-12-31');
  });

  it('yaz saati geçişinde gün kaydırmaz', () => {
    // Yerel saatle toplansaydı 25 saatlik gün sonucu aynı güne düşürebilirdi.
    assert.equal(addDays('2026-10-24', 1), '2026-10-25');
    assert.equal(addDays('2026-10-25', 1), '2026-10-26');
  });

  it('biçimi bozuk tarih için null verir', () => {
    assert.equal(addDays('yarın', 1), null);
  });
});

describe('emptyStreak', () => {
  it('sıfırlanmış seri verir', () => {
    assert.deepEqual(emptyStreak(), {
      currentDays: 0,
      longestDays: 0,
      lastActiveDate: '',
      updatedAt: 0,
    });
  });
});
