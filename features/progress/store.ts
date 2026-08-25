import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { getBadgeDefinitions, getLearningPath } from '@/features/learning/contentLoader';
import {
  readActiveDates,
  recordActivity,
  softDeleteAllActivity,
} from '@/features/progress/activityDb';
import {
  readEarnedBadges,
  recordBadgeUnlock,
  softDeleteAllBadges,
} from '@/features/progress/badgeDb';
import {
  buildBadgeSnapshot,
  evaluateBadges,
  hasSameUnlocks,
  mergeAwards,
  queueBadges,
} from '@/features/progress/badges';
import { computeStreak, toStreakState } from '@/features/progress/dayLog';
import { livePrevious, mergeCompletion } from '@/features/progress/levelRecord';
import {
  recordLearningAttempt,
  softDeleteAllLearningAttempts,
} from '@/features/progress/learningAttemptDb';
import { applyPlacement, resolvePlacementDifficulty } from '@/features/progress/placement';
import { progressStorage } from '@/features/progress/storage';
import { emptyStreak, toLocalIsoDate } from '@/features/progress/streak';
import { ensureEntryPoint, unlockNext } from '@/features/progress/unlock';

import type { LessonSummary } from '@/features/learning/lessonSession';
import type { BadgeId, BadgeUnlock, DailyGoal, Difficulty, LevelId, Timestamp, UserProgress } from '@/types';

/**
 * İlerleme store'u — cihazda yazılan tek gerçek kaynak.
 *
 * Karar mantığı burada DEĞİL: kilit açma `unlock.ts`te, seri `dayLog.ts`te,
 * yıldız/XP `features/learning/lessonScoring.ts`te ve hepsi saf + testli.
 * Bu dosyanın işi onları sırayla uygulayıp sonucu kalıcı hale getirmek.
 *
 * ⚠️ **Serinin doğruluk kaynağı bu store DEĞİL, SQLite** (Faz 3.1). `streak`
 * alanı `activity_day` satırlarından her açılışta yeniden türetilen bir
 * ÖNBELLEKTİR; `partialize` onu bilerek diske yazmıyor.
 *
 * ⚠️ **Serinin ve rozetlerin doğruluk kaynağı da SQLite** — `streak` ve
 * `badges` alanları önbellektir, `partialize` ikisini de diske yazmaz. Aradaki
 * fark: seri her açılışta yeniden HESAPLANIYOR, rozet yalnızca yeniden
 * OKUNUYOR (girdisi MMKV'de ve kalıcı değil, bkz. `badgeDb.ts`).
 *
 * ⚠️ **API bilerek dar**: `completeLevel`, `resetProgress`, `setPlacement`,
 * `setDailyGoal`, `drainPendingBadges`. Bugün kullanılmayan bir eylem yazmak spekülasyon olurdu
 * (Button ve ProgressBar'daki aynı alışkanlık).
 */

