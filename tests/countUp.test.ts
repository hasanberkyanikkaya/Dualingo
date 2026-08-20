import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { countUpValue } from '@/lib/countUp';

/**
 * Faz 3.3'ün sayan XP sayacının saf çekirdeği. Bileşen test edilemiyor (yerel
 * modül), ama ekranda `NaN XP` yazması sınıfındaki hata burada yakalanır.
 */

const DURATION = 700;

describe('countUpValue', () => {
  it('başlangıçta sıfırdadır', () => {
    assert.equal(countUpValue(40, 0, DURATION), 0);
  });

  it('süre dolunca TAM hedefe ulaşır', () => {
    assert.equal(countUpValue(40, DURATION, DURATION), 40);
  });

  it('süreyi aşınca hedefte kalır', () => {
    assert.equal(countUpValue(40, DURATION * 3, DURATION), 40);
  });

  it('hedefi hiçbir ara noktada AŞMAZ', () => {
    // `Easing.back` gibi taşan bir yumuşatma kullanılsaydı sayaç 41 gösterip
    // 40'a geri düşerdi — kazanılan XP yanlış okunur.
    for (let elapsed = 0; elapsed <= DURATION; elapsed += 10) {
      const value = countUpValue(40, elapsed, DURATION);
      assert.ok(value >= 0 && value <= 40, `${elapsed} ms: ${value}`);
    }
  });

  it('geri saymaz — monoton artar', () => {
    let previous = 0;
    for (let elapsed = 0; elapsed <= DURATION; elapsed += 10) {
      const value = countUpValue(40, elapsed, DURATION);
      assert.ok(value >= previous, `${elapsed} ms: ${value} < ${previous}`);
      previous = value;
    }
  });

  it('sona kadar bitmiş görünmez', () => {
    // Yuvarlama `floor` yerine `round` olsaydı sayaç son karelerden çok önce
    // hedefi yazar ve animasyon bitmeden bitmiş görünürdü.
    assert.ok(countUpValue(40, DURATION - 1, DURATION) < 40);
  });

  it('negatif süre (gecikme beklerken) sıfırdır', () => {
    // `useCountUp` sahne gecikmesini negatif `elapsed` olarak geçiriyor.
    assert.equal(countUpValue(40, -500, DURATION), 0);
  });

  describe('bozuk girdi sessizce HEDEFİ verir', () => {
    it('duration sıfır ya da negatif', () => {
      assert.equal(countUpValue(40, 10, 0), 40);
      assert.equal(countUpValue(40, 10, -5), 40);
    });

    it('NaN', () => {
      assert.equal(countUpValue(40, Number.NaN, DURATION), 40);
      assert.equal(countUpValue(40, 10, Number.NaN), 40);
    });

    it('Infinity', () => {
      assert.equal(countUpValue(40, Number.POSITIVE_INFINITY, DURATION), 40);
      assert.equal(countUpValue(40, 10, Number.POSITIVE_INFINITY), 40);
    });

    it('bozuk HEDEF asla NaN sızdırmaz', () => {
      assert.equal(countUpValue(Number.NaN, 10, DURATION), 0);
      assert.equal(countUpValue(Number.POSITIVE_INFINITY, 10, DURATION), 0);
    });
  });

  it('sıfır XP sıfır kalır', () => {
    // XP'siz bir koşu yok ama tespit sınavı XP vermiyor; sayaç 0'da durmalı.
    assert.equal(countUpValue(0, 10, DURATION), 0);
    assert.equal(countUpValue(0, DURATION, DURATION), 0);
  });
});
