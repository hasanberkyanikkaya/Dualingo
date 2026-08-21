import { getDatabase } from '@/lib/database';

import { normalizeOffset } from '@/features/prayer/prayerNotify';

import type {
  PrayerName,
  PrayerNotificationOffset,
  PrayerNotificationPrefMap,
  Timestamp,
} from '@/types';

/**
 * Bildirim tercihlerinin okuma/yazma katmanı — `prayer_notification` tablosu.
 *
 * ⚠️ **Bu dosyada KARAR MANTIĞI yok** (veritabanı yoksa sessizce çık dışında).
 * Varsayılan (kayıt yoksa açık), plan üretimi ve gecikme daraltması
 * `prayerNotify.ts`te ve orası saf. `tests/prayerNotificationDb.test.ts`
 * **yazılamaz**: Node `expo-sqlite`ı yükleyemez.
 * `activityDb` / `badgeDb` / `prayerDb` / `prayerLogDb` deseninin beşincisi.
 *
 * Şema `lib/database.ts` içindeki göç listesinde (`MIGRATIONS[6]`).
 *
 * Okumalar SENKRON: ayar ekranı ilk karede doğru çizilmeli, anahtarlar bir kare
 * boyunca yanlış konumda durup sonra yerine oturmamalı (2.4 depolama kararı).
 */

type PrefRow = {
  prayer: string;
  enabled: number;
  offset_minutes: number;
  updated_at: number;
  deleted_at: number | null;
};

/**
 * Tercihlerin tamamı.
 *
 * ⚠️ Yumuşak silinmiş satırlar **süzülmüyor**, olduğu gibi dönüyor: "silinmiş"
 * kararını `prayerNotify.resolvePref` veriyor ve orada varsayılana düşüyor.
 * Süzme burada yapılsaydı aynı kural iki yerde yaşardı.
 *
 * ⚠️ Dönen anahtarlar `PrayerName`e daraltılıyor ama DOĞRULANMIYOR — tabloya
 * yalnızca bu modül yazıyor ve `planNotifications` zaten `TRACKABLE_PRAYERS`
 * üzerinden dönüyor; tanınmayan bir ad hiçbir yerle eşleşmez ve sessizce yok
 * sayılır (`prayerLogDb.readPrayerLog`in aynı kararı).
 */
export function readNotificationPrefs(): PrayerNotificationPrefMap {
  const database = getDatabase();
  if (database === null) {
    return {};
  }

  const rows = database.getAllSync<PrefRow>(
    'SELECT prayer, enabled, offset_minutes, updated_at, deleted_at FROM prayer_notification;',
  );

  const prefs: PrayerNotificationPrefMap = {};
  for (const row of rows) {
    const prayer = row.prayer as PrayerName;
    prefs[prayer] = {
      prayer,
      // SQLite'ta boolean yok; 0 dışındaki her şey açık.
      enabled: row.enabled !== 0,
      offsetMinutes: normalizeOffset(row.offset_minutes),
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
    };
  }

  return prefs;
}

/**
 * Bir vaktin tercihini yazar.
 *
 * ⚠️ **`enabled: false` bir SİLME DEĞİL**, yaşayan bir satır. `prayer_log`ta
 * işareti kaldırmak `deleted_at` yazmaktı çünkü orada satırın varlığı işaretin
 * kendisiydi; burada satır bir KARARI taşıyor ve "kapattım" da bir karardır.
 * Silinmiş sayılsaydı `resolvePref` onu varsayılana (açık) çevirir ve kullanıcı
 * kapattığı bildirimi geri açık bulurdu.
 *
 * ⚠️ Çatışma dalında **`deleted_at = NULL`**: geçmişte bir sıfırlama satırı
 * yumuşak silmişse yeni karar onu diriltmeli (`unlock.ts` ve
 * `activityDb.recordActivity`in aynı kuralı).
 */
export function setNotificationPref(
  prayer: PrayerName,
  enabled: boolean,
  offsetMinutes: PrayerNotificationOffset,
  now: Timestamp,
): void {
  const database = getDatabase();
  if (database === null) {
    return;
  }

  database.runSync(
    `INSERT INTO prayer_notification (prayer, enabled, offset_minutes, updated_at, deleted_at)
     VALUES (?, ?, ?, ?, NULL)
     ON CONFLICT(prayer) DO UPDATE SET
       enabled        = excluded.enabled,
       offset_minutes = excluded.offset_minutes,
       updated_at     = excluded.updated_at,
       deleted_at     = NULL;`,
    [prayer, enabled ? 1 : 0, offsetMinutes, now],
  );
}