type ProgressState = UserProgress & {
  /**
   * Kazanılmış rozetler.
   *
   * ⚠️ **SQLite ÖNBELLEĞİ** — doğruluk kaynağı `badge_unlock` tablosu
   * (`badgeDb.ts`). `streak` gibi `partialize` dışında; ama ondan farklı olarak
   * yeniden HESAPLANAMAZ, yalnızca yeniden OKUNUR: girdisi (`xpTotal`,
   * `levels`) MMKV'de ve Expo Go'da kalıcı değil.
   */
  badges: readonly BadgeUnlock[];
  /**
   * Henüz kullanıcıya gösterilmemiş rozetler — **"olay" budur.**
   *
   * Ayrı bir emitter yazılmadı: `completeLevel` ders ekranında çalışıyor,
   * kutlamayı gösterecek yüzey sonra monte olabiliyor. Bir emitter'ın mesajı
   * boşluğa giderdi; kuyruk bekler. Diske YAZILMAZ — bu bir arayüz sinyali,
   * veri değil.
   */
  pendingBadges: readonly BadgeId[];
  /** Kutlama gösterildi: kuyruğu boşaltır. */
  drainPendingBadges: () => void;
  /** Ders bitti: kaydet, XP ve seriyi işle, sıradaki seviyeyi aç. */
  completeLevel: (summary: LessonSummary) => void;
  /** Her şeyi sıfırlar. Geliştirme kaçış kapağı ve elle sınama için. */
  resetProgress: () => void;
  /**
   * Seri önbelleğini SQLite'tan tazeler.
   *
   * İki zorunluluğu var: (i) `streak` diske yazılmadığı için açılışta
   * doldurulması şart, (ii) uygulama açık kalırken gece yarısı geçerse
   * `status` bayatlar. `AppState` dinleyicisi Faz 3.2'nin (arayüz) işi.
   */
  refreshStreak: () => void;
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

/** Paylaşılan boş diziler — gereksiz yeniden çizim olmasın diye sabit referans. */
const EMPTY_BADGES: readonly BadgeUnlock[] = [];
const EMPTY_QUEUE: readonly BadgeId[] = [];

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
      badges: EMPTY_BADGES,
      pendingBadges: EMPTY_QUEUE,

      completeLevel: (summary) => {
        // ⚠️ Zaman kaynağı `Date.now()` DEĞİL, `summary.completedAt`. Tamamlama
        // ekranındaki özet ile diske yazılan kayıt aynı anı göstermeli.
        const now = summary.completedAt;
        const today = toLocalIsoDate(now);

        // ⚠️ **Veritabanı yazması `set` updater'ının DIŞINDA.** Zustand
        // updater'ı saf sayar; React 19 + `reactCompiler` (app.json'da açık)
        // altında iki kez çalışması `lesson_count`u sessizce ikiye katlardı —
        // gözle asla yakalanamayacak bir hata. (Aynı gerekçeyle 2.3'te
        // tamamlanma sinyali `useEffect`ten değil işleyiciden gönderilmişti.)
        recordActivity(today, now, summary.xpEarned);
        recordLearningAttempt(summary);
        const snapshot = computeStreak(readActiveDates(), today);

        set((state) => {
          const levelId: LevelId = summary.levelId;
          const merged = mergeCompletion(livePrevious(state.levels[levelId]), summary, now);
          const withLevel = { ...state.levels, [levelId]: merged };

          return {
            levels: unlockNext(getLearningPath().units, withLevel, levelId, now),
            xpTotal: state.xpTotal + Math.max(0, summary.xpEarned),
            streak: toStreakState(snapshot, now),
            updatedAt: now,
          };
        });

        // ⚠️ `set`ten SONRA: değerlendirme yeni XP'yi, yeni seviye kaydını ve
        // tazelenmiş seriyi görmeli. `set`in İÇİNDE olamazdı — updater saf
        // sayılıyor ve veritabanına yazıyor (`recordActivity` ile aynı gerekçe).
        syncBadges(now, false);
      },

      drainPendingBadges: () =>
        // Sabit referans: çift çağrı yeni bir dizi üretip gereksiz çizim yapmasın.
        set((state) => (state.pendingBadges.length === 0 ? {} : { pendingBadges: EMPTY_QUEUE })),

      refreshStreak: () => {
        const now = Date.now();
        const snapshot = computeStreak(readActiveDates(), toLocalIsoDate(now));
        set(() => ({ streak: toStreakState(snapshot, now) }));
      },

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

      resetProgress: () => {
        const now = Date.now();

        // ⚠️ Gün kayıtları da silinmeli, yoksa seri sıfırlamadan sonra hayalet
        // gibi geri gelir: MMKV tarafı boşalır ama `activity_day` yerinde durur.
        softDeleteAllActivity(now);
        softDeleteAllBadges(now);
        softDeleteAllLearningAttempts(now);

        set(() => {
          return {
            ...emptyProgress(),
            // ⚠️ `emptyProgress()` bunları TAŞIMAZ (`UserProgress`ta yoklar);
            // yazılmazsa "her şeyi sıfırla" rozetleri ekranda bırakır.
            badges: EMPTY_BADGES,
            pendingBadges: EMPTY_QUEUE,
            // Sıfırlama yolu da giriş noktasını açık bırakmalı, yoksa kullanıcı
            // tamamen kilitli bir haritaya düşer.
            levels: ensureEntryPoint(getLearningPath().units, {}, now),
            updatedAt: now,
          };
        });
      },
    }),
    {
      name: 'progress-v1',
      version: 3,
      storage: createJSONStorage(() => progressStorage),
      /**
       * Sürüm 1 → 2: `dailyGoal` eklendi (Faz 2.6). Alan eksikse `undefined`
       * gelirdi ve `dailyGoal === null` denetimi yanlış sonuç verirdi.
       * `placement` migrate istemedi — yazıcısı 2.6'ya kadar hiç olmadığı için
       * diskteki her kayıtta zaten `null`.
       *
       * Sürüm 2 → 3: `streak` artık kalıcılaşmıyor (Faz 3.1). Eski kayıttaki
       * seri sayısı, karşılığında **hiç `activity_day` satırı olmayan** bir
       * geçmişten geliyor; onu önbellekte bırakmak "SQLite tek doğruluk
       * kaynağı" kararını daha ilk hidrasyonda delerdi. Alan atılıyor, yerini
       * `refreshStreak()` dolduruyor.
       *
       * ⚠️ Eski `lastActiveDate`ten tabloya tohum satırı yazmak ELENDİ:
       * `migrate` saf ve senkron olmalı, içine veritabanı yazması koymak katman
       * ihlali. Bugünkü maliyeti sıfır — MMKV Expo Go'da kapalı, diskte kayıt yok.
       */
      migrate: (persisted, version) => {
        const state = { ...(persisted as Partial<UserProgress>) };

        if (version < 2) {
          state.dailyGoal = null;
        }
        if (version < 3) {
          delete state.streak;
        }

        return state;
      },
      /**
       * Eylemler diske yazılmaz; yalnızca `UserProgress` alanları.
       *
       * ⚠️ **`streak` bilerek YOK.** Türetilmiş bir önbellek ve bugüne bağlı
       * alanlardan besleniyor; diske yolculuk ederse yarın yalan söyler. Her
       * açılışta `refreshStreak()` onu SQLite'tan yeniden kuruyor. Yan kazanç:
       * seri, MMKV kapalıyken bile kalıcı olan ilk özellik.
       *
       * ⚠️ **`badges` de YOK** ama başka sebeple: doğruluk kaynağı
       * `badge_unlock` tablosu ve buraya yazmak ikinci bir kaynak yaratırdı.
       * `pendingBadges` ise veri bile değil, gösterilmemiş kutlama kuyruğu.
       * Beyaz liste olduğu için `version` 3'te kaldı, `migrate` değişmedi.
       */
      partialize: (state) => ({
        xpTotal: state.xpTotal,
        levels: state.levels,
        placement: state.placement,
        dailyGoal: state.dailyGoal,
        updatedAt: state.updatedAt,
        deletedAt: state.deletedAt,
      }),
    },
  ),
);

