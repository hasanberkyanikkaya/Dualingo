import { getDatabase } from '@/lib/database';
import { enqueueMutation, getActiveOwnerId } from '@/features/sync/localSyncDb';

import type { IsoDate, PrayerMarkMap, PrayerMarkStatus, PrayerName, Timestamp } from '@/types';

/**
 * Kılınan namaz çizelgesinin okuma/yazma katmanı — `prayer_log` tablosu.
 *
 * ⚠️ **Bu dosyada KARAR MANTIĞI yok** (veritabanı yoksa sessizce çık dışında).
 * Hangi vaktin işaretlenebileceği `prayerDay.ts`te, durum döngüsü
 * `prayerChart.ts`te ve ikisi de saf; burası yalnızca diske dokunuyor.
 * `tests/prayerLogDb.test.ts` **yazılamaz**: Node `expo-sqlite`ı yükleyemez.
 * `activityDb` / `badgeDb` / `prayerDb` deseninin dördüncü uygulaması.
 *
 * Şema `lib/database.ts` içindeki göç listesinde (`MIGRATIONS[4]` tablo,
 * `MIGRATIONS[5]` tarihsel durum sütunu).
 *
 * ⚠️ **Canlı satır yalnızca `'kilindi'` anlamına gelir.** `'kilinmadi'` diske
 * yazılmaz — o, satırın yokluğudur. Tarihsel `status` sütunu eski kurulumlar ve
 * Faz 7 senkron sözleşmesi bozulmasın diye korunur.
 *
 * Okumalar SENKRON: tablo ilk karede doğru çizilmeli (2.4 depolama kararı).
 */

/**
 * Diskten okunan durum dizgesini daraltır.
 *
 * ⚠️ Tanınmayan bir değer `'kilindi'` sayılıyor, `'kilinmadi'` DEĞİL: satır
 * canlı olduğuna göre kullanıcı bir şey işaretlemiş; bilinmeyen bir etiket
 * yüzünden o işareti yok saymak veri kaybı gibi görünürdü. `NOT NULL DEFAULT
 * 'kilindi'` ile göçten geçen eski satırlar da zaten bu değeri taşıyor.
 */
function toStatus(_value: string): PrayerMarkStatus {
  return 'kilindi';
}

/**
 * Bir günün işaretleri.
 *
 * ⚠️ Yumuşak silinmiş satırlar süzülüyor — silinmiş bir işaret "işaret yok"
 * demektir. `deletedAt !== null` kaydı yok saymak projede tek kural
 * (`levelStatus.ts`ten beri).
 *
 * ⚠️ Dönen anahtarlar `PrayerName`e **daraltılıyor ama doğrulanmıyor**: tabloya
 * yalnızca bu modül yazıyor ve yazan yol `prayerDay.isTrackable`ten geçiyor.
 * Diskte tanınmayan bir ad bulunursa `buildPrayerDay` onu zaten hiçbir satırla
 * eşleştiremez ve sessizce yok sayar.
 */
export function readPrayerLog(date: IsoDate): PrayerMarkMap {
  const database = getDatabase();
  if (database === null) {
    return {};
  }

  const rows = database.getAllSync<{ prayer: string; status: string }>(
    `SELECT prayer, status FROM prayer_log
      WHERE owner_id = ? AND date = ? AND deleted_at IS NULL;`,
    [getActiveOwnerId(database), date],
  );

  const marks: PrayerMarkMap = {};
  for (const row of rows) {
    marks[row.prayer as PrayerName] = toStatus(row.status);
  }
  return marks;
}

/**
 * Bir tarih ARALIĞININ işaretleri — hafta ve ay görünümü tek sorguyla dolar.
 *
 * ⚠️ Gün gün `readPrayerLog` çağırmak da çalışırdı ama aylık görünümde 31 ayrı
 * senkron sorgu demekti ve o sorgular ilk karede, çizimden önce koşuyor.
 *
 * Sınırlar **dahil** (`BETWEEN`). `'YYYY-MM-DD'` sabit genişlikte ve sıfır
 * dolgulu olduğu için metinsel karşılaştırma takvim sırasıyla aynı
 * (`activityDb`nin `ORDER BY date` kararının aynı gerekçesi).
 *
 * İşaretsiz günler dönen nesnede HİÇ BULUNMAZ — çağıran `?? {}` ile düşer.
 */
