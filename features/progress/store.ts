import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { getLearningPath } from '@/features/learning/contentLoader';
import { livePrevious, mergeCompletion } from '@/features/progress/levelRecord';
import { applyPlacement, resolvePlacementDifficulty } from '@/features/progress/placement';
import { progressStorage } from '@/features/progress/storage';
import { advanceStreak, emptyStreak, toLocalIsoDate } from '@/features/progress/streak';
import { ensureEntryPoint, unlockNext } from '@/features/progress/unlock';

import type { LessonSummary } from '@/features/learning/lessonSession';
import type { DailyGoal, Difficulty, LevelId, UserProgress } from '@/types';

/**
 * İlerleme store'u — cihazda yazılan tek gerçek kaynak.
 *
 * Karar mantığı burada DEĞİL: kilit açma `unlock.ts`te, seri `streak.ts`te,
 * yıldız/XP `features/learning/lessonScoring.ts`te ve hepsi saf + testli.
 * Bu dosyanın işi onları sırayla uygulayıp sonucu kalıcı hale getirmek.
 *
 * ⚠️ **API bilerek dar**: `completeLevel`, `resetProgress`, `setPlacement`,
 * `setDailyGoal`. Bugün kullanılmayan bir eylem yazmak spekülasyon olurdu
 * (Button ve ProgressBar'daki aynı alışkanlık).
 */

type ProgressState = UserProgress & {
  /** Ders bitti: kaydet, XP ve seriyi işle, sıradaki seviyeyi aç. */
  completeLevel: (summary: LessonSummary) => void;
  /** Her şeyi sıfırlar. Geliştirme kaçış kapağı ve elle sınama için. */
  resetProgress: () => void;
  /**
   * Seviye tespit sınavı bitti: kademeyi belirle, yolu ona göre aç.
   *
   * `declared` kullanıcının beyanı, `correct`/`total` sınav sonucu. Kararı
   * store vermiyor — `placement.ts` veriyor.
   */
  setPlacement: (declared: Difficulty, correct: number, total: number) => void;
  /** Günlük hedef seçildi. */
  setDailyGoal: (goal: DailyGoal) => void;
};

/** Hiç oynanmamış kullanıcı. `levels` boş; ilk seviyeyi `openEntryPoint` açar. */
function emptyProgress(): UserProgress {
  return {
    xpTotal: 0,
    levels: {},
    streak: emptyStreak(),
    placement: null,
    dailyGoal: null,
    updatedAt: 0,
    deletedAt: null,
  };
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      ...emptyProgress(),

      completeLevel: (summary) =>
        set((state) => {
          // ⚠️ Zaman kaynağı `Date.now()` DEĞİL, `summary.completedAt`. Tamamlama
          // ekranındaki özet ile diske yazılan kayıt aynı anı göstermeli.
          const now = summary.completedAt;
          const levelId: LevelId = summary.levelId;

          const merged = mergeCompletion(livePrevious(state.levels[levelId]), summary, now);
          const withLevel = { ...state.levels, [levelId]: merged };

          return {
            levels: unlockNext(getLearningPath().units, withLevel, levelId, now),
            xpTotal: state.xpTotal + Math.max(0, summary.xpEarned),
            streak: advanceStreak(state.streak, toLocalIsoDate(now), now),
            updatedAt: now,
          };
        }),

      setPlacement: (declared, correct, total) =>
        set((state) => {
          const now = Date.now();
          const difficulty = resolvePlacementDifficulty(declared, correct, total);

          // ⚠️ `placement` ile `levels` AYNI `set` çağrısında. Ayrılsalardı arada
          // bir çizim "tespit yapıldı ama harita eski" gösterirdi.
          //
          // ⚠️ Seri (`advanceStreak`) BAŞLATILMIYOR ve XP VERİLMİYOR: sınav ders
          // değil. Gün serisini bir sınavla başlatmak, hiç ders yapmadan seri
          // sahibi olmak demekti.
          return {
            placement: {
              difficulty,
              declared,
              accuracy: total > 0 ? Math.max(0, Math.min(1, correct / total)) : 0,
              completedAt: now,
            },
            levels: applyPlacement(getLearningPath().units, state.levels, difficulty, now),
            updatedAt: now,
          };
        }),

      setDailyGoal: (goal) => set(() => ({ dailyGoal: goal, updatedAt: Date.now() })),

      resetProgress: () =>
        set(() => {
          const now = Date.now();
          return {
            ...emptyProgress(),
            // Sıfırlama yolu da giriş noktasını açık bırakmalı, yoksa kullanıcı
            // tamamen kilitli bir haritaya düşer.
            levels: ensureEntryPoint(getLearningPath().units, {}, now),
            updatedAt: now,
          };
        }),
    }),
    {
      name: 'progress-v1',
      version: 2,
      storage: createJSONStorage(() => progressStorage),
      /**
       * Sürüm 1 → 2: `dailyGoal` eklendi (Faz 2.6).
       *
       * Alan eksikse `undefined` gelirdi ve `dailyGoal === null` denetimi
       * yanlış sonuç verirdi; eksikliği burada bir kez `null`a çeviriyoruz.
       * `placement` migrate istemiyor — yazıcısı 2.6'ya kadar hiç olmadığı için
       * diskteki her kayıtta zaten `null`.
       */
      migrate: (persisted, version) =>
        version < 2
          ? { ...(persisted as Partial<UserProgress>), dailyGoal: null }
          : (persisted as Partial<UserProgress>),
      // Eylemler diske yazılmaz; yalnızca `UserProgress` alanları.
      partialize: (state) => ({
        xpTotal: state.xpTotal,
        levels: state.levels,
        streak: state.streak,
        placement: state.placement,
        dailyGoal: state.dailyGoal,
        updatedAt: state.updatedAt,
        deletedAt: state.deletedAt,
      }),
    },
  ),
);

/**
 * Yolun ilk seviyesinin açık olmasını garanti eder.
 *
 * ⚠️ Bu çağrı olmadan **temiz kurulum tamamen kilitli** açılır: hiç kayıt yok →
 * her seviye `locked` → tamamlanacak bir şey yok → `unlockNext` hiç tetiklenmez.
 * Kilitlenmenin en sessiz biçimi; kullanıcı uygulamayı açar ve hiçbir yere
 * dokunamaz.
 *
 * Modül yüklenirken bir kez çalışıyor. Depolama senkron olduğu için bu noktada
 * hidrasyon bitmiştir ve sıra deterministik. (Asenkron bir depolamada bu çağrı
 * diskten geleni ezerdi — depolama seçiminin görünmeyen bedeli buydu.)
 */
function openEntryPoint(): void {
  const state = useProgressStore.getState();
  const levels = ensureEntryPoint(getLearningPath().units, state.levels, Date.now());

  // `ensureEntryPoint` değişiklik yoksa AYNI referansı döndürür; gereksiz
  // yazma ve gereksiz yeniden çizim olmuyor.
  if (levels !== state.levels) {
    useProgressStore.setState({ levels });
  }
}

openEntryPoint();
