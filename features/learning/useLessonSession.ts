import { useCallback, useReducer, useState } from 'react';
import { Keyboard } from 'react-native';

import {
  buildSummary,
  createLessonSession,
  currentQuestion,
  lessonReducer,
  type LessonPhase,
  type LessonSummary,
  type QuestionResult,
} from '@/features/learning/lessonSession';
import { useCompleteLevel } from '@/features/learning/useCompleteLevel';

import type { Level, LevelStatus, Question, QuestionAnswer } from '@/types';

export type LessonSession = {
  phase: LessonPhase;
  question: Question | null;
  /** Cevaplanan soru sayısı — ilerleme çubuğunun payı. */
  answeredCount: number;
  total: number;
  lastResult: QuestionResult | null;
  /** Yalnız `phase === 'complete'` iken dolu. */
  summary: LessonSummary | null;
  submitAnswer: (answer: QuestionAnswer) => void;
  advance: () => void;
};

/**
 * Ders oturumunu yürüten kanca. Durum yerel — Zustand DEĞİL.
 *
 * Gerekçe: Faz 2.4'ün promptu "sadece store ve test, UI'a dokunma" diyor;
 * oturum durumu store'a girseydi 2.4 yazmadığı bir store'u devralırdı. Ayrıca
 * store tekil, `useReducer` değil — Faz 2.6'da tespit sınavı ile ders aynı anda
 * yaşarsa tekil bir store'da çakışırlardı. Ve dersten çıkmak zaten ilerlemeyi
 * siliyor (`strings.lesson.quitMessage`), yani saklanacak bir şey yok.
 */
export function useLessonSession(level: Level, previousStatus: LevelStatus): LessonSession {
  const completeLevel = useCompleteLevel();

  const [state, dispatch] = useReducer(
    lessonReducer,
    { level, previousStatus },
    (init) => createLessonSession(init.level, init.previousStatus),
  );

  const submitAnswer = useCallback((answer: QuestionAnswer) => {
    // Boşluk doldurmanın klavye kipinde klavye açık kalırsa geri bildirim
    // panelini örtüyor. Burada kapatmak, panelle klavyenin bir arada olmasını
    // yapısal olarak imkânsız kılıyor — `KeyboardAvoidingView` taşımaya gerek
    // bırakmıyor.
    Keyboard.dismiss();
    dispatch({ type: 'answer', answer });
  }, []);

  /**
   * Özet bir kez kurulup saklanıyor.
   *
   * Her çizimde `buildSummary(..., Date.now())` çağırmak iki şeyi bozardı:
   * çizim saflığını (`reactCompiler` açık) ve tamamlama ekranında gösterilen
   * özetin Faz 2.4'e giden özetle aynı olmasını.
   */
  const [summary, setSummary] = useState<LessonSummary | null>(null);

  const advance = useCallback(() => {
    // ⚠️ Tamamlanma sinyali BURADAN gidiyor, `useEffect`'ten değil.
    // `reactCompiler` açık ve StrictMode etkileri iki kez çalıştırıyor;
    // `phase === 'complete'` dinleyen bir etki, 2.4 dikişi doldurduğu anda XP'yi
    // iki kez verirdi. Sonuç dizisi `feedback` fazında zaten kesinleşmiş
    // olduğundan özeti burada kurmak güvenli ve koruma bayrağı gerekmiyor.
    if (state.phase === 'feedback' && state.index + 1 >= state.questions.length) {
      const built = buildSummary(state, level, Date.now());
      setSummary(built);
      completeLevel(built);
    }
    dispatch({ type: 'advance' });
  }, [completeLevel, level, state]);

  return {
    phase: state.phase,
    question: currentQuestion(state),
    answeredCount: state.results.length,
    total: state.questions.length,
    lastResult: state.results[state.results.length - 1] ?? null,
    summary,
    submitAnswer,
    advance,
  };
}
