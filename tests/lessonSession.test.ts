import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildSummary,
  createLessonSession,
  createQuestionSession,
} from '@/features/learning/lessonSession';

import type { LessonSessionState, QuestionResult } from '@/features/learning/lessonSession';
import type { Level, Question, StarCount } from '@/types';

/**
 * Faz 3.3'ün eklediği `isNewRecord` — ders sonu kutlamasının ikinci tetikleyicisi.
 * Yanlış hesaplanırsa hata sessizdir: kutlama ya hiç oynamaz ya her tekrarda
 * oynar, ikisi de elle fark edilmesi zor.
 */

const NOW = 1_755_000_000_000;

function question(id: string): Question {
  return {
    id,
    type: 'multiple_choice',
    prompt: `ÖRNEK SORU ${id}`,
    options: [
      { id: 'c1', text: 'ÖRNEK CEVAP A' },
      { id: 'c2', text: 'ÖRNEK CEVAP B' },
    ],
    correctOptionId: 'c1',
  };
}

function level(count: number): Level {
  return {
    id: 'a1',
    title: 'Ünite testi',
    order: 1,
    difficulty: 'beginner',
    xpReward: 40,
    questions: Array.from({ length: count }, (_, index) => question(`q${index + 1}`)),
  };
}

/** `correct` tanesi doğru olan bitmiş bir oturum durumu. */
function finished(count: number, correct: number, previousStars: StarCount, repeat = false) {
  const state: LessonSessionState = createLessonSession(
    level(count),
    repeat ? 'completed' : 'available',
    previousStars,
  );

  const results: QuestionResult[] = state.questions.map((q, index) => ({
    questionId: q.id,
    index,
    correct: index < correct,
    answer: { questionId: q.id, type: 'multiple_choice', selectedOptionId: 'c1' },
  }));

  return { ...state, results, phase: 'complete' as const };
}

describe('createQuestionSession — previousStars', () => {
  it('VARSAYILANI 0 (tespit sınavı tek argümanla çağırıyor)', () => {
    // Sınavın bir seviyesi, dolayısıyla yıldızı yok. Varsayılan kalkarsa
    // `app/placement` derlenmez.
    assert.equal(createQuestionSession([question('q1')]).previousStars, 0);
  });

  it('verilen değeri saklar', () => {
    assert.equal(createQuestionSession([question('q1')], true, 2).previousStars, 2);
  });
});

describe('buildSummary — isNewRecord', () => {
  it('İLK tamamlamada önceki yıldız 0 olduğu için rekordur', () => {
    const summary = buildSummary(finished(5, 5, 0), level(5), NOW);
    assert.equal(summary.stars, 3);
    assert.equal(summary.isFirstCompletion, true);
    assert.equal(summary.isNewRecord, true);
  });

  it('sıfır yıldızla biten ilk koşu rekor DEĞİLDİR', () => {
    // Kutlamayı orada `isFirstCompletion` taşıyor; ikisi ayrı sorular.
    const summary = buildSummary(finished(5, 1, 0), level(5), NOW);
    assert.equal(summary.stars, 0);
    assert.equal(summary.isNewRecord, false);
    assert.equal(summary.isFirstCompletion, true);
  });

  it('AYNI dereceyle tekrar rekor değildir', () => {
    // Kutlamanın sessiz kaldığı asıl durum.
    const summary = buildSummary(finished(5, 5, 3, true), level(5), NOW);
    assert.equal(summary.stars, 3);
    assert.equal(summary.isFirstCompletion, false);
    assert.equal(summary.isNewRecord, false);
  });

  it('YÜKSELEN derece rekordur', () => {
    // 5/5 → 3 yıldız, önceki 2 idi.
    const summary = buildSummary(finished(5, 5, 2, true), level(5), NOW);
    assert.equal(summary.isFirstCompletion, false);
    assert.equal(summary.isNewRecord, true);
  });

  it('DÜŞEN derece rekor değildir', () => {
    // 3/5 = %60 → 1 yıldız, önceki 3 idi. Kötü tekrar kutlanmaz.
    const summary = buildSummary(finished(5, 3, 3, true), level(5), NOW);
    assert.equal(summary.stars, 1);
    assert.equal(summary.isNewRecord, false);
  });
});
