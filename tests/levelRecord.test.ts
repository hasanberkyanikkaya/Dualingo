import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { livePrevious, mergeCompletion } from '@/features/progress/levelRecord';

import type { LessonSummary } from '@/features/learning/lessonSession';
import type { LevelProgress, StarCount } from '@/types';

const FIRST = 1_755_000_000_000;
const LATER = FIRST + 86_400_000;

function summary(stars: StarCount, accuracy: number, completedAt: number): LessonSummary {
  return {
    levelId: 'a1',
    total: 5,
    correct: Math.round(accuracy * 5),
    stars,
    accuracy,
    xpEarned: 40,
    isFirstCompletion: false,
    mistakes: [],
    completedAt,
  };
}

function completed(stars: StarCount, bestAccuracy: number): LevelProgress {
  return {
    levelId: 'a1',
    status: 'completed',
    stars,
    bestAccuracy,
    attemptCount: 1,
    lastAttemptAt: FIRST,
    completedAt: FIRST,
    updatedAt: FIRST,
    deletedAt: null,
  };
}

describe('mergeCompletion', () => {
  it('ilk tamamlamada özeti aynen alır', () => {
    const next = mergeCompletion(null, summary(2, 0.8, FIRST), FIRST);

    assert.equal(next.status, 'completed');
    assert.equal(next.stars, 2);
    assert.equal(next.bestAccuracy, 0.8);
    assert.equal(next.attemptCount, 1);
    assert.equal(next.completedAt, FIRST);
    assert.equal(next.deletedAt, null);
  });

  it('KÖTÜ bir tekrar kazanılmış yıldızı geri ALMAZ', () => {
    // Elle test etmesi zor, kullanıcı için görünür: 3 yıldız sessizce 1e düşerdi.
    const next = mergeCompletion(completed(3, 1), summary(1, 0.6, LATER), LATER);

    assert.equal(next.stars, 3);
    assert.equal(next.bestAccuracy, 1);
  });

  it('DAHA İYİ bir tekrar yıldızı ve doğruluğu yükseltir', () => {
    const next = mergeCompletion(completed(1, 0.6), summary(3, 1, LATER), LATER);

    assert.equal(next.stars, 3);
    assert.equal(next.bestAccuracy, 1);
  });

  it('her denemede attemptCount artar', () => {
    assert.equal(mergeCompletion(completed(3, 1), summary(3, 1, LATER), LATER).attemptCount, 2);
  });

  it('completedAt İLK tamamlamada sabitlenir, lastAttemptAt güncellenir', () => {
    const next = mergeCompletion(completed(3, 1), summary(3, 1, LATER), LATER);

    assert.equal(next.completedAt, FIRST);
    assert.equal(next.lastAttemptAt, LATER);
    assert.equal(next.updatedAt, LATER);
  });

  it('doğruluk 0-1 biriminde kalır — yüzdeye çevrilmez', () => {
    // `LessonSummary.accuracy` ile `LevelProgress.bestAccuracy` aynı birim.
    // Biri yüzdeye çevrilseydi karşılaştırma sessizce hep "daha iyi" derdi.
    assert.equal(mergeCompletion(null, summary(2, 0.83, FIRST), FIRST).bestAccuracy, 0.83);
  });

  it('yumuşak silinmiş kaydın üzerine yazarken deletedAt temizlenir', () => {
    const deleted: LevelProgress = { ...completed(3, 1), deletedAt: FIRST };
    // Silinmiş kayıt `livePrevious` ile elendiği için sıfırdan başlar.
    const next = mergeCompletion(livePrevious(deleted), summary(1, 0.6, LATER), LATER);

    assert.equal(next.deletedAt, null);
    assert.equal(next.stars, 1);
    assert.equal(next.attemptCount, 1);
  });
});

describe('livePrevious', () => {
  it('kaydı olmayan seviye için null verir', () => {
    assert.equal(livePrevious(undefined), null);
  });

  it('yumuşak silinmiş kayıt için null verir', () => {
    assert.equal(livePrevious({ ...completed(3, 1), deletedAt: FIRST }), null);
  });

  it('yaşayan kaydı aynen verir', () => {
    const record = completed(3, 1);
    assert.equal(livePrevious(record), record);
  });
});
