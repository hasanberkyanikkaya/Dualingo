/**
 * Namaz modülü tipleri.
 *
 * Bu dosya iki ayrı şeyi tarif eder ve ikisini bilerek ayrı tutar:
 * uzak servisin (`ezanvakti.emushaf.net`) döndürdüğü HAM şekiller ve bizim
 * cihazda sakladığımız TİPLİ satırlar. Aradaki dönüşüm `features/prayer/
 * prayerParse.ts`in tek işidir; ham alan adları bu dosyadan başka hiçbir yerde
 * geçmez.
 *
 * Senkronizasyon kuralı (CLAUDE.md kural 6): kalıcı her kayıt `updatedAt`
 * (epoch ms) ve `deletedAt` (nullable) taşır.
 *
 * Sadece tip tanımı — fonksiyon, sabit, doğrulama yok.
 */

import type { IsoDate, Timestamp } from './progress';

/**
 * Gün içi duvar saati, `'HH:MM'`, 24 saat, sıfır dolgulu.
 *
 * ⚠️ Bu bir zaman damgası DEĞİL. Bir güne bağlanıp epoch'a çevrilmesi
 * `prayerSchedule.localEpochFor` üzerinden olur; orada saat dilimi kararı var.
 */
export type ClockTime = string;

/** Diyanet ilçe kimliği. Servis bunu dizge olarak döndürüyor (`"9541"`). */
export type DistrictId = string;

/** Diyanet şehir kimliği. */
export type CityId = string;

/**
 * Beş vakit + güneş.
 *
 * ⚠️ **`enum` DEĞİL, union.** Node'un tip soyucusu `enum` desteklemiyor
 * (`tests/setup.ts`); `enum` yazılırsa tüm test paketi çalışmaz.
 *
 * Sıra bilerek gün içi sırası: `orderedPrayers` bu diziliş üzerine kurulu.
 */
export type PrayerName = 'imsak' | 'gunes' | 'ogle' | 'ikindi' | 'aksam' | 'yatsi';

/**
 * Bir vaktin çizelgedeki durumu (Faz 4.3).
 *
 * ⚠️ **`enum` DEĞİL, union** — Node'un tip soyucusu `enum` desteklemiyor
 * (`tests/setup.ts`).
 *
 * ⚠️ **`'kilinmadi'` diske YAZILMAZ.** O bir kayıt değil, kaydın yokluğudur:
 * `prayer_log`ta ya hiç satır yoktur ya da satır `deleted_at` taşır. Canlı bir
 * satırda yalnızca `'kilindi'` ve `'kaza'` bulunur (`lib/database.ts`
 * `MIGRATIONS[5]`).
 *
 * ⚠️ Ekranda `'kilinmadi'` **"kılmadın" diye YAZILMAZ**, "Kayıt yok" diye
 * gösterilir. Bu bir üslup tercihi değil, modülün kuralı: ekran sayar, hüküm
 * vermez. Değer adı teknik, etiketi değil.
 */
export type PrayerMarkStatus = 'kilinmadi' | 'kilindi' | 'kaza';

/**
 * Bir günün işaretleri — vakit → durum.
 *
 * Eksik anahtar `'kilinmadi'` demektir; okuyucular `?? 'kilinmadi'` ile
 * düşüyor. `Record<PrayerName, …>` tam olsaydı Güneş'e de bir durum atamak
 * gerekirdi, oysa Güneş namaz değil ve çizelgeye hiç girmiyor.
 */
export type PrayerMarkMap = Partial<Record<PrayerName, PrayerMarkStatus>>;

/**
 * Bir ilçenin bir gününe ait vakitler — SQLite `prayer_time` satırının
 * TypeScript karşılığı.
 *
 * Anahtar `(districtId, date)` bileşik ve doğal; `DailyActivity.date` ile aynı
 * senkronizasyon kararı: iki cihaz aynı ilçenin aynı gününü yazarsa bu AYNI
 * satırdır ve `updatedAt` ile çözülür.
 *
 * `date` yerel `'YYYY-MM-DD'` (`toLocalIsoDate`). Servis `"15.08.2026"`
 * gönderiyor; dönüşüm ayrıştırıcının işi.
 */
