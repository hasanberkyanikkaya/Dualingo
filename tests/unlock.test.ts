import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ensureEntryPoint, flattenLevelIds, unlockNext } from '@/features/progress/unlock';

import type { LevelId, LevelProgress, LevelStatus, Unit } from '@/types';

/**
 * Kilit açma testleri.
 *
 * ⚠️ Bu dosyanın var olma sebebi: yanlış kilit **elle test etmekle görünmez.**
 * Ekran doğru görünür, ders biter, sıradaki seviye sessizce kapalı kalır ve
 * kullanıcı yolun ortasında donar.
 */

const NOW = 1_755_000_000_000;

/** Sınama yolu: 3 seviyeli ünite + 2 seviyeli ünite. İçerikten bağımsız. */
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
    { id: 'u1', title: 'Ünite 1', order: 1, levels: [level('a1', 1), level('a2', 2), level('a3', 3)] },
    { id: 'u2', title: 'Ünite 2', order: 2, levels: [level('b1', 1), level('b2', 2)] },
  ];
}

function record(
  levelId: LevelId,
  status: LevelStatus,
  deletedAt: number | null = null,
): LevelProgress {
  return {
    levelId,
    status,
    stars: status === 'completed' ? 3 : 0,
    bestAccuracy: status === 'completed' ? 1 : 0,
    attemptCount: status === 'completed' ? 1 : 0,
    updatedAt: NOW,
    deletedAt,
  };
}

describe('flattenLevelIds', () => {
  it('yolu oynanış sırasıyla düzleştirir', () => {
    assert.deepEqual(flattenLevelIds(makeUnits()), ['a1', 'a2', 'a3', 'b1', 'b2']);
  });

  it('seviyesi olmayan üniteyi atlar, çökmez', () => {
    const units = [
      { id: 'u0', title: 'Boş', order: 0, levels: [] },
      ...makeUnits(),
    ] as Unit[];
    assert.deepEqual(flattenLevelIds(units), ['a1', 'a2', 'a3', 'b1', 'b2']);
  });
});

describe('unlockNext', () => {
  it('ünite ortasında sıradaki seviyeyi açar', () => {
    const next = unlockNext(makeUnits(), { a1: record('a1', 'completed') }, 'a1', NOW);

    assert.equal(next.a2?.status, 'available');
    assert.equal(next.a2?.attemptCount, 0);
    assert.equal(next.a2?.deletedAt, null);
  });

  it('ünite sınırını aşar: son seviye bitince sıradaki ünitenin ilki açılır', () => {
    const next = unlockNext(makeUnits(), { a3: record('a3', 'completed') }, 'a3', NOW);

    assert.equal(next.b1?.status, 'available');
  });

  it('yolun son seviyesi bitince hiçbir şey olmaz', () => {
    const levels = { b2: record('b2', 'completed') };
    assert.equal(unlockNext(makeUnits(), levels, 'b2', NOW), levels);
  });

  it('zaten tamamlanmış sıradaki seviyeyi GERİ DÜŞÜRMEZ', () => {
    const levels = { a1: record('a1', 'completed'), a2: record('a2', 'completed') };
    const next = unlockNext(makeUnits(), levels, 'a1', NOW);

    assert.equal(next, levels);
    assert.equal(next.a2?.status, 'completed');
  });

  it('tespit sınavıyla açılmış (skipped) seviyeyi GERİ DÜŞÜRMEZ', () => {
    const levels = { a1: record('a1', 'completed'), a2: record('a2', 'skipped') };

    assert.equal(unlockNext(makeUnits(), levels, 'a1', NOW).a2?.status, 'skipped');
  });

  it('yumuşak silinmiş kaydı taze bir available ile diriltir', () => {
    const levels = { a1: record('a1', 'completed'), a2: record('a2', 'completed', NOW) };
    const next = unlockNext(makeUnits(), levels, 'a1', NOW + 1);

    assert.equal(next.a2?.status, 'available');
    assert.equal(next.a2?.deletedAt, null);
    assert.equal(next.a2?.stars, 0);
    assert.equal(next.a2?.attemptCount, 0);
  });

  it('bilinmeyen seviye kimliğinde AYNI referansı döndürür', () => {
    const levels = { a1: record('a1', 'completed') };
    assert.equal(unlockNext(makeUnits(), levels, 'bilinmeyen', NOW), levels);
  });

  it('boş yolda çökmez', () => {
    const levels = { a1: record('a1', 'completed') };
    assert.equal(unlockNext([], levels, 'a1', NOW), levels);
  });

  it('girdi sözlüğünü DEĞİŞTİRMEZ', () => {
    const levels = { a1: record('a1', 'completed') };
    const before = JSON.stringify(levels);

    unlockNext(makeUnits(), levels, 'a1', NOW);

    assert.equal(JSON.stringify(levels), before);
    assert.equal(Object.keys(levels).length, 1);
  });
});

describe('ensureEntryPoint', () => {
  it('bomboş ilerlemede yolun ilk seviyesini açar', () => {
    const next = ensureEntryPoint(makeUnits(), {}, NOW);

    assert.equal(next.a1?.status, 'available');
    assert.equal(Object.keys(next).length, 1);
  });

  it('ilk seviye zaten tamamlanmışsa dokunmaz', () => {
    const levels = { a1: record('a1', 'completed') };
    assert.equal(ensureEntryPoint(makeUnits(), levels, NOW), levels);
  });

  it('ilk seviyenin kaydı yumuşak silinmişse yeniden açar', () => {
    const next = ensureEntryPoint(makeUnits(), { a1: record('a1', 'completed', NOW) }, NOW);
    assert.equal(next.a1?.status, 'available');
  });

  it('boş yolda çökmez', () => {
    assert.deepEqual(ensureEntryPoint([], {}, NOW), {});
  });
});
