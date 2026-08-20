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
        '[lib/database] SQLite açılamadı — seri geçmişi bu oturumda kaydedilmeyecek.',
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