export type PrayerTimes = {
  districtId: DistrictId;
  date: IsoDate;
  imsak: ClockTime;
  gunes: ClockTime;
  ogle: ClockTime;
  ikindi: ClockTime;
  aksam: ClockTime;
  yatsi: ClockTime;
  /**
   * Kıble saati — güneşin Kâbe yönünü gösterdiği an. Faz 4.3 pusulası bunu
   * isteyecek; aynı yanıtta bedava geldiği için şimdiden saklanıyor.
   */
  kibleSaati: ClockTime | null;
  /**
   * Hicri tarih, kısa biçim (`"2.3.1448"`).
   *
   * ⚠️ Servisin `HicriTarihKisaIso8601` alanı **`null` geliyor** (4.0'da
   * ölçüldü), o yüzden kısa biçim saklanıyor.
   */
  hicriShort: string | null;
  /**
   * Hicri tarih, uzun biçim — servisin `HicriTarihUzun` alanı, birebir.
   *
   * ⚠️ **Ay adı bu projede ÜRETİLMEZ.** Ekranda görünen metin kaynağın
   * yazdığı metindir; kodda bir hicri ay adı tablosu tutulmaz (dini içerik
   * politikası). Bu yüzden alan biçimlendirilmez, olduğu gibi gösterilir.
   *
   * ⚠️ Faz 4.2'de eklendi; **eski önbellek satırlarında `null`** kalır ve
   * pencere yenilenene kadar ekran `hicriShort`a düşer.
   */
  hicriLong: string | null;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;
};

/** `GET /sehirler/{ulkeID}` sonucunun tipli hâli. */
export type PrayerCity = {
  cityId: CityId;
  name: string;
};

/** `GET /ilceler/{sehirID}` sonucunun tipli hâli. */
export type PrayerDistrict = {
  districtId: DistrictId;
  name: string;
};

/**
 * Kullanıcının seçtiği ilçe — SQLite `prayer_district` satırı.
 *
 * ⚠️ **MMKV'de DEĞİL, SQLite'ta.** MMKV Expo Go'da kapalı ve bellek içi yedeğe
 * düşüyor; oraya yazılsaydı kullanıcı her soğuk açılışta ilçesini yeniden
 * seçerdi. Şehir ADI da saklanıyor (kimlik değil) çünkü ekranda "Kadıköy,
 * İstanbul" yazmak için ağa çıkmak gerekmemeli.
 */
export type SelectedDistrict = {
  districtId: DistrictId;
  districtName: string;
  cityId: CityId;
  cityName: string;
  selectedAt: Timestamp;
  /**
   * Son BAŞARILI çekim anı. `null` = hiç çekilmedi.
   *
   * ⚠️ Bu alan pencere ilerlesin ilerlemesin yazılır — mirror'ın önbelleği
   * bayatsa aynı eski pencere döner ve bu alan olmasa yenileme bir döngüye
   * girerdi. Gerekçe `prayerCache.decideRefresh`te.
   */
  lastSyncAt: Timestamp | null;
};

/**
 * Sıradaki vakit — türetilmiş, hiçbir zaman saklanmaz.
 *
 * `at` yerel duvar saatinden çözülmüş epoch; geri sayım bunu kullanır.
 * `isTomorrow` Yatsı'dan sonra `true` olur ve gece yarısını aşar.
 */
export type NextPrayer = {
  name: PrayerName;
  date: IsoDate;
  time: ClockTime;
  at: Timestamp;
  isTomorrow: boolean;
};

/**
 * Ters coğrafi kodlamadan gelen adların Diyanet listesiyle eşleşme sonucu.
 *
 * ⚠️ **`'district'` bile otomatik seçim ANLAMINA GELMEZ** — kullanıcıya onay
 * için gösterilir. Yanlış ilçe = yanlış vakit, bu modülün tek kabul edilemez
 * hatası. Belirsizlikte `'none'` döner, tahmin edilmez.
 */
export type DistrictMatch =
  | { kind: 'district'; city: PrayerCity; district: PrayerDistrict }
  | { kind: 'city'; city: PrayerCity }
  | { kind: 'none' }
  | { kind: 'outsideTurkey' };