/**
 * Aktif veri sahibinin ilerlemesini belleğe yükler.
 *
 * Hesap değişiminde Zustand'ın bir önceki sahibin durumunu bellekte tutmasına
 * izin verilmez. Depoda kayıt varsa hidrasyon bütün kalıcı alanları değiştirir;
 * yoksa temiz bir başlangıç yazılır. Türetilmiş seri/rozet alanları da yeni
 * sahibin SQLite satırlarından yeniden kurulur.
 */
export async function reloadProgressForActiveOwner(): Promise<void> {
  const persisted = progressStorage.getItem('progress-v1');

  if (persisted === null) {
    const now = Date.now();
    useProgressStore.setState({
      ...emptyProgress(),
      badges: EMPTY_BADGES,
      pendingBadges: EMPTY_QUEUE,
      levels: ensureEntryPoint(getLearningPath().units, {}, now),
    });
  } else {
    await useProgressStore.persist.rehydrate();
    useProgressStore.setState({ pendingBadges: EMPTY_QUEUE });
  }

  openEntryPoint();
  useProgressStore.getState().refreshStreak();
  syncBadges(Date.now(), true);
}

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
  const units = getLearningPath().units;
  const now = Date.now();
  let levels = ensureEntryPoint(units, state.levels, now);

  // Faz 7'de yeni cihaz yalnız benzersiz ders olaylarından bazı tamamlanmış
  // seviyeleri yeniden kurmuş olabilir. Her tamamlanmanın ardılını açmak,
  // kaybolmuş eski bir progress snapshot'ının yolu kilitlemesini engeller.
  for (const unit of units) {
    for (const level of unit.levels) {
      if (levels[level.id]?.status === 'completed') {
        levels = unlockNext(units, levels, level.id, now);
      }
    }
  }

  // `ensureEntryPoint` değişiklik yoksa AYNI referansı döndürür; gereksiz
  // yazma ve gereksiz yeniden çizim olmuyor.
  if (levels !== state.levels) {
    useProgressStore.setState({ levels });
  }
}

