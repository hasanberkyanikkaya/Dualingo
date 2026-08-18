import type { LevelId, LevelProgress, LevelStatus, StarCount } from '@/types';

/**
 * ÖRNEK VERİ — GERÇEK DEĞİL
 *
 * Seviye haritasının dört durumu da ekranda görünsün diye elle yazılmış
 * ilerleme kaydı. Gerçek ilerleme Faz 2.4'te Zustand store'undan gelecek.
 *
 * ⚠️ **Faz 2.4'te bu dosya SİLİNECEK.** Bu yüzden dışarıdan yalnızca
 * `useLevelProgress` okur; başka hiçbir yer import etmez. Silindiğinde
 * değişmesi gereken tek dosya o kanca olur.
 */

const NOW = 1_755_000_000_000; // sabit zaman damgası — her açılışta aynı olsun

/** Tek satırda okunabilir kayıt üretici. Yalnızca bu dosyaya ait. */
function record(
  levelId: LevelId,
  status: LevelStatus,
  stars: StarCount,
  bestAccuracy: number,
  deletedAt: number | null = null,
): LevelProgress {
  return {
    levelId,
    status,
    stars,
    bestAccuracy,
    attemptCount: status === 'completed' ? 1 : 0,
    lastAttemptAt: status === 'completed' ? NOW : undefined,
    completedAt: status === 'completed' ? NOW : undefined,
    updatedAt: NOW,
    deletedAt,
  };
}

/**
 * Kaydı OLMAYAN seviye hiç açılmamış sayılır (bkz. `types/progress.ts`),
 * yani haritada kilitli görünür. Bu yüzden aşağıda kilitli seviyeler için
 * kayıt yok — kilitli olmaları kaydın yokluğundan geliyor.
 */
export const mockLevelProgress: Record<LevelId, LevelProgress> = {
  // Ünite 1 — ilk üçü tamamlandı, yıldızlar azalıyor
  'level-u1-01': record('level-u1-01', 'completed', 3, 1),
  'level-u1-02': record('level-u1-02', 'completed', 2, 0.83),
  'level-u1-03': record('level-u1-03', 'completed', 1, 0.67),

  // Geçerli seviye: sırası gelmiş, henüz çalışılmamış
  'level-u1-04': record('level-u1-04', 'available', 0, 0),

  // 'level-u1-05' bilerek YOK → kilitli

  // Ünite 2 — seviye tespitiyle açılmış ama hiç çalışılmamış
  'level-u2-01': record('level-u2-01', 'skipped', 0, 0),

  // Yumuşak silinmiş kayıt: `completed` yazıyor ama `deletedAt` dolu.
  // Doğru davranış bunu YOK saymak, yani seviyeyi kilitli göstermek.
  // Faz 2.4'ten önce bu yolun çalıştığını görmek için bilerek duruyor.
  'level-u2-02': record('level-u2-02', 'completed', 3, 1, NOW),

  // 'level-u2-03' … 'level-u2-05' bilerek YOK → kilitli
};
