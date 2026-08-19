import type { LevelStatus, StarCount } from '@/types';

/**
 * Ders sonucu puanlaması — saf.
 *
 * ⚠️ Adlar bilerek `starsForRun` / `xpForRun`. `levelStatus.ts` zaten
 * `resolveStars(levelId, progress)` ihraç ediyor ve `UnitSection` onu
 * kullanıyor; ikisi de `StarCount` döndürdüğü için karışan bir import
 * **tip denetiminden geçer** ve hata sessiz kalırdı.
 */

/** Yıldız eşikleri, yüzde. 3 yıldız kusursuzluk ister. */
export const STAR_THRESHOLDS = { one: 60, two: 80, three: 100 } as const;

/** Daha önce tamamlanmış bir seviyeyi tekrar bitirmenin XP payı, yüzde. */
export const REPEAT_XP_PERCENT = 25;

/**
 * Bu koşunun yıldızı.
 *
 * ⚠️ Oran hesaplanıp eşiğe karşılaştırılmıyor; tam sayılar çarpılıyor. Kayan
 * nokta, eşiğin tam üstündeki bir sonucu (örneğin 4/5 = %80) beklenmedik yöne
 * yuvarlayabilir ve kullanıcı hak ettiği yıldızı alamaz.
 *
 * Ürün kuralı: "hepsini bilmeden 3 yıldız olmaz" — üçüncü eşik %100.
 */
export function starsForRun(correct: number, total: number): StarCount {
  if (total <= 0) {
    return 0;
  }

  const clamped = Math.min(Math.max(correct, 0), total);
  const scaled = clamped * 100;

  if (scaled >= total * STAR_THRESHOLDS.three) {
    return 3;
  }
  if (scaled >= total * STAR_THRESHOLDS.two) {
    return 2;
  }
  if (scaled >= total * STAR_THRESHOLDS.one) {
    return 1;
  }
  return 0;
}

/**
 * Bu koşunun XP'si.
 *
 * ⚠️ Yordayıcı `attemptCount` DEĞİL `status`. Seviye tespit sınavıyla açılmış
 * bir seviye `attemptCount: 0` ama `status: 'skipped'` taşıyor; ilk gerçek
 * denemesi tam XP almalı ve bunu doğrudan söyleyen alan `status`. Ayrıca
 * `status` `resolveLevelStatus`'tan geldiği için `deletedAt !== null → locked`
 * kuralı tek yerde kalıyor.
 */
export function xpForRun(xpReward: number, previousStatus: LevelStatus): number {
  if (!Number.isFinite(xpReward) || xpReward <= 0) {
    return 0;
  }

  if (previousStatus !== 'completed') {
    return Math.round(xpReward);
  }

  // Düşük ödüllü bir seviyenin tekrarı 0 XP vermesin.
  return Math.max(1, Math.round((xpReward * REPEAT_XP_PERCENT) / 100));
}
