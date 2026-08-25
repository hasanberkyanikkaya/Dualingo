import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { calculateGardenProgress } from '@/features/prayer/prayerGarden';

describe('calculateGardenProgress', () => {
  it('boş kayıt başlangıç bahçesidir', () => {
    const progress = calculateGardenProgress(0, 0);
    assert.equal(progress.stage, 'start');
    assert.equal(progress.plantCount, 0);
    assert.equal(progress.progressPercent, 0);
  });

  it('hem vakit sayısı hem aktif gün büyümeye katkı sağlar', () => {
    assert.equal(calculateGardenProgress(6, 1).growthPoints, 8);
    assert.equal(calculateGardenProgress(6, 1).stage, 'sprout');
    assert.equal(calculateGardenProgress(6, 3).growthPoints, 12);
  });

  it('eşiklerde aşamalar sırayla açılır', () => {
    assert.equal(calculateGardenProgress(8, 0).stage, 'sprout');
    assert.equal(calculateGardenProgress(30, 0).stage, 'growing');
    assert.equal(calculateGardenProgress(80, 0).stage, 'blooming');
    assert.equal(calculateGardenProgress(180, 0).stage, 'flourishing');
  });

  it('son aşama yüzde yüz kalır ve sonraki eşik üretmez', () => {
    const progress = calculateGardenProgress(180, 0);
    assert.equal(progress.progressPercent, 100);
    assert.equal(progress.nextThreshold, null);
  });

  it('bozuk ve negatif girdileri güvenli biçimde sıfırlar', () => {
    const progress = calculateGardenProgress(Number.NaN, -4);
    assert.equal(progress.totalPrayers, 0);
    assert.equal(progress.activeDays, 0);
  });

  it('aktif gün sayısı toplam kaydı aşamaz', () => {
    const progress = calculateGardenProgress(2, 20);
    assert.equal(progress.activeDays, 2);
    assert.equal(progress.growthPoints, 6);
  });
});
