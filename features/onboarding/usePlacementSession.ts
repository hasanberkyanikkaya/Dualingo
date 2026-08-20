import { useCallback, useReducer } from 'react';
import { Keyboard } from 'react-native';

import { useSetPlacement } from '@/features/onboarding/usePlacement';
import {
  correctCount,
  createQuestionSession,
  currentQuestion,
  lessonReducer,
  type LessonPhase,
  type QuestionResult,
} from '@/features/learning/lessonSession';

import type { Difficulty, Question, QuestionAnswer } from '@/types';

export type PlacementSession = {
  phase: LessonPhase;
  question: Question | null;
  /** Cevaplanan soru sayısı — ilerleme çubuğunun payı. */
  answeredCount: number;
  total: number;
  correct: number;
  lastResult: QuestionResult | null;
  submitAnswer: (answer: QuestionAnswer) => void;
  advance: () => void;
};

/**
 * Tespit sınavı oturumunu yürüten kanca — `useLessonSession`'ın ikizi.
 *
 * Aynı indirgeyiciyi (`lessonReducer`) kullanıyor; `lessonSession.ts` bu dosya
 * için baştan hazırlanmıştı (XP ve yıldız indirgeyicinin içinde değil, dışında).
 * Farkı ne taşıdığı değil, **ne taşımadığı**: `buildSummary` çağrılmıyor
 * (XP/yıldız üretiyor, sınavın ikisi de yok) ve `completeLevel` yerine
 * `setPlacement` yazıyor.
 *
 * Durum yerel — Zustand DEĞİL. Store tekil; sınav ile ders aynı anda yaşarsa
 * tekil bir store'da çakışırlardı (`useLessonSession`'daki aynı gerekçe).
 */
export function usePlacementSession(
  questions: readonly Question[],
  declared: Difficulty,
): PlacementSession {
  const setPlacement = useSetPlacement();

  const [state, dispatch] = useReducer(lessonReducer, questions, (init) =>
    createQuestionSession(init),
  );

  const submitAnswer = useCallback((answer: QuestionAnswer) => {
    // Boşluk doldurmanın klavye kipinde klavye açık kalırsa geri bildirim
    // panelini örtüyor (`useLessonSession`'daki aynı önlem).
    Keyboard.dismiss();
    dispatch({ type: 'answer', answer });
  }, []);

  const advance = useCallback(() => {
    /**
     * ⚠️ Sonuç BURADAN yazılıyor, `useEffect`'ten değil. `reactCompiler` açık ve
     * StrictMode etkileri iki kez çalıştırıyor; `phase === 'complete'` dinleyen
     * bir etki yerleştirmeyi iki kez uygulardı. `applyPlacement` idempotent
     * olduğu için sonuç aynı olurdu — ama `placement.completedAt` iki farklı an
     * gösterirdi ve kural yine de kırılırdı.
     */
    if (state.phase === 'feedback' && state.index + 1 >= state.questions.length) {
      setPlacement(declared, correctCount(state), state.questions.length);
    }
    dispatch({ type: 'advance' });
  }, [declared, setPlacement, state]);

  return {
    phase: state.phase,
    question: currentQuestion(state),
    answeredCount: state.results.length,
    total: state.questions.length,
    correct: correctCount(state),
    lastResult: state.results[state.results.length - 1] ?? null,
    submitAnswer,
    advance,
  };
}
