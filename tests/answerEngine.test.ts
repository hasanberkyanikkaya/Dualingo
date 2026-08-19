import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { checkAnswer, isAnswerable, normalizeTr } from '@/features/learning/answerEngine';

import type { Question, QuestionAnswer } from '@/types';

/**
 * Faz 2.3'ün cevap motoru. Ağırlık **Türkçe harf tuzağında**: oradaki bir hata
 * kullanıcının doğru cevabını yanlış işaretler ve gözden geçirmede görünmez.
 *
 * ⚠️ Soru metinleri ÖRNEK VERİ — GERÇEK DEĞİL. Sınanan şey mantık, içerik değil.
 */

describe('normalizeTr', () => {
  it("büyük I'yı NOKTASIZ ı yapar — naif toLowerCase burada yanılır", () => {
    // `'ISLAM'.toLowerCase()` → `'islam'`. Doğrusu `'ıslam'`.
    assert.equal(normalizeTr('ISLAM'), 'ıslam');
  });

  it("büyük İ'yi NOKTALI i yapar", () => {
    assert.equal(normalizeTr('İMAN'), 'iman');
  });

  it('aynı kelimenin iki yazımını aynı yere indirir', () => {
    assert.equal(normalizeTr('İSTANBUL'), normalizeTr('istanbul'));
  });

  it('iki farklı kelimeyi birbirine KARIŞTIRMAZ', () => {
    assert.notEqual(normalizeTr('ISLAM'), normalizeTr('İSLAM'));
  });

  it('baştaki, sondaki ve tekrarlayan boşlukları toplar', () => {
    assert.equal(normalizeTr('  iki   kelime  '), 'iki kelime');
  });

  it('aksanı SOYMAZ — varyant kararı içerik yazarınındır', () => {
    assert.notEqual(normalizeTr('â'), 'a');
  });
});

// ── Örnek sorular (ÖRNEK VERİ — GERÇEK DEĞİL) ────────────────────────────────

const mc: Question = {
  id: 'q1',
  type: 'multiple_choice',
  prompt: 'ÖRNEK SORU 1',
  options: [
    { id: 'o1', text: 'ÖRNEK CEVAP A' },
    { id: 'o2', text: 'ÖRNEK CEVAP B' },
  ],
  correctOptionId: 'o2',
};

const blank: Question = {
  id: 'q2',
  type: 'fill_blank',
  prompt: 'ÖRNEK SORU 2',
  segments: ['', ''],
  blanks: [{ id: 'b1', correctAnswers: ['ıslam'] }],
};

describe('checkAnswer', () => {
  it('doğru şıkkı doğru sayar', () => {
    const answer: QuestionAnswer = {
      questionId: 'q1',
      type: 'multiple_choice',
      selectedOptionId: 'o2',
    };
    assert.equal(checkAnswer(mc, answer), true);
  });

  it('yanlış şıkkı yanlış sayar', () => {
    const answer: QuestionAnswer = {
      questionId: 'q1',
      type: 'multiple_choice',
      selectedOptionId: 'o1',
    };
    assert.equal(checkAnswer(mc, answer), false);
  });

  it('BAŞKA bir soruya ait cevabı doğru saymaz', () => {
    const answer: QuestionAnswer = {
      questionId: 'baska-soru',
      type: 'multiple_choice',
      selectedOptionId: 'o2',
    };
    assert.equal(checkAnswer(mc, answer), false);
  });

  it('boşluk doldurmada büyük harfle yazılmış Türkçe cevabı KABUL eder', () => {
    // Tuzağın uçtan uca hâli: kullanıcı 'ISLAM' yazıyor, anahtar 'ıslam'.
    const answer: QuestionAnswer = {
      questionId: 'q2',
      type: 'fill_blank',
      entries: [{ blankId: 'b1', value: 'ISLAM' }],
    };
    assert.equal(checkAnswer(blank, answer), true);
  });

  it('boşluk doldurmada bilinmeyen boşluk kimliğini reddeder', () => {
    const answer: QuestionAnswer = {
      questionId: 'q2',
      type: 'fill_blank',
      entries: [{ blankId: 'yok', value: 'ıslam' }],
    };
    assert.equal(checkAnswer(blank, answer), false);
  });

  it('boş cevap listesini doğru saymaz', () => {
    const answer: QuestionAnswer = { questionId: 'q2', type: 'fill_blank', entries: [] };
    assert.equal(checkAnswer(blank, answer), false);
  });
});

describe('isAnswerable', () => {
  it('sağlam çoktan seçmeli soruyu cevaplanabilir sayar', () => {
    assert.equal(isAnswerable(mc), true);
  });

  it('doğru şıkkı hiçbir şığa denk düşmeyen soruyu ELER', () => {
    // ⚠️ Bu soru ekranda çizilir ama asla doğrulanamaz: kullanıcı "Kontrol et"e
    // basar, hiçbir şey olmaz, dersten çıkış yoktur. 2.3 bunu oturum başında
    // ayıklıyor; kural burada sınanıyor.
    assert.equal(isAnswerable({ ...mc, correctOptionId: 'olmayan' } as Question), false);
  });

  it('tek şıklı soruyu eler', () => {
    assert.equal(isAnswerable({ ...mc, options: [mc.options[0]] } as Question), false);
  });

  it('doğru cevabı boş olan boşluğu eler', () => {
    assert.equal(
      isAnswerable({ ...blank, blanks: [{ id: 'b1', correctAnswers: ['   '] }] } as Question),
      false,
    );
  });
});
