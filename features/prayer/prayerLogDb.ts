import { getDatabase } from '@/lib/database';

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
 * `MIGRATIONS[5]` durum sütunu).
 *
 * ⚠️ **Canlı satırda yalnızca `'kilindi'` ve `'kaza'` bulunur.** Üçüncü durum
 * (`'kilinmadi'`) diske yazılmaz — o, satırın yokluğudur. 4.2'nin "satırın
 * varlığı işarettir" kararı böylece sürüyor: `status` sütunu iki YAŞAYAN durum
 * arasında ayrım yapar, "silinmiş ama işaretli" hâlâ imkânsızdır.
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
function toStatus(value: string): PrayerMarkStatus {
  return value === 'kaza' ? 'kaza' : 'kilindi';
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
    'SELECT prayer, status FROM prayer_log WHERE date = ? AND deleted_at IS NULL;',
    [date],
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
     WHERE date BETWEEN ? AND ? AND deleted_at IS NULL;`,
    [from, to],
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
 * ⚠️ `status` da çatışma dalında güncelleniyor: "kılındı"dan "kaza"ya geçiş
 * satırı silip yeniden yazmaz, aynı satırı günceller — anahtar `(date, prayer)`
 * ve o değişmiyor.
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

  if (status === 'kilinmadi') {
    database.runSync(
      'UPDATE prayer_log SET deleted_at = ?, updated_at = ? WHERE date = ? AND prayer = ?;',
      [now, now, date, prayer],
    );
    return;
  }

  database.runSync(
    `INSERT INTO prayer_log (date, prayer, status, updated_at, deleted_at)
     VALUES (?, ?, ?, ?, NULL)
     ON CONFLICT(date, prayer) DO UPDATE SET
       status = excluded.status,
       updated_at = excluded.updated_at,
       deleted_at = NULL;`,
    [date, prayer, status, now],
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
