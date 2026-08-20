import { checkAnswer, isAnswerable } from '@/features/learning/answerEngine';
import { starsForRun, xpForRun } from '@/features/learning/lessonScoring';
import { warnContent } from '@/features/learning/questionValidation';

import type {
  Level,
  LevelId,
  LevelStatus,
  Question,
  QuestionAnswer,
  QuestionId,
  StarCount,
  Timestamp,
} from '@/types';

/**
 * Ders oturumunun durum makinesi — saf. React yok.
 *
 * ⚠️ Bu dosya **seviyeyi, XP'yi, yıldızı bilmez.** `buildSummary` `Level`'ı
 * argüman olarak alıyor. Sebep Faz 2.6: seviye tespit sınavı aynı indirgeyiciyi
 * olduğu gibi kullanacak ama onun XP'si ve yıldızı yok. İndirgeyici
 * `level.xpReward` okusaydı 2.6 onu çatallamak zorunda kalırdı.
 *
 * Saf olduğu için Faz 2.4 test koşucusunu kurduğu gün sıfır ek maliyetle
 * test edilebilir.
 */

export type LessonPhase = 'answering' | 'feedback' | 'complete';

export type QuestionResult = {
  questionId: QuestionId;
  /** Oturumdaki sıra, 0'dan. Hata özetinde "3. soru" için gerekli. */
  index: number;
  correct: boolean;
  /** Ham cevap — okunabilir metne çevirmek görüntüleyenin işi. */
  answer: QuestionAnswer;
};

export type LessonSessionState = {
  /** Cevaplanamayanlar AYIKLANMIŞ soru listesi. Ders uzunluğu buradan. */
  questions: Question[];
  index: number;
  phase: LessonPhase;
  results: QuestionResult[];
  /**
   * Seviye bu oturumdan ÖNCE tamamlanmış mıydı.
   *
   * ⚠️ Oturum başında bir kez okunup saklanıyor. Canlı okunsaydı, Faz 2.4
   * sonucu kaydettiği anda durum `completed`'a döner ve XP kullanıcının gözü
   * önünde %25'e düşerdi.
   */
  wasCompletedBefore: boolean;
  /**
   * Seviyenin bu oturumdan ÖNCEKİ en iyi yıldızı.
   *
   * ⚠️ `wasCompletedBefore` ile AYNI tuzak, aynı gerekçe: oturum başında bir kez
   * okunup saklanıyor. Canlı okunsaydı `completeLevel` sonucu yazdığı anda değer
   * bu koşunun yıldızına dönerdi ve `isNewRecord` her zaman `false` çıkardı —
   * yani kutlama hiçbir tekrarda oynamazdı.
   */
  previousStars: StarCount;
};

export type LessonAction =
  | { type: 'answer'; answer: QuestionAnswer }
  | { type: 'advance' };

export type LessonSummary = {
  levelId: LevelId;
  total: number;
  correct: number;
  stars: StarCount;
  /** 0–1 arası. `LevelProgress.bestAccuracy` ile AYNI birim — 2.4 dönüştürmesin. */
  accuracy: number;
  xpEarned: number;
  isFirstCompletion: boolean;
  /**
   * Bu koşu önceki en iyi dereceyi geçti mi.
   *
   * Kutlamanın ikinci tetikleyicisi (`isFirstCompletion || isNewRecord`): sıradan
   * bir tekrar sessiz geçsin, gerçekten iyileşen bir tekrar kutlansın diye.
   * İlk tamamlamada `previousStars` 0 olduğu için 0 yıldızla biten ilk koşuda
   * `false` çıkar — o durumu `isFirstCompletion` zaten karşılıyor.
   */
  isNewRecord: boolean;
  /** Yalnız yanlışlar, sorulma sırasıyla. */
  mistakes: QuestionResult[];
  completedAt: Timestamp;
};

