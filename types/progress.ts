/**
 * Öğrenme modülü — ilerleme tipleri.
 *
 * Bu dosya cihazda yazılan, Faz 7'de buluta senkronize edilecek veriyi tarif eder.
 * İçerik tarafı için `learning.ts`e bak.
 *
 * Senkronizasyon kuralı (CLAUDE.md): kalıcı her kayıt `updatedAt` (epoch ms) ve
 * `deletedAt` (nullable) taşır. Sert silme yok, yumuşak silme var.
 *
 * Sadece tip tanımı — fonksiyon, sabit, doğrulama yok.
 */

import type { Difficulty, LevelId } from './learning';

/** 'YYYY-MM-DD' biçiminde yerel tarih. Seri hesabı gün birimiyle çalışır. */
export type IsoDate = string;

/** Epoch milisaniye. */
export type Timestamp = number;

/**
 * Seviyenin kullanıcı gözündeki durumu.
 *
 * `available` — sırası geldi, açık.
 * `skipped`   — seviye tespiti sonucu atlanıp açıldı, hiç çalışılmadı.
 *               Haritada `available`dan farklı görünür; kullanıcı geri dönüp
 *               çalışabilir. Bu ayrım olmadan "test ile açıldı" ile "tamamlandı"
 *               birbirine karışır.
 */
export type LevelStatus = 'locked' | 'available' | 'skipped' | 'completed';

/** Seviye sonunda kazanılan yıldız — haritada tamamlanmış düğümlerde görünür. */
export type StarCount = 0 | 1 | 2 | 3;

/** Tek bir seviyenin ilerleme kaydı. */
export type LevelProgress = {
  levelId: LevelId;
  status: LevelStatus;
  /** En iyi denemede kazanılan yıldız. */
  stars: StarCount;
  /** En iyi doğruluk oranı, 0 ile 1 arası. */
  bestAccuracy: number;
  /** Kaç kez çalışıldı — tekrar sayısı. */
  attemptCount: number;
  lastAttemptAt?: Timestamp;
  completedAt?: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;
};

/** Günlük seri durumu. */
export type StreakState = {
  /** Süregelen seri, gün. */
  currentDays: number;
  /** Şimdiye kadarki en uzun seri, gün. */
  longestDays: number;
  /**
   * Son etkin gün. Epoch ms değil yerel tarih tutulur; saat dilimi ve yaz saati
   * kayması gün sınırını bozmasın diye.
   */
  lastActiveDate: IsoDate;
  updatedAt: Timestamp;
};

/** Seviye tespit sınavının sonucu. */
export type PlacementResult = {
  /** Testin belirlediği başlangıç kademesi. */
  difficulty: Difficulty;
  completedAt: Timestamp;
};

/**
 * Kullanıcının tüm öğrenme ilerlemesi.
 *
 * `placement` `null` ise seviye tespiti henüz yapılmamıştır — ilk açılış akışı
 * bu bilgiye bakar.
 */
export type UserProgress = {
  /** Toplam kazanılan XP. */
  xpTotal: number;
  /** Seviye kimliğinden ilerleme kaydına. Kaydı olmayan seviye hiç açılmamıştır. */
  levels: Record<LevelId, LevelProgress>;
  streak: StreakState;
  placement: PlacementResult | null;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;
};
