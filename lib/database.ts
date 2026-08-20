import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Uygulamanın tek SQLite veritabanı — açılış ve şema göçü.
 *
 * ⚠️ **Neden `features/progress/` altında DEĞİL:** `PRAGMA user_version`
 * veritabanı başına **tek** bir sayaçtır. Faz 4 (namaz çizelgesi) ve Faz 5
 * (Kur'an ilerlemesi) aynı `.db` dosyasını açacak. Şema sürümünü bir özellik
 * klasörüne gömmek, üç özelliğin aynı sayacı birbirinden habersiz yönetmesi ve
 * ilk çakışmada birinin tablosunun hiç yaratılmaması demekti. Sınırı bugün
 * doğru koymak bedava; sonra taşımak veri taşıma demek.
 *
 * ⚠️ **Senkron açılıyor, bilinçli.** `features/progress/store.ts` modül
 * yüklenirken `openEntryPoint()` ve `refreshStreak()` çağırıyor; asenkron bir
 * veritabanında seri önbelleği ilk çizimden SONRA dolar, ekran bir kare "0 gün"
 * gösterir ve `/app` altına bir yükleme durumu sızardı — Oturum 2.4'ün
 * "arayüze dokunma" kuralının ihlali. `storage.ts`teki MMKV kararının aynısı.
 *
 * ⚠️ **`expo-sqlite` yerel bir modül.** Node test koşucusu onu yükleyemez ve
 * `openDatabaseSync` **web'de yoktur** (OPFS senkron değil, `npm run web`
 * kırılırdı). Bu yüzden `storage.ts`in deseni birebir uygulanıyor: tembel
 * `require`, `try/catch`, başarısızlıkta `null`. `null` dönmesi çağıranın
 * sessizce çalışmaya devam etmesi demek — veritabanına yazılan tek şey seri
 * geçmişi ve onsuz uygulama açılmalı.
 */

const DATABASE_NAME = 'dietrying.db';

/**
 * Sürüm `i`den `i+1`e çıkaran DDL.
 *
 * ⚠️ **Sıra asla değişmez, aradan madde silinmez.** Var olan bir cihaz yalnızca
 * kendi sürümünden sonrasını uygular; listenin başını düzenlemek o cihazlarda
 * hiç çalışmayan bir göç bırakır. Yeni tablo = listenin SONUNA yeni satır.
 */