/**
 * Ağ isteğinin sonucu — `prayerApi` HİÇ fırlatmaz, her yol buraya düşer
 * (`features/learning/audio.ts` disiplini).
 *
 * `upstream` = 502, mirror Diyanet'e ulaşamıyor (belgelenmiş ve beklenen).
 * `invalid`  = 422, ilçe kimliği geçersiz — tekrar denemek anlamsız.
 * `offline`  = ağ yok ya da zaman aşımı.
 */
export type PrayerFetchOutcome<T> =
  | { kind: 'ok'; data: T }
  | { kind: 'upstream' }
  | { kind: 'invalid' }
  | { kind: 'offline' };

/**
 * Bildirimin vaktin girişinden kaç dakika SONRA çıkacağı (Faz 4.4).
 *
 * ⚠️ **`enum` DEĞİL, union** — Node'un tip soyucusu `enum` desteklemiyor
 * (`tests/setup.ts`).
 *
 * ⚠️ Değerler yalnızca İLERİ yönde. "Vaktin girişinden X dakika ÖNCE" bilinçli
 * olarak yok: vakit girmeden hatırlatmak, henüz kılınamayacak bir şeyi
 * hatırlatmak olurdu. Playbook 4.4 de "vaktin girişinde / X dk sonra" diyor.
 *
 * Diskten okunan değer bu kümenin dışına düşerse `prayerNotify.normalizeOffset`
 * onu `0`a çeker — ekran hiçbir seçeneği seçili gösteremeyen bir hâle düşmesin.
 */
export type PrayerNotificationOffset = 0 | 5 | 10 | 15 | 30;

/**
 * Bir vaktin bildirim tercihi — SQLite `prayer_notification` satırı.
 *
 * ⚠️ **MMKV'de DEĞİL, SQLite'ta.** `prayer_district` ile birebir aynı gerekçe:
 * MMKV Expo Go'da kapalı ve bellek içi yedeğe düşüyor; oraya yazılsaydı ayar
 * her soğuk açılışta sıfırlanır ve kullanıcı kapattığı bildirimi ertesi gün
 * yeniden açık bulurdu.
 *
 * ⚠️ `enabled: false` **YAŞAYAN bir satırdır**, `deletedAt` değil: "kapattım"
 * bir kullanıcı kararıdır, kaydın yokluğu değil. `prayer_log`taki durumla
 * karıştırılmamalı — orada satırın yokluğu işaretin yokluğuydu, burada satırın
 * yokluğu "kullanıcı hiç dokunmadı" demek.
 */
export type PrayerNotificationPref = {
  prayer: PrayerName;
  enabled: boolean;
  offsetMinutes: PrayerNotificationOffset;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;
};

/**
 * Vakit → tercih.
 *
 * ⚠️ **Eksik anahtar "kapalı" DEĞİL, "dokunulmadı" demek** ve varsayılan
 * (açık, 0 dk) kodda duruyor (`prayerNotify.resolvePref`). Kullanıcı kararı
 * "beş vakit açık gelsin"di; tabloyu ilk açılışta beş satırla doldurmak aynı
 * sonucu verirdi ama varsayılanı diske çivilerdi ve bir gün varsayılan
 * değişirse eski kurulumlar eski varsayılanla kalırdı.
 *
 * Güneş için anahtar HİÇ bulunmaz — namaz değil, bildirimi de yok.
 */
export type PrayerNotificationPrefMap = Partial<Record<PrayerName, PrayerNotificationPref>>;

/**
 * Zamanlanacak tek bir bildirim — türetilmiş, hiçbir zaman saklanmaz.
 *
 * `NextPrayer` gibi: diske yazılan şey girdiler (vakitler + tercihler), bu
 * onların sonucudur. İşletim sistemine kurulan kayıtlar zaten bir kopya tutuyor
 * ve ikinci bir kopya iki doğru üretirdi.
 */
export type PlannedNotification = {
  /** İçerik verisine gömülen kimlik — aynı planın iki kez kurulmadığını anlatır. */
  key: string;
  prayer: PrayerName;
  date: IsoDate;
  /** Tetiklenme anı: vaktin yerel epoch'u + gecikme. */
  at: Timestamp;
};
