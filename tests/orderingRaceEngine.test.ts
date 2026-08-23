import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  advanceOrderingRaceTime,
  createOrderingRaceSession,
  ORDERING_RACE_DURATION_MS,
  remainingOrderingRaceSeconds,
  shuffleOrderingRaceItems,
  startOrderingRace,
  submitOrderingRaceAnswer,
  toggleOrderingRaceItem,
} from '@/features/games/orderingRaceEngine';

import type { OrderingRacePuzzle } from '@/types';

const puzzle: OrderingRacePuzzle = {
  id: 'test-puzzle',
  prompt: 'ÖRNEK SORU',
  items: [
    { id: 'a', text: 'ÖRNEK A' },
    { id: 'b', text: 'ÖRNEK B' },
    { id: 'c', text: 'ÖRNEK C' },
  ],
  correctOrder: ['b', 'c', 'a'],
};

function place(ids: readonly string[], now = 1_000) {
  return ids.reduce(
    (session, id) => toggleOrderingRaceItem(session, id, ['a', 'b', 'c'], now),
    startOrderingRace(2, now),
  );
}

describe('Sıralama Yarışı oturumu', () => {
  it('hazır durumda başlar ve 60 saniyelik son tarih kurar', () => {
    assert.equal(createOrderingRaceSession().status, 'ready');
    const session = startOrderingRace(2, 1_000);
    assert.equal(session.status, 'playing');
    assert.equal(session.deadlineAt, 1_000 + ORDERING_RACE_DURATION_MS);
    assert.equal(remainingOrderingRaceSeconds(session, 1_000), 60);
  });

  it('karışık havuzu doğru sırada hazır bırakmaz', () => {
    const shuffled = shuffleOrderingRaceItems(puzzle, 'test-seed');
    assert.notDeepEqual(
      shuffled.map((item) => item.id),
      puzzle.correctOrder,
    );
    assert.deepEqual(
      [...shuffled.map((item) => item.id)].sort(),
      [...puzzle.correctOrder].sort(),
    );
  });

  it('öğeleri dokunma sırasıyla yerleştirir ve tekrar dokununca çıkarır', () => {
    const started = startOrderingRace(2, 1_000);
    const first = toggleOrderingRaceItem(started, 'b', ['a', 'b', 'c'], 1_001);
    const second = toggleOrderingRaceItem(first, 'a', ['a', 'b', 'c'], 1_002);
    const removed = toggleOrderingRaceItem(second, 'b', ['a', 'b', 'c'], 1_003);

    assert.deepEqual(first.placedIds, ['b']);
    assert.deepEqual(second.placedIds, ['b', 'a']);
    assert.deepEqual(removed.placedIds, ['a']);
  });

  it('bulmacaya ait olmayan öğeyi yok sayar', () => {
    const started = startOrderingRace(2, 1_000);
    assert.equal(toggleOrderingRaceItem(started, 'x', ['a', 'b', 'c'], 1_001), started);
  });

  it('eksik sırayı deneme saymaz', () => {
    const session = place(['b', 'c']);
    assert.equal(submitOrderingRaceAnswer(session, puzzle, 2, 2_000), session);
  });

  it('yanlış sırada puan vermez, denemeyi sayar ve düzeni korur', () => {
    const session = place(['a', 'b', 'c']);
    const result = submitOrderingRaceAnswer(session, puzzle, 2, 2_000);

    assert.equal(result.score, 0);
    assert.equal(result.attemptCount, 1);
    assert.equal(result.lastResult, 'incorrect');
    assert.deepEqual(result.placedIds, ['a', 'b', 'c']);
  });

  it('doğru sıraya 100 puan verir ve sonraki bulmacaya geçer', () => {
    const session = place(['b', 'c', 'a']);
    const result = submitOrderingRaceAnswer(session, puzzle, 2, 2_000);

    assert.equal(result.score, 100);
    assert.equal(result.correctCount, 1);
    assert.equal(result.puzzleIndex, 1);
    assert.deepEqual(result.placedIds, []);
  });

  it('son bulmaca doğruysa desteyi erken tamamlar', () => {
    const session = { ...place(['b', 'c', 'a']), puzzleIndex: 1 };
    const result = submitOrderingRaceAnswer(session, puzzle, 2, 2_000);

    assert.equal(result.status, 'finished');
    assert.equal(result.finishReason, 'completed');
    assert.equal(result.score, 100);
  });

  it('tam son tarih anında oyunu bitirir ve cevap kabul etmez', () => {
    const session = place(['b', 'c', 'a']);
    const deadline = session.deadlineAt as number;
    const result = submitOrderingRaceAnswer(session, puzzle, 2, deadline);

    assert.equal(result.status, 'finished');
    assert.equal(result.finishReason, 'time');
    assert.equal(result.score, 0);
  });

  it('geri sayımı yukarı yuvarlar ve süre geçince sıfırlar', () => {
    const session = startOrderingRace(2, 1_000);
    assert.equal(remainingOrderingRaceSeconds(session, 1_001), 60);
    assert.equal(remainingOrderingRaceSeconds(session, 1_999), 60);
    assert.equal(remainingOrderingRaceSeconds(session, 2_000), 59);
    assert.equal(remainingOrderingRaceSeconds(advanceOrderingRaceTime(session, 61_000), 61_000), 0);
  });
});
