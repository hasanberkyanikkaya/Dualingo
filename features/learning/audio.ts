import { setAudioModeAsync } from 'expo-audio';
import Constants from 'expo-constants';
import { Directory, File, Paths } from 'expo-file-system';

import {
  audioUrlFor,
  cacheFileNameFor,
  isValidAudioKey,
  partFileNameFor,
} from './audioKey';

/**
 * Ses çalma katmanı — anahtardan cihazdaki çalınabilir dosyaya.
 *
 * Mimari kural 7: **ses dosyaları pakete gömülmez.** Uzaktan indirilir ve
 * cihazda önbelleğe alınır. Bu dosya o indirmeyi, önbelleği ve iOS ses
 * oturumunu yönetir; adlandırma ve adres kurma işi saf `audioKey.ts`'te.
 *
 * ⚠️ **Hiçbir yol fırlatmaz.** Ağ yok, 404, bozuk dosya, boş `audioBaseUrl` —
 * hepsinin karşılığı `null`. Ses bir süs; yokluğu dersi durduramaz. Soru
 * bileşeni `null` gördüğünde oynat butonunu çizmez ve yazılı yedeğine döner.
 */

/** Önbellek klasörünün adı — `Paths.cache` altında. */
const AUDIO_DIR_NAME = 'audio';

/** İndirmenin bırakılma süresi. Aşılırsa soru yazılı yedeğiyle devam eder. */
export const AUDIO_TIMEOUT_MS = 3000;

/**
 * Uzak adresin kökü. `app.json` → `expo.extra.audioBaseUrl`.
 *
 * **Bugün boş** ve bu bilinçli varsayılan: sistem uçtan uca kurulu ama tek bir
 * ağ isteği yapmıyor. Gerçek adres girildiği gün kod değişmez.
 */
const extra: Record<string, unknown> = Constants.expoConfig?.extra ?? {};
const rawBaseUrl = extra.audioBaseUrl;
export const AUDIO_BASE_URL: string = typeof rawBaseUrl === 'string' ? rawBaseUrl : '';

/** Anahtar başına tek uyarı — `imageRegistry`'nin disiplini. */
const warnedKeys = new Set<string>();

function warnOnce(key: string, message: string): void {
  if (__DEV__ && !warnedKeys.has(key)) {
    warnedKeys.add(key);
    console.warn(`[audio] "${key}" ${message}`);
  }
}

/**
 * Bulunamadığı görülmüş anahtarlar. Aynı soru tekrar açıldığında ağ yeniden
 * yoklanmaz; kullanıcı her seferinde 3 saniye beklemek zorunda kalmasın diye.
 * Uygulama yeniden başlayınca sıfırlanır.
 */
const missingKeys = new Set<string>();

/** Uçuştaki indirmeler. Aynı anahtar iki kez istenirse tek indirme yapılır. */
const inFlight = new Map<string, Promise<string | null>>();

/**
 * Önbellek klasörü — yoksa açılır.
 *
 * `Paths.cache` bilinçli: işletim sistemi depolama sıkıştığında burayı
 * temizleyebilir, biz de yeniden indiririz. `Paths.document` kullanıcı kotasına
 * yazılır ve iCloud'a yedeklenir — yeniden üretilebilir ders sesi için yanlış yer.
 */
function audioDirectory(): Directory | null {
  try {
    const dir = new Directory(Paths.cache, AUDIO_DIR_NAME);

    if (!dir.exists) {
      dir.create({ intermediates: true, idempotent: true });
    }

    return dir;
  } catch {
    return null;
  }
}

/** Silme başarısız olursa umursamaz — temizlik en iyi çabadır. */
function deleteQuietly(file: File): void {
  try {
    if (file.exists) {
      file.delete();
    }
  } catch {
    // yok sayılır
  }
}

