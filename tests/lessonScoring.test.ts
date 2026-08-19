import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { REPEAT_XP_PERCENT, starsForRun, xpForRun } from '@/features/learning/lessonScoring';

/**
 * Faz 2.3'ün saf puanlama dosyası. Test koşucusu 2.4'te kurulduğu için bedava
 * kapsam — CLAUDE.md bunu söz vermişti.
 */

describe('starsForRun', () => {
  it('kusursuz koşu 3 yıldız verir', () => {
    assert.equal(starsForRun(5, 5), 3);
  });

  it('%80 tam sınırında 2 yıldız verir (kayan nokta tuzağı)', () => {
    // 4/5 = %80. Oranla hesaplansaydı 0.8000000000000001 gibi bir değer eşiğin
    // yanlış yanına düşebilirdi. Tam sayı aritmetiği bunu imkânsız kılıyor.
    assert.equal(starsForRun(4, 5), 2);
  });

  it('%80in bir altı 1 yıldıza düşer', () => {
    assert.equal(starsForRun(5, 7), 1); // ~%71
  });

  it('%60 tam sınırında 1 yıldız verir', () => {
    assert.equal(starsForRun(3, 5), 1);
  });

  it('%60ın altı 0 yıldız verir', () => {
    assert.equal(starsForRun(2, 5), 0);
  });

  it('%99 bile 3 yıldız VERMEZ — üçüncü eşik kusursuzluk ister', () => {
    assert.equal(starsForRun(99, 100), 2);
  });

  it('soru yoksa 0 yıldız, bölme yapılmaz', () => {
    assert.equal(starsForRun(0, 0), 0);
  });

  it('taşan doğru sayısı kırpılır', () => {
    assert.equal(starsForRun(9, 5), 3);
  });

  it('negatif doğru sayısı 0a kırpılır', () => {
    assert.equal(starsForRun(-3, 5), 0);
  });
});

describe('xpForRun', () => {
  it('ilk tamamlamada tam XP verir', () => {
    assert.equal(xpForRun(40, 'available'), 40);
  });

  it('tespit sınavıyla açılmış (skipped) seviye TAM XP alır', () => {
    // ⚠️ Yordayıcı `attemptCount` değil `status`: `skipped` seviyenin denemesi
    // sıfırdır ama ilk gerçek çalışması tam XP hak eder.
    assert.equal(xpForRun(40, 'skipped'), 40);
  });

  it('tekrar sadece %25 verir', () => {
    assert.equal(xpForRun(40, 'completed'), (40 * REPEAT_XP_PERCENT) / 100);
  });

  it('düşük ödüllü seviyenin tekrarı 0 DEĞİL en az 1 verir', () => {
    assert.equal(xpForRun(2, 'completed'), 1);
  });

  it('bozuk ödül değerinde 0 verir, NaN sızdırmaz', () => {
    assert.equal(xpForRun(Number.NaN, 'available'), 0);
    assert.equal(xpForRun(Number.POSITIVE_INFINITY, 'available'), 0);
    assert.equal(xpForRun(-10, 'available'), 0);
  });
});