export function readPrayerLogRange(from: IsoDate, to: IsoDate): Record<IsoDate, PrayerMarkMap> {
  const database = getDatabase();
  if (database === null) {
    return {};
  }

  const rows = database.getAllSync<{ date: string; prayer: string; status: string }>(
    `SELECT date, prayer, status FROM prayer_log
     WHERE owner_id = ? AND date BETWEEN ? AND ? AND deleted_at IS NULL;`,
    [getActiveOwnerId(database), from, to],
  );

  const byDate: Record<IsoDate, PrayerMarkMap> = {};
  for (const row of rows) {
    const day = (byDate[row.date] ??= {});
    day[row.prayer as PrayerName] = toStatus(row.status);
  }
  return byDate;
}

/**
 * Bir vaktin durumunu yazar.
 *
 * ⚠️ `'kilinmadi'` bir SİLMEDİR, satır yazmaz. Sert silme değil: `deleted_at`
 * yazılıyor (mimari kural 6) — Faz 7'de karşı cihaz satırı hiç görmemiş sayıp
 * işareti geri diriltmesin diye.
 *
 * ⚠️ İşaretlerken çatışma dalında **`deleted_at = NULL`** zorunlu: daha önce
 * kaldırılmış bir işaret yeniden konduğunda satır dirilmeli (`unlock.ts` ve
 * `activityDb.recordActivity`in aynı kuralı). Bu satır olmasaydı bir kez
 * kaldırılan işaret bir daha asla geri gelmezdi.
 *
 * `status` tarihsel sütuna her zaman `'kilindi'` yazılır.
 */
export function setPrayerMark(
  date: IsoDate,
  prayer: PrayerName,
  status: PrayerMarkStatus,
  now: Timestamp,
): void {
  const database = getDatabase();
  if (database === null) {
    return;
  }
  const ownerId = getActiveOwnerId(database);
  const entityKey = `${date}:${prayer}`;

  if (status === 'kilinmadi') {
    database.withTransactionSync(() => {
      database.runSync(
        `UPDATE prayer_log SET deleted_at = ?, updated_at = ?
          WHERE owner_id = ? AND date = ? AND prayer = ?;`,
        [now, now, ownerId, date, prayer],
      );
      enqueueMutation(database, 'prayer_log', entityKey, 'delete', { date, prayer }, now);
    });
    return;
  }

  database.withTransactionSync(() => {
    database.runSync(
      `INSERT INTO prayer_log (owner_id, date, prayer, status, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, ?, NULL)
       ON CONFLICT(owner_id, date, prayer) DO UPDATE SET
         status = excluded.status,
         updated_at = excluded.updated_at,
         deleted_at = NULL;`,
      [ownerId, date, prayer, 'kilindi', now],
    );
    enqueueMutation(
      database,
      'prayer_log',
      entityKey,
      'upsert',
      { date, prayer },
      now,
    );
  });
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
  const ownerId = getActiveOwnerId(database);
  const rows = database.getAllSync<{ date: string; prayer: string }>(
    `SELECT date, prayer FROM prayer_log
      WHERE owner_id = ? AND deleted_at IS NULL;`,
    [ownerId],
  );
  database.withTransactionSync(() => {
    database.runSync(
      `UPDATE prayer_log SET deleted_at = ?, updated_at = ?
        WHERE owner_id = ? AND deleted_at IS NULL;`,
      [now, now, ownerId],
    );
    for (const row of rows) {
      enqueueMutation(
        database,
        'prayer_log',
        `${row.date}:${row.prayer}`,
        'delete',
        { date: row.date, prayer: row.prayer },
        now,
      );
    }
  });
}
