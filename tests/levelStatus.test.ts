import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  countCompleted,
  findCurrentLevelId,
  resolveLevelStatus,
  resolveStars,
} from '@/features/learning/levelStatus';

import type { LevelId, LevelProgress, LevelStatus, StarCount, Unit } from '@/types';

/**
 * Faz 2.1'in durum türetme dosyası. 2.4'te ilk kez GERÇEK veriyle besleniyor,
 * dolayısıyla kuralları ilk kez gerçekten önemli.
 */

const NOW = 1_755_000_000_000;

function record(
  levelId: LevelId,
  status: LevelStatus,
  stars: StarCount = 0,
  deletedAt: number | null = null,
): LevelProgress {
  return { levelId, status, stars, bestAccuracy: 0, attemptCount: 0, updatedAt: NOW, deletedAt };
}

function makeUnits(): Unit[] {
  const level = (id: LevelId, order: number) => ({
    id,
    title: id,
    order,
    difficulty: 'beginner' as const,
    xpReward: 10,
    questions: [],
  });

  return [
    { id: 'u1', title: 'Ünite 1', order: 1, levels: [level('a1', 1), level('a2', 2)] },
    { id: 'u2', title: 'Ünite 2', order: 2, levels: [level('b1', 1)] },
  ];
}

describe('resolveLevelStatus', () => {
  it('kaydı olmayan seviye kilitlidir', () => {
    assert.equal(resolveLevelStatus('a1', {}), 'locked');
  });

  it('YUMUŞAK SİLİNMİŞ kayıt yok sayılır — seviye kilitli görünür', () => {
    // Mimari kural 6. Kayıt "completed" diyor ama `deletedAt` dolu.
    const levels = { a1: record('a1', 'completed', 3, NOW) };
    assert.equal(resolveLevelStatus('a1', levels), 'locked');
  });

  it('yaşayan kaydın durumunu aynen verir', () => {
    assert.equal(resolveLevelStatus('a1', { a1: record('a1', 'skipped') }), 'skipped');
  });
});

describe('resolveStars', () => {
  it('tamamlanmamış seviyenin yıldızı gösterilmez', () => {
    // Eski bir yıldız kalıntısı `available` bir seviyede görünmemeli.
    assert.equal(resolveStars('a1', { a1: record('a1', 'available', 3) }), 0);
  });

  it('tamamlanmış seviyenin yıldızını verir', () => {
    assert.equal(resolveStars('a1', { a1: record('a1', 'completed', 2) }), 2);
  });

  it('yumuşak silinmiş kaydın yıldızını vermez', () => {
    assert.equal(resolveStars('a1', { a1: record('a1', 'completed', 3, NOW) }), 0);
  });
});

describe('findCurrentLevelId', () => {
  it('birden çok seviye açıkken yol sırasındaki İLKİNİ verir', () => {
    // Tespit sınavından sonra aynı anda birden çok seviye açık olabilir.
    const levels = { a2: record('a2', 'available'), b1: record('b1', 'available') };
    assert.equal(findCurrentLevelId(makeUnits(), levels), 'a2');
  });

  it('ünite sınırını aşarak arar', () => {
    assert.equal(findCurrentLevelId(makeUnits(), { b1: record('b1', 'available') }), 'b1');
  });

  it('hiçbiri açık değilse null verir', () => {
    assert.equal(findCurrentLevelId(makeUnits(), { a1: record('a1', 'completed') }), null);
  });

  it('skipped seviyeyi "şu an buradasın" saymaz', () => {
    assert.equal(findCurrentLevelId(makeUnits(), { a1: record('a1', 'skipped') }), null);
  });
});

describe('countCompleted', () => {
  it('yalnızca tamamlananları sayar', () => {
    const levels = { a1: record('a1', 'completed'), a2: record('a2', 'available') };
    assert.equal(countCompleted(makeUnits()[0], levels), 1);
  });

  it('yumuşak silinmiş kaydı saymaz', () => {
    const levels = { a1: record('a1', 'completed', 3, NOW) };
    assert.equal(countCompleted(makeUnits()[0], levels), 0);
  });
});
