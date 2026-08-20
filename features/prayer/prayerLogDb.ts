import { getDatabase } from '@/lib/database';

import type { IsoDate, PrayerName, Timestamp } from '@/types';

/**
 * Kılınan namaz çizelgesinin okuma/yazma katmanı — `prayer_log` tablosu.
 *
 * ⚠️ **Bu dosyada KARAR MANTIĞI yok** (veritabanı yoksa sessizce çık dışında).
 * Hangi vaktin işaretlenebileceği `prayerDay.ts`te ve saf; burası yalnızca
 * diske dokunuyor. `tests/prayerLogDb.test.ts` **yazılamaz**: Node
 * `expo-sqlite`ı yükleyemez. `activityDb` / `badgeDb` / `prayerDb` deseninin
 * dördüncü uygulaması.
 *
 * Şema `lib/database.ts` içindeki göç listesinde (`MIGRATIONS[4]`).
 *
 * ⚠️ **Satırın VARLIĞI işaretin kendisidir.** İşaretlemek = satırı yaz ya da
 * dirilt, kaldırmak = `deleted_at` yaz. Sert silme yok (mimari kural 6) ve
 * ayrı bir durum sütunu yok — olsaydı "silinmiş ama işaretli" gibi anlamsız
 * bir bileşim mümkün olurdu.
 *
 * Okumalar SENKRON: tablo ilk karede doğru çizilmeli (2.4 depolama kararı).
 */

/**
 * Bir günün işaretli vakitleri.
 *
 * ⚠️ Yumuşak silinmiş satırlar süzülüyor — silinmiş bir işaret "işaretli
 * değil" demektir. `deletedAt !== null` kaydı yok saymak projede tek kural
 * (`levelStatus.ts`ten beri).
 *
 * ⚠️ Dönen dizge dizisi `PrayerName`e **daraltılıyor ama doğrulanmıyor**:
 * tabloya yalnızca bu modül yazıyor ve yazan yol `prayerDay.isTrackable`ten
 * geçiyor. Diskte tanınmayan bir ad bulunursa `buildPrayerDay` onu zaten
 * hiçbir satırla eşleştiremez ve sessizce yok sayar.
 */
export function readPrayerLog(date: IsoDate): PrayerName[] {
  const database = getDatabase();
  if (database === null) {
    return [];
  }

  const rows = database.getAllSync<{ prayer: string }>(
    'SELECT prayer FROM prayer_log WHERE date = ? AND deleted_at IS NULL;',
    [date],
  );

  return rows.map((row) => row.prayer as PrayerName);
}

/**
 * Bir vaktin işaretini kurar ya da kaldırır.
 *
 * ⚠️ İşaretlerken çatışma dalında **`deleted_at = NULL`** zorunlu: daha önce
 * kaldırılmış bir işaret yeniden konduğunda satır dirilmeli
 * (`unlock.ts` ve `activityDb.recordActivity`in aynı kuralı). Bu satır
 * olmasaydı bir kez kaldırılan işaret bir daha asla geri gelmezdi.
 *
 * ⚠️ Kaldırma `DELETE` DEĞİL: sert silme Faz 7'de senkronizasyonu bozar —
 * karşı cihaz satırı hiç görmemiş sayar ve işareti geri diriltir.
 */
export function setPrayerMark(
  date: IsoDate,
  prayer: PrayerName,
  marked: boolean,
  now: Timestamp,
): void {
  const database = getDatabase();
  if (database === null) {
    return;
  }

  if (marked) {
    database.runSync(
      `INSERT INTO prayer_log (date, prayer, updated_at, deleted_at)
       VALUES (?, ?, ?, NULL)
       ON CONFLICT(date, prayer) DO UPDATE SET
         updated_at = excluded.updated_at,
         deleted_at = NULL;`,
      [date, prayer, now],
    );
    return;
  }

  database.runSync(
    'UPDATE prayer_log SET deleted_at = ?, updated_at = ? WHERE date = ? AND prayer = ?;',
    [now, now, date, prayer],
  );
}

/**
 * Tüm çizelgeyi yumuşak siler — geliştirme sıfırlaması için.
 *
 * `features/progress/store.ts`teki `resetProgress`in namaz karşılığı;
 * bugün çağıranı YOK ve bilerek yazıldı: "her şeyi sıfırla" yolunu kuran bir
 * sonraki oturum tabloyu yerinde bırakıp seri gibi hayalet bir çizelge
 * bulmasın (3.1'de tam bu hata yaşandı).
 */
export function softDeleteAllPrayerLog(now: Timestamp): void {
  const database = getDatabase();
  if (database === null) {
    return;
  }

  database.runSync('UPDATE prayer_log SET deleted_at = ?, updated_at = ? WHERE deleted_at IS NULL;', [
    now,
    now,
  ]);
}
