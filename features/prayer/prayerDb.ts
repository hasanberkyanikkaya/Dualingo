import { getDatabase } from '@/lib/database';

import type {
  DistrictId,
  IsoDate,
  PrayerTimes,
  SelectedDistrict,
  Timestamp,
} from '@/types';

/**
 * Namaz vakti önbelleğinin okuma/yazma katmanı — `prayer_time` ve
 * `prayer_district` tabloları.
 *
 * ⚠️ **Bu dosyada KARAR MANTIĞI yok** (veritabanı yoksa sessizce çık dışında).
 * Ayrıştırma `prayerParse.ts`te, bayatlık kararı `prayerCache.ts`te, sıradaki
 * vakit `prayerSchedule.ts`te — üçü de saf ve sınanabilir.
 * `tests/prayerDb.test.ts` **yazılamaz**: Node `expo-sqlite`ı yükleyemez.
 * `activityDb.ts` / `badgeDb.ts` deseninin üçüncü uygulaması.
 *
 * Şema `lib/database.ts` içindeki göç listesinde (`MIGRATIONS[2]`).
 *
 * Bütün okumalar SENKRON. Gerekçe 2.4'ün depolama kararının aynısı: ekran ilk
 * karede doğru veriyi göstermeli, "yükleniyor" durumu için bir kare bile
 * harcamamalı.
 */

type PrayerTimeRow = {
  district_id: string;
  date: string;
  imsak: string;
  gunes: string;
  ogle: string;
  ikindi: string;
  aksam: string;
  yatsi: string;
  kible_saati: string | null;
  hicri_kisa: string | null;
  hicri_uzun: string | null;
  updated_at: number;
  deleted_at: number | null;
};

const TIME_COLUMNS =
  'district_id, date, imsak, gunes, ogle, ikindi, aksam, yatsi, kible_saati, hicri_kisa, hicri_uzun, updated_at, deleted_at';

