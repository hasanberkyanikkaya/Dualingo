import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  applyAttemptToProgressStorageJson,
  mergeProgressStorageJson,
  reconcileProgressStorageJson,
} from '@/features/sync/progressSnapshot';

function snapshot(xpTotal: number, attemptCount: number): string {
  return JSON.stringify({
    version: 3,
    state: {
      xpTotal,
      levels: {
        'level-1': {
          levelId: 'level-1', status: 'completed', stars: 2,
          bestAccuracy: 0.8, attemptCount, completedAt: 10,
          lastAttemptAt: 20, updatedAt: 20, deletedAt: null,
        },
      },
      placement: null,
      dailyGoal: 'casual',
      updatedAt: 20,
      deletedAt: null,
    },
  });
}

describe('progress snapshot sync', () => {
  it('does not lower XP or a level attempt count when snapshots conflict', () => {
    const merged = JSON.parse(mergeProgressStorageJson(snapshot(100, 3), snapshot(80, 2))) as {
      state: { xpTotal: number; levels: Record<string, { attemptCount: number }> };
    };
    assert.equal(merged.state.xpTotal, 100);
    assert.equal(merged.state.levels['level-1'].attemptCount, 3);
  });

  it('adds a previously unseen remote attempt exactly once', () => {
    const result = JSON.parse(applyAttemptToProgressStorageJson(snapshot(100, 3), {
      levelId: 'level-1', stars: 3, accuracy: 1, xpEarned: 10, completedAt: 30,
    })) as { state: { xpTotal: number; levels: Record<string, { attemptCount: number; stars: number }> } };
    assert.equal(result.state.xpTotal, 110);
    assert.equal(result.state.levels['level-1'].attemptCount, 4);
    assert.equal(result.state.levels['level-1'].stars, 3);
  });

  it('keeps an unreadable local envelope instead of throwing', () => {
    assert.equal(mergeProgressStorageJson('not-json', snapshot(1, 1)), 'not-json');
  });

  it('rebuilds the monotonic floor from concurrent unique attempts', () => {
    const result = JSON.parse(reconcileProgressStorageJson(snapshot(10, 1), [
      { levelId: 'level-1', stars: 2, accuracy: 0.8, xpEarned: 10, completedAt: 20 },
      { levelId: 'level-1', stars: 3, accuracy: 1, xpEarned: 10, completedAt: 30 },
    ])) as { state: { xpTotal: number; levels: Record<string, { attemptCount: number; stars: number }> } };
    assert.equal(result.state.xpTotal, 20);
    assert.equal(result.state.levels['level-1'].attemptCount, 2);
    assert.equal(result.state.levels['level-1'].stars, 3);
  });

  it('does not lower a pre-migration snapshot when only newer attempts exist', () => {
    const result = JSON.parse(reconcileProgressStorageJson(snapshot(100, 3), [
      { levelId: 'level-1', stars: 1, accuracy: 0.5, xpEarned: 10, completedAt: 30 },
    ])) as { state: { xpTotal: number; levels: Record<string, { attemptCount: number }> } };
    assert.equal(result.state.xpTotal, 100);
    assert.equal(result.state.levels['level-1'].attemptCount, 3);
  });

  it('adds concurrent events on top of the pre-migration baseline', () => {
    const result = JSON.parse(reconcileProgressStorageJson(snapshot(110, 4), [
      { levelId: 'level-1', stars: 2, accuracy: 0.8, xpEarned: 10, completedAt: 30 },
      { levelId: 'level-1', stars: 3, accuracy: 1, xpEarned: 10, completedAt: 40 },
    ], { xpTotal: 100, attemptCounts: { 'level-1': 3 } })) as {
      state: { xpTotal: number; levels: Record<string, { attemptCount: number }> };
    };
    assert.equal(result.state.xpTotal, 120);
    assert.equal(result.state.levels['level-1'].attemptCount, 5);
  });
});