/**
 * Rozetleri değerlendirir, kazanılanları KALICI hale getirir ve önbelleği tazeler.
 *
 * `silent` → kazanımlar kuyruğa yazılmaz. Açılıştaki geriye dönük tarama bunu
 * kullanıyor.
 *
 * ⚠️ **Neden geriye dönük tarama var:** içerik OTA ile güncelleniyor (mimari
 * kural 7). Yarın `badges.json`a beş rozet eklenirse bugünün kullanıcısı
 * onları HİÇ kazanamazdı — eşiği çoktan geçmiş durumda ve o "geçme anı" bir
 * daha yaşanmayacak.
 *
 * ⚠️ **Neden SESSİZ:** tarama React monte olmadan, modül gövdesinde çalışıyor;
 * gösterilecek bir yüzey yok. Ayrıca bir katalog güncellemesi on iki rozeti
 * aynı anda kazandırabilir ve açılışta on iki kutlama gürültüdür. Olay "ŞU AN
 * bir şey başardın" demek, "geçmişte başarmıştın" değil.
 */
function syncBadges(now: Timestamp, silent: boolean): void {
  // Doğruluk kaynağı tablo, önbellek değil: aradaki bir sıfırlama ya da başka
  // bir yazma önbelleği bayatlatmış olabilir.
  const earned = readEarnedBadges();
  const state = useProgressStore.getState();

  const snapshot = buildBadgeSnapshot(
    getLearningPath().units,
    state.levels,
    state.xpTotal,
    state.streak,
  );

  const awards = evaluateBadges(
    getBadgeDefinitions(),
    snapshot,
    earned.map((unlock) => unlock.badgeId),
    now,
  );

  for (const award of awards) {
    recordBadgeUnlock(award.badgeId, award.earnedAt, now);
  }

  const badges = mergeAwards(earned, awards);
  const pendingBadges = silent
    ? state.pendingBadges
    : queueBadges(
        state.pendingBadges,
        awards.map((award) => award.badgeId),
      );

  // ⚠️ `readEarnedBadges()` her çağrıda YENİ bir dizi döndürüyor; bu kapı
  // olmadan her ders sonunda tüm rozet aboneleri yeniden çizilirdi
  // (`openEntryPoint`teki `levels !== state.levels` denetiminin ikizi).
  if (hasSameUnlocks(badges, state.badges) && pendingBadges === state.pendingBadges) {
    return;
  }

  // ⚠️ Güncelleyici biçimi DEĞİL, nesne biçimi: React 19 + `reactCompiler`
  // altında updater iki kez çalışabiliyor. (`queueBadges` ve `mergeAwards`
  // zaten idempotent — bu ikinci savunma hattı.)
  useProgressStore.setState({ badges, pendingBadges });
}

openEntryPoint();

// Seri önbelleğini diskteki gün kayıtlarından kur. `partialize` `streak`i
// yazmadığı için bu çağrı olmadan uygulama her açılışta "0 gün" gösterirdi.
useProgressStore.getState().refreshStreak();

// ⚠️ Seriden SONRA: `streakDays` koşulu `streak.longestDays`i okuyor.
syncBadges(Date.now(), true);