function toTimes(row: PrayerTimeRow): PrayerTimes {
  return {
    districtId: row.district_id,
    date: row.date,
    imsak: row.imsak,
    gunes: row.gunes,
    ogle: row.ogle,
    ikindi: row.ikindi,
    aksam: row.aksam,
    yatsi: row.yatsi,
    kibleSaati: row.kible_saati,
    hicriShort: row.hicri_kisa,
    // ⚠️ `MIGRATIONS[3]` ile sonradan eklenen sütun: 4.2'den ÖNCE yazılmış
    // satırlarda `NULL`. Ekran `hicriShort`a düşüyor, yer tutucu yazmıyor.
    hicriLong: row.hicri_uzun,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

/**
 * Bir pencerenin tamamını yazar.
 *
 * ⚠️ **`deleted_at = NULL` çatışma dalında zorunlu** — yumuşak silinmiş bir gün
 * yeniden indirildiğinde dirilmeli (`activityDb.recordActivity`in aynı kuralı).
 *
 * Tek `withTransactionSync` içinde: bir aylık pencere ~32 satır ve işlem dışı
 * yazmak her satır için ayrı bir fsync demek olurdu.
 */
export function savePrayerTimes(rows: readonly PrayerTimes[]): void {
  const database = getDatabase();
  if (database === null || rows.length === 0) {
    return;
  }

  database.withTransactionSync(() => {
    for (const row of rows) {
      database.runSync(
        `INSERT INTO prayer_time
           (${TIME_COLUMNS})
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
         ON CONFLICT(district_id, date) DO UPDATE SET
           imsak       = excluded.imsak,
           gunes       = excluded.gunes,
           ogle        = excluded.ogle,
           ikindi      = excluded.ikindi,
           aksam       = excluded.aksam,
           yatsi       = excluded.yatsi,
           kible_saati = excluded.kible_saati,
           hicri_kisa  = excluded.hicri_kisa,
           hicri_uzun  = excluded.hicri_uzun,
           updated_at  = excluded.updated_at,
           deleted_at  = NULL;`,
        [
          row.districtId,
          row.date,
          row.imsak,
          row.gunes,
          row.ogle,
          row.ikindi,
          row.aksam,
          row.yatsi,
          row.kibleSaati,
          row.hicriShort,
          row.hicriLong,
          row.updatedAt,
        ],
      );
    }
  });
}

/** Tek bir günün vakitleri. Yoksa `null` — bu bir hata değil, boş durumdur. */
export function readPrayerTimes(districtId: DistrictId, date: IsoDate): PrayerTimes | null {
  const database = getDatabase();
  if (database === null) {
    return null;
  }

  const row = database.getFirstSync<PrayerTimeRow>(
    `SELECT ${TIME_COLUMNS} FROM prayer_time
     WHERE district_id = ? AND date = ? AND deleted_at IS NULL;`,
    [districtId, date],
  );

  return row ? toTimes(row) : null;
}

/**
 * Bir tarih ARALIĞININ vakitleri — bildirim zamanlayıcısının tek okuması.
 *
 * ⚠️ Gün gün `readPrayerTimes` çağırmak da çalışırdı ama zamanlayıcı iki
 * haftalık pencere istiyor ve o okuma her ön plana gelişte koşuyor; on beş ayrı
 * senkron sorgu demekti. `prayerLogDb.readPrayerLogRange`in aynı gerekçesi.
 *
 * Sınırlar **dahil** (`BETWEEN`). `'YYYY-MM-DD'` sabit genişlikte ve sıfır
 * dolgulu olduğu için metinsel sıralama takvim sırasıyla aynı.
 *
 * Eksik günler dönen dizide HİÇ BULUNMAZ — pencere delikli olabilir ve bu bir
 * hata değil, önbelleğin doğal hâlidir (4.0 §6).
 */
export function readPrayerTimesRange(
  districtId: DistrictId,
  from: IsoDate,
  to: IsoDate,
): PrayerTimes[] {
  const database = getDatabase();
  if (database === null) {
    return [];
  }

  const rows = database.getAllSync<PrayerTimeRow>(
    `SELECT ${TIME_COLUMNS} FROM prayer_time
     WHERE district_id = ? AND date BETWEEN ? AND ? AND deleted_at IS NULL
     ORDER BY date ASC;`,
    [districtId, from, to],
  );

  return rows.map(toTimes);
}

/**
 * Bir ilçe için diskteki EN SON tarih — yenileme kararının tek girdisi.
 *
 * ⚠️ Kayıt SAYISI sorulmuyor ve sorulmamalı: 4.0'da aynı ilçe 15 dakika arayla
 * 34 ve 32 kayıt döndürdü. Ölçüt `prayerCache.isStale`te kalan gün.
 */
export function readLatestCachedDate(districtId: DistrictId): IsoDate | null {
  const database = getDatabase();
  if (database === null) {
    return null;
  }

  const row = database.getFirstSync<{ latest: string | null }>(
    `SELECT MAX(date) AS latest FROM prayer_time
     WHERE district_id = ? AND deleted_at IS NULL;`,
    [districtId],
  );

  return row?.latest ?? null;
}

type DistrictRow = {
  district_id: string;
  district_name: string;
  city_id: string;
  city_name: string;
  selected_at: number;
  last_sync_at: number | null;
};

/**
 * Seçili ilçe.
 *
 * ⚠️ Tabloda **tek** yaşayan satır olması bekleniyor; `selectDistrict` yeni
 * seçimden önce eskisini yumuşak siliyor. Yine de `ORDER BY selected_at DESC`
 * yazılı — bir gün çoklu konum gelirse (ör. "seyahat modu") bu sorgu yanlış
 * cevap vermesin diye.
 */
export function readSelectedDistrict(): SelectedDistrict | null {
  const database = getDatabase();
  if (database === null) {
    return null;
  }

  const row = database.getFirstSync<DistrictRow>(
    `SELECT district_id, district_name, city_id, city_name, selected_at, last_sync_at
     FROM prayer_district WHERE deleted_at IS NULL
     ORDER BY selected_at DESC LIMIT 1;`,
  );

  if (!row) {
    return null;
  }

  return {
    districtId: row.district_id,
    districtName: row.district_name,
    cityId: row.city_id,
    cityName: row.city_name,
    selectedAt: row.selected_at,
    lastSyncAt: row.last_sync_at,
  };
}

/**
 * İlçe seçimini yazar.
 *
 * ⚠️ Eski seçim **yumuşak siliniyor**, sert değil (mimari kural 6). İndirilmiş
 * vakitler (`prayer_time`) SİLİNMİYOR: kullanıcı eski ilçesine dönerse veri
 * hâlâ orada ve ağa çıkmadan çalışır.
 *
 * ⚠️ `last_sync_at` çatışma dalında **korunuyor** (`excluded` değil, mevcut
 * değer): aynı ilçe yeniden seçildiğinde önbellek hâlâ geçerlidir ve sıfırlamak
 * gereksiz bir istek doğururdu.
 */
export function selectDistrict(district: SelectedDistrict, now: Timestamp): void {
  const database = getDatabase();
  if (database === null) {
    return;
  }

  database.withTransactionSync(() => {
    database.runSync(
      'UPDATE prayer_district SET deleted_at = ?, updated_at = ? WHERE deleted_at IS NULL AND district_id != ?;',
      [now, now, district.districtId],
    );

    database.runSync(
      `INSERT INTO prayer_district
         (district_id, district_name, city_id, city_name, selected_at, last_sync_at, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NULL)
       ON CONFLICT(district_id) DO UPDATE SET
         district_name = excluded.district_name,
         city_id       = excluded.city_id,
         city_name     = excluded.city_name,
         selected_at   = excluded.selected_at,
         updated_at    = excluded.updated_at,
         deleted_at    = NULL;`,
      [
        district.districtId,
        district.districtName,
        district.cityId,
        district.cityName,
        now,
        district.lastSyncAt,
        now,
      ],
    );
  });
}

/**
 * Başarılı bir çekimden sonra senkron anını işaretler.
 *
 * ⚠️ **Pencere ilerlesin ilerlemesin yazılır.** Mirror'ın önbelleği bayatsa
 * yenileme AYNI eski pencereyi döndürür; bu alan olmasa `decideRefresh`in
 * soğuma maddesi hiç tetiklenmez ve yenileme bir döngüye girerdi.
 */
export function markSynced(districtId: DistrictId, now: Timestamp): void {
  const database = getDatabase();
  if (database === null) {
    return;
  }

  database.runSync(
    'UPDATE prayer_district SET last_sync_at = ?, updated_at = ? WHERE district_id = ?;',
    [now, now, districtId],
  );
}