/**
 * Düz bir soru listesinden oturum kurar. `useReducer`'ın tembel ilklendiricisi.
 *
 * Cevaplanamayan sorular **burada, bir kez** eleniyor; böylece oturum uzunluğu
 * bütün koşu boyunca sabit kalıyor ve yıldız/XP hesabı onunla tutarlı oluyor.
 *
 * Seviyeden ayrı bir giriş noktası olmasının sebebi Faz 2.6: tespit sınavının
 * bir seviyesi yok, elinde yalnızca kademesine göre derlenmiş bir soru listesi
 * var. `createLessonSession` bunun üzerine ince bir sarmalayıcı.
 */
export function createQuestionSession(
  questions: readonly Question[],
  wasCompletedBefore = false,
  // ⚠️ Varsayılan 0 ZORUNLU: tespit sınavı (`app/placement`) bu fonksiyonu tek
  // argümanla çağırıyor ve bir seviyesi — dolayısıyla yıldızı — yok.
  previousStars: StarCount = 0,
): LessonSessionState {
  const all = Array.isArray(questions) ? questions : [];
  const usable = all.filter((question) => {
    const ok = isAnswerable(question);
    if (!ok) {
      warnContent(`"${question.id}"`, 'cevaplanamaz içerik — akıştan çıkarıldı.');
    }
    return ok;
  });

  return {
    questions: usable,
    index: 0,
    phase: usable.length === 0 ? 'complete' : 'answering',
    results: [],
    wasCompletedBefore,
    previousStars,
  };
}

/** Bir seviyeden ders oturumu kurar. */
export function createLessonSession(
  level: Level,
  previousStatus: LevelStatus,
  previousStars: StarCount = 0,
): LessonSessionState {
  return createQuestionSession(
    level.questions,
    previousStatus === 'completed',
    previousStars,
  );
}

export function currentQuestion(state: LessonSessionState): Question | null {
  return state.questions[state.index] ?? null;
}

export function correctCount(state: LessonSessionState): number {
  return state.results.filter((result) => result.correct).length;
}

/**
 * İndirgeyici. Korumalar tutmazsa durum DEĞİŞMEDEN döner.
 *
 * ⚠️ Korumalar yalnızca titizlik değil: "Kontrol et"e çift dokunmak yeniden
 * çizimden önce `onAnswer`'ı iki kez tetikliyor. Korumasız ikinci çağrı ya
 * yinelenen sonuç ekler ya da bir soruyu atlar.
 */
export function lessonReducer(
  state: LessonSessionState,
  action: LessonAction,
): LessonSessionState {
  switch (action.type) {
    case 'answer': {
      if (state.phase !== 'answering') {
        return state;
      }

      const question = currentQuestion(state);
      if (question === null || question.id !== action.answer.questionId) {
        return state;
      }

      const result: QuestionResult = {
        questionId: question.id,
        index: state.index,
        correct: checkAnswer(question, action.answer),
        answer: action.answer,
      };

      return { ...state, phase: 'feedback', results: [...state.results, result] };
    }

    case 'advance': {
      if (state.phase !== 'feedback') {
        return state;
      }

      const isLast = state.index + 1 >= state.questions.length;
      if (isLast) {
        // `index` bilerek ilerletilmiyor: tamamlama ekranı sırayı okumuyor ve
        // ilerletmek `currentQuestion`'ı sınırın dışına taşırdı.
        return { ...state, phase: 'complete' };
      }

      return { ...state, index: state.index + 1, phase: 'answering' };
    }
  }
}

/** Oturum sonucunu ders dışı dünyaya (tamamlama ekranı, Faz 2.4) taşıyan özet. */
export function buildSummary(
  state: LessonSessionState,
  level: Level,
  now: Timestamp,
): LessonSummary {
  const total = state.questions.length;
  const correct = correctCount(state);
  const stars = starsForRun(correct, total);

  return {
    levelId: level.id,
    total,
    correct,
    stars,
    accuracy: total > 0 ? correct / total : 0,
    xpEarned: xpForRun(level.xpReward, state.wasCompletedBefore ? 'completed' : 'available'),
    isFirstCompletion: !state.wasCompletedBefore,
    isNewRecord: stars > state.previousStars,
    mistakes: state.results.filter((result) => !result.correct),
    completedAt: now,
  };
}