const MIGRATIONS: readonly string[] = [
  // [0] → sürüm 1: günlük etkinlik kayıtları (Faz 3.1).
  //
  // `date` birincil anahtar ve bu bir SENKRONİZASYON kararıdır: gün, kullanıcı
  // başına doğal ve global bir anahtar. İki cihaz aynı günü yazarsa bu AYNI
  // satırdır ve `updated_at` ile çözülür. Sentetik bir kimlik seçilseydi aynı
  // gün için iki satır oluşur ve bu tabloya özel bir birleştirme kuralı
  // yazılması gerekirdi.
  //
  // `updated_at` + `deleted_at`: mimari kural 6 (sert silme yok).
  `CREATE TABLE IF NOT EXISTS activity_day (
     date         TEXT    PRIMARY KEY NOT NULL,
     first_at     INTEGER NOT NULL,
     last_at      INTEGER NOT NULL,
     lesson_count INTEGER NOT NULL DEFAULT 0,
     xp_earned    INTEGER NOT NULL DEFAULT 0,
     updated_at   INTEGER NOT NULL,
     deleted_at   INTEGER
   );
   CREATE INDEX IF NOT EXISTS idx_activity_day_updated_at
     ON activity_day (updated_at);`,

  // [1] → sürüm 2: kazanılmış rozetler (Faz 3.2).
  //
  // ⚠️ `badge_id` İÇERİKTEN gelir (`content/badges.json`) ve burada VERİTABANI
  // ANAHTARI olur. Yayınlanmış bir rozet kimliğini içerikte değiştirmek eski
  // kazanımı öksüz bırakır ve rozeti yeni kimlikle YENİDEN kazandırır —
  // kutlama da tekrar çıkar. Seviye kimlikleriyle aynı sınıf: yayınlandıysa
  // değişmez. Doğrulayıcı bunu yakalayamaz (tek dosyaya bakıyor).
  //
  // Anahtar seçimi `activity_day.date` ile aynı senkronizasyon kararı: rozet
  // kimliği kullanıcı başına doğal ve global; iki cihaz aynı rozeti kazanırsa
  // bu AYNI satırdır ve `updated_at` ile çözülür.
  `CREATE TABLE IF NOT EXISTS badge_unlock (
     badge_id   TEXT    PRIMARY KEY NOT NULL,
     earned_at  INTEGER NOT NULL,
     updated_at INTEGER NOT NULL,
     deleted_at INTEGER
   );
   CREATE INDEX IF NOT EXISTS idx_badge_unlock_updated_at
     ON badge_unlock (updated_at);`,

  // [2] → sürüm 3: namaz vakti önbelleği + seçili ilçe (Faz 4.1).
  //
  // `prayer_time` anahtarı `(district_id, date)` BİLEŞİK ve doğal —
  // `activity_day.date` ile aynı senkronizasyon kararı: iki cihaz aynı ilçenin
  // aynı gününü yazarsa bu AYNI satırdır ve `updated_at` ile çözülür.
  //
  // ⚠️ **Geçmiş günler de yazılır, süzülmez.** Servis (`ezanvakti.emushaf.net`)
  // ilçe başına önbellekli bir pencere döndürüyor ve pencere BUGÜNDEN
  // BAŞLAMIYOR (4.0'da ölçüldü: 20.08'de gelen pencere 15.08'de başlıyordu).
  // Yanıttaki EN SON tarihi görebilmek — yani "pencere ilerledi mi" sorusunu
  // cevaplayabilmek — için pencerenin tamamı diske yazılıyor. Süzme okuma
  // tarafında, `WHERE date = ?` ile.
  //
  // Alınmayan alanlar (`GunesDogus`, `GunesBatis`, `MiladiTarihUzun`,
  // `AyinSekliURL`, `GreenwichOrtalamaZamani`) bilerek dışarıda: tüketicisi
  // yok. Gerekirse `MIGRATIONS[3]` bir `ALTER TABLE ... ADD COLUMN` olur, eski
  // satırlarda `NULL` kalır ve pencere yenilenince dolar.
  //
  // ⚠️ `hicri_kisa` `HicriTarihKisa`dan gelir, `HicriTarihKisaIso8601`den
  // DEĞİL — o alan servisten `null` geliyor (4.0 ölçümü).
  //
  // `prayer_district` neden SQLite'ta ve MMKV'de değil: MMKV Expo Go'da kapalı
  // ve bellek içi yedeğe düşüyor (`features/progress/storage.ts`). Seçili ilçe
  // oraya yazılsaydı kullanıcı HER SOĞUK AÇILIŞTA ilçesini yeniden seçerdi.
  // Şehir ADI da saklanıyor (kimlik değil): ekranda "Kadıköy, İstanbul" yazmak
  // için ağa çıkmak gerekmesin diye.
  `CREATE TABLE IF NOT EXISTS prayer_time (
     district_id TEXT    NOT NULL,
     date        TEXT    NOT NULL,
     imsak       TEXT    NOT NULL,
     gunes       TEXT    NOT NULL,
     ogle        TEXT    NOT NULL,
     ikindi      TEXT    NOT NULL,
     aksam       TEXT    NOT NULL,
     yatsi       TEXT    NOT NULL,
     kible_saati TEXT,
     hicri_kisa  TEXT,
     updated_at  INTEGER NOT NULL,
     deleted_at  INTEGER,
     PRIMARY KEY (district_id, date)
   );
   CREATE INDEX IF NOT EXISTS idx_prayer_time_updated_at
     ON prayer_time (updated_at);

   CREATE TABLE IF NOT EXISTS prayer_district (
     district_id   TEXT    PRIMARY KEY NOT NULL,
     district_name TEXT    NOT NULL,
     city_id       TEXT    NOT NULL,
     city_name     TEXT    NOT NULL,
     selected_at   INTEGER NOT NULL,
     last_sync_at  INTEGER,
     updated_at    INTEGER NOT NULL,
     deleted_at    INTEGER
   );
   CREATE INDEX IF NOT EXISTS idx_prayer_district_updated_at
     ON prayer_district (updated_at);`,

  // [3] → sürüm 4: hicri tarihin UZUN biçimi (Faz 4.2).
  //
  // `MIGRATIONS[2]`in yorumunda "gerekirse `MIGRATIONS[3]` bir ALTER TABLE
  // olur" diye yazılmıştı; gereken gün geldi. Ekran hicri tarihi yazacak ve
  // kısa biçim (`"2.3.1448"`) kullanıcıya bir şey anlatmıyor.
  //
  // ⚠️ **Ay adlarını BİZ yazmıyoruz.** Servisin `HicriTarihUzun` alanı zaten
  // Diyanet'in yayınladığı metni taşıyor; kodda bir hicri ay adı tablosu
  // tutmak dini takvim adlandırmasını bizim üstlenmemiz olurdu (CLAUDE.md dini
  // içerik politikası). Kaynak ne diyorsa o gösteriliyor.
  //
  // ⚠️ **Eski satırlarda `NULL` kalır** ve bu beklenen geçiş: pencere bir
  // sonraki başarılı yenilemede tazelenir, o ana kadar ekran `hicri_kisa`ya
  // düşer. Boş bir sütun için önbelleği zorla temizlemek, çevrimdışı çalışan
  // bir kullanıcıyı vakitlerinden etmek olurdu.
  'ALTER TABLE prayer_time ADD COLUMN hicri_uzun TEXT;',

  // [4] → sürüm 5: kılınan namaz çizelgesi (Faz 4.2).
  //
  // ⚠️ **İlçeye BAĞLI DEĞİL.** `prayer_time` ilçe başına önbelleklenmiş bir
  // katalog; bu tablo ise kullanıcının kendi kaydı. İlçe değiştirmek (seyahat,
  // taşınma) çizelgeyi silmemeli, o yüzden `district_id` sütunu yok.
  //
  // ⚠️ Anahtar `(date, prayer)` DOĞAL ve global — `activity_day.date` ile aynı
  // senkronizasyon kararı (Faz 3.1): iki cihaz aynı günün aynı vaktini yazarsa
  // bu AYNI satırdır ve `updated_at` ile çözülür. Sentetik bir kimlik
  // seçilseydi aynı vakit için iki satır oluşur ve bu tabloya özel bir
  // birleştirme kuralı yazılması gerekirdi.
  //
  // ⚠️ Satırın VARLIĞI işaretin kendisidir; ayrı bir `status` sütunu YOK.
  // İşareti kaldırmak `deleted_at` yazmaktır (mimari kural 6: sert silme yok),
  // yeniden işaretlemek o satırı diriltmektir. Bir durum sütunu eklenseydi
  // "silinmiş ama işaretli" gibi anlamsız bir bileşim mümkün olurdu.
  //
  // ⚠️ `prayer` sütununa CHECK konmadı: `PrayerName` union'ı TypeScript
  // tarafında zaten daraltıyor ve yeni bir vakit adı gerekirse (ki gerekmez)
  // kısıt bir göç daha isterdi. Güneş bu tabloya HİÇ yazılmaz — namaz değil,
  // kararı `prayerDay.isTrackable` veriyor.
  `CREATE TABLE IF NOT EXISTS prayer_log (
     date       TEXT    NOT NULL,
     prayer     TEXT    NOT NULL,
     updated_at INTEGER NOT NULL,
     deleted_at INTEGER,
     PRIMARY KEY (date, prayer)
   );
   CREATE INDEX IF NOT EXISTS idx_prayer_log_updated_at
     ON prayer_log (updated_at);`,
];

