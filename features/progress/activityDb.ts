import { getDatabase } from '@/lib/database';

import type { IsoDate, Timestamp } from '@/types';

/**
 * Günlük etkinlik kayıtlarının okuma/yazma katmanı — `activity_day` tablosu.
 *
 * ⚠️ **Bu dosyada KARAR MANTIĞI yok** (veritabanı yoksa sessizce çık dışında).
 * Seri hesabının tamamı `dayLog.ts`te ve orası saf olduğu için Node test
 * koşucusunda sınanabiliyor. Buraya bir `if` sızarsa o mantık test edilemez
 * hâle gelir — Oturum 2.5'teki `audioKey` (saf, testli) / `audio` (yerel,
 * testsiz) ayrımının aynısı. `tests/activityDb.test.ts` **yazılamaz**: Node
 * `expo-sqlite`ı yükleyemez.
 *
 * Şema `lib/database.ts` içindeki göç listesinde.
 */

/** Bir dersin tamamlandığı günü kaydeder; gün zaten varsa üstüne toplar. */
export function recordActivity(date: IsoDate, at: Timestamp, xpEarned: number): void {
  const database = getDatabase();
  if (database === null) {
    return;
  }

  // ⚠️ `deleted_at = NULL` satırı **kritik**: yumuşak silinmiş bir gün varken
  // kullanıcı o güne dönüp ders yaparsa kayıt dirilmeli. Unutulursa satır
  // sonsuza dek silinmiş kalır ve `readActiveDates` onu hiç görmez —
  // `unlock.ts`in "yumuşak silinmiş kaydı dirilt" kuralının buradaki karşılığı.
  //
  // ⚠️ Silinmiş bir satırda `lesson_count` üstüne toplamak "silinmiş sayacı"
  // devralır. Bugün kabul ediliyor çünkü yumuşak silmenin tek çağıranı
  // `resetProgress` ve o TÜM satırları siliyor — kısmi silme yolu yok. Kısmi
  // silme geldiği gün bu satır `CASE`e dönmeli.
  database.runSync(
    `INSERT INTO activity_day
       (date, first_at, last_at, lesson_count, xp_earned, updated_at, deleted_at)
     VALUES (?, ?, ?, 1, ?, ?, NULL)
     ON CONFLICT(date) DO UPDATE SET
       first_at     = MIN(activity_day.first_at, excluded.first_at),
       last_at      = excluded.last_at,
       lesson_count = activity_day.lesson_count + 1,
       xp_earned    = activity_day.xp_earned + excluded.xp_earned,
       updated_at   = excluded.updated_at,
       deleted_at   = NULL;`,
    [date, at, at, Math.max(0, xpEarned), at],
  );
}

/**
 * Yaşayan tüm etkin günleri artan sırada verir.
 *
 * ⚠️ `ORDER BY date ASC` **metinsel** sıralamadır; `YYYY-MM-DD` sabit genişlikte
 * ve sıfır dolgulu olduğu için takvim sırasıyla birebir aynı sonucu verir.
 * Biçim seçiminin sessiz kazancı. (Yine de `computeStreak` girdiyi kendisi
 * normalize eder — doğruluğu bu sıralamaya bağlı değil.)
 *
 * Tüm geçmiş okunuyor, pencere yok: `longestDays` zaten hepsini istiyor ve
 * süregelen seri de keyfi uzun olabilir. Ölçek: günde en fazla bir satır, on yıl
 * 3650 kısa dizge. **10.000 satırın altında optimizasyon yapma.**
 */
export function readActiveDates(): IsoDate[] {
  const database = getDatabase();
  if (database === null) {
    return [];
  }

  const rows = database.getAllSync<{ date: IsoDate }>(
    'SELECT date FROM activity_day WHERE deleted_at IS NULL ORDER BY date ASC;',
  );

  return rows.map((row) => row.date);
}

/**
 * Tüm günleri yumuşak siler — `resetProgress`in veritabanı ayağı.
 *
 * ⚠️ Bu çağrı olmadan "her şeyi sıfırla" dedikten sonra seri hayalet gibi geri
 * gelir: MMKV tarafı sıfırlanır ama gün kayıtları yerinde durur. `resetProgress`
 * bir geliştirme kaçış kapağı olduğu için elle sınamada yanlış zemin kurardı.
 *
 * Sert silme yok (mimari kural 6). Zaten silinmiş satırlara dokunulmuyor ki
 * ilk silinme anı korunsun.
 */
export function softDeleteAllActivity(now: Timestamp): void {
  const database = getDatabase();
  if (database === null) {
    return;
  }

  database.runSync(
    'UPDATE activity_day SET deleted_at = ?, updated_at = ? WHERE deleted_at IS NULL;',
    [now, now],
  );
}
