import type { LessonSummary } from '@/features/learning/lessonSession';
import type { LevelProgress, StarCount } from '@/types';

/**
 * Tamamlanan seviyenin kaydını üretir — saf.
 *
 * ⚠️ Store'un içinde kalabilirdi; **bilerek çıkarıldı.** Buradaki kural
 * ("kötü bir tekrar kazanılmış yıldızı geri almaz") `unlock.ts`teki kilit
 * hatasıyla aynı sınıftan: kullanıcı bir seviyeyi tekrar oynar, üç yıldızı
 * sessizce bire düşer ve bunu ancak haritaya dönünce fark eder. Elle test
 * etmesi zor, birim testiyle bir satır.
 *
 * Testleri `tests/levelRecord.test.ts`.
 */

/** Yumuşak silinmiş kayıt "hiç oynanmamış" sayılır (mimari kural 6). */
export function livePrevious(record: LevelProgress | undefined): LevelProgress | null {
  return record !== undefined && record.deletedAt === null ? record : null;
}

/**
 * Önceki kayıt ile yeni ders sonucunu birleştirir.
 *
 * - `stars` ve `bestAccuracy` **en iyisi korunur.**
 * - `bestAccuracy` ile `summary.accuracy` **aynı birimde** (0–1); dönüştürme
 *   yok, `lessonSession.ts` bunu açıkça garanti ediyor.
 * - `completedAt` ilk tamamlamada sabitlenir ve tekrarda korunur — "ne zaman
 *   bitirdim" sorusunun cevabı ilk seferdir. Her denemede değişen alan
 *   `lastAttemptAt`.
 * - Yumuşak silinmiş kaydın üzerine yazarken `deletedAt` temizlenir.
 */
export function mergeCompletion(
  previous: LevelProgress | null,
  summary: LessonSummary,
  now: number,
): LevelProgress {
  return {
    levelId: summary.levelId,
    status: 'completed',
    stars: Math.max(previous?.stars ?? 0, summary.stars) as StarCount,
    bestAccuracy: Math.max(previous?.bestAccuracy ?? 0, summary.accuracy),
    attemptCount: (previous?.attemptCount ?? 0) + 1,
    lastAttemptAt: now,
    completedAt: previous?.completedAt ?? now,
    updatedAt: now,
    deletedAt: null,
  };
}