/**
 * Önbellekte hazır bekleyen ses — **eşzamanlı**.
 *
 * `File.exists` senkron bir özellik olduğu için ikinci kez görülen bir soru
 * **ilk karede** oynat butonuyla açılır; bekleme yer tutucusu hiç görünmez.
 * Kanca bu yüzden önce buraya sorar, sonra `resolveAudio`'ya geçer.
 */
export function getCachedUri(key: string): string | null {
  if (!isValidAudioKey(key)) {
    warnOnce(key, 'adlandırma düzenine uymuyor — ses yok sayılıyor.');
    return null;
  }

  try {
    const dir = audioDirectory();

    if (dir === null) {
      return null;
    }

    const file = new File(dir, cacheFileNameFor(key));

    return file.exists && file.size > 0 ? file.uri : null;
  } catch {
    return null;
  }
}

/**
 * İndirme — geçici `.part` dosyasına, doğrulandıktan sonra son adına.
 *
 * ⚠️ **Zehirli önbellek tuzağı.** `File.downloadFileAsync` sunucu 2xx dışı
 * dönerse reddediyor ve dosya bırakmıyor; ama **Android'de yanıt gövdesi
 * doğrudan hedefe akıtılıyor** ve indirme ortasında koparsa kısmi dosya yerinde
 * kalıyor. Kısmi dosya `exists` denetimini geçer, `expo-audio` onu çalamaz ve
 * hata **kalıcı** olur. Bu yüzden hedef her zaman `.part`; ancak boyut denetimi
 * geçtikten sonra son ada taşınıyor.
 */
async function downloadToCache(key: string): Promise<string | null> {
  const url = audioUrlFor(key, AUDIO_BASE_URL);

  if (url === null) {
    return null;
  }

  const dir = audioDirectory();

  if (dir === null) {
    return null;
  }

  const part = new File(dir, partFileNameFor(key));

  try {
    // Önceki denemeden kalmış yarım dosya varsa temizle.
    deleteQuietly(part);

    await File.downloadFileAsync(url, part, { idempotent: true });

    if (!part.exists || part.size <= 0) {
      deleteQuietly(part);
      return null;
    }

    const finalName = cacheFileNameFor(key);
    const target = new File(dir, finalName);

    deleteQuietly(target);
    part.rename(finalName);

    return target.exists ? target.uri : null;
  } catch {
    deleteQuietly(part);
    return null;
  }
}

/**
 * Anahtardan çalınabilir yerel adres. Bulunamazsa `null` — **fırlatmaz**.
 *
 * Önbellekte varsa ağ hiç yoklanmaz. Aynı anahtar için ikinci çağrı uçuştaki
 * indirmeye katılır. Bir kez bulunamayan anahtar oturum boyunca tekrar denenmez.
 */
export function resolveAudio(key: string): Promise<string | null> {
  const cached = getCachedUri(key);

  if (cached !== null) {
    return Promise.resolve(cached);
  }

  if (missingKeys.has(key) || !isValidAudioKey(key)) {
    return Promise.resolve(null);
  }

  const pending = inFlight.get(key);

  if (pending !== undefined) {
    return pending;
  }

  const request = downloadToCache(key)
    .then((uri) => {
      if (uri === null) {
        missingKeys.add(key);
        warnOnce(key, 'indirilemedi — soru yazılı yedeğiyle çalışacak.');
      }

      return uri;
    })
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, request);

  return request;
}

/**
 * iOS ses oturumu — ilk çalmadan önce bir kez.
 *
 * ⚠️ `playsInSilentMode` olmazsa **yan anahtarı sessizde olan iPhone'da hiçbir
 * şey duyulmaz.** Uygulama bozuk görünür, oysa her şey çalışmaktadır; sesi kısık
 * bir telefonda aranması en pahalı hatalardan biri.
 */
let audioModePromise: Promise<void> | null = null;

export function ensureAudioMode(): Promise<void> {
  audioModePromise ??= setAudioModeAsync({ playsInSilentMode: true }).catch(() => {
    // Ses oturumu kurulamadıysa çalma yine denenir; sessiz kalmak yeterli.
  });

  return audioModePromise;
}