let cached: SQLiteDatabase | null | undefined;

/**
 * Veritabanını açar, göçleri uygular ve önbelleğe alır.
 *
 * Açılamazsa `null` döner ve **bir kez** uyarır; sonraki çağrılar sessizce
 * `null` verir.
 */
export function getDatabase(): SQLiteDatabase | null {
  if (cached !== undefined) {
    return cached;
  }

  cached = openDatabase();
  return cached;
}

function openDatabase(): SQLiteDatabase | null {
  try {
    // ⚠️ Tembel `require` — `storage.ts`teki gerekçenin aynısı: yerel modül
    // import ANINDA da fırlatabilir, yalnızca çağrı anında değil.
    const sqlite = require('expo-sqlite') as typeof import('expo-sqlite');
    const database = sqlite.openDatabaseSync(DATABASE_NAME);

    migrate(database);
    return database;
  } catch (error) {
    if (__DEV__) {
      console.warn(
        '[lib/database] SQLite açılamadı — seri ve rozet geçmişi bu oturumda kaydedilmeyecek.',
        error,
      );
    }
    return null;
  }
}

/** Eksik göçleri tek işlemde uygular. */
function migrate(database: SQLiteDatabase): void {
  // WAL: yazma sırasında okuma bloklanmasın. Göçten önce, çünkü bir kalıcı
  // ayardır ve ilk açılışta kurulması yeterli.
  database.execSync('PRAGMA journal_mode = WAL;');

  const row = database.getFirstSync<{ user_version: number }>('PRAGMA user_version;');
  const current = row?.user_version ?? 0;

  if (current >= MIGRATIONS.length) {
    return;
  }

  database.withTransactionSync(() => {
    for (let version = current; version < MIGRATIONS.length; version += 1) {
      database.execSync(MIGRATIONS[version]);
    }

    // ⚠️ **`PRAGMA user_version = ?` PARAMETRE BAĞLAMAZ.** SQLite pragma
    // deyimlerinde yer tutucu kabul etmiyor; sayıyı dizgeye gömmek zorunlu.
    // Değer bir kod sabiti (`MIGRATIONS.length`), dışarıdan gelmiyor — enjeksiyon
    // yüzeyi yok. Bu satırı "düzeltip" parametreli hâle getirmek göçü sessizce
    // kırar: pragma çalışmaz, sürüm 0'da kalır ve her açılışta baştan koşar.
    database.execSync(`PRAGMA user_version = ${MIGRATIONS.length};`);
  });
}
