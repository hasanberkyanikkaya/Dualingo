import type { StateStorage } from 'zustand/middleware';
import type { MMKV } from 'react-native-mmkv';

/**
 * İlerleme store'unun kalıcı depolaması — MMKV (CLAUDE.md teknoloji yığını).
 *
 * ⚠️ **MMKV senkron.** Bu, `persist`in ilk çizimden ÖNCE hidre olması demek;
 * seviye haritası tek bir kare bile "her şey kilitli" görünmüyor. Asenkron bir
 * depolama seçilseydi ekranın hidrasyonu beklemesi ve `/app` altında bir yükleme
 * durumu gerekirdi — 2.4'ün "arayüze dokunma" kuralının ihlali.
 *
 * ⚠️ **Expo Go koruması.** `react-native-mmkv@4` Nitro tabanlıdır ve **Expo Go
 * içinde yoktur.** Faz 1.3 (dev build) henüz yapılmadığı için bugünkü tek
 * çalışma ortamı Expo Go. Korumasız bir `createMMKV()` çağrısı modül kapsamında
 * fırlatır ve **uygulama hiç açılmaz.** Bu yüzden:
 *
 *  - modül `require` ile TEMBEL yükleniyor (Nitro import ANINDA da fırlatabilir,
 *    yalnızca çağrı anında değil — statik `import` bu yüzden yeterli değil),
 *  - başarısızlıkta bellek içi yedeğe düşülüyor: uygulama açılır, ilerleme
 *    oturum boyunca doğru çalışır, uygulama kapanınca sıfırlanır,
 *  - bu sessiz olmuyor, konsola gür bir uyarı basılıyor.
 *
 * Dev build alındığı gün **bu dosyada tek satır değişmez** — `require` başarılı
 * olur, kalıcılık kendiliğinden açılır.
 *
 * ⚠️ `react-native-nitro-modules` (MMKV'nin çalışma anı gereksinimi) bugün
 * `package.json`'da AÇIK bağımlılık değil, geçici olarak duruyor. Dev build
 * kurulurken açık bağımlılığa çevrilmeli.
 */

const STORAGE_ID = 'dietrying.progress';

/** MMKV'nin kullandığımız yüzeyi. Tam arayüzü taşımaya gerek yok. */
type KeyValueStore = Pick<MMKV, 'getString' | 'set' | 'remove'>;

/** MMKV yokken devreye giren, uygulama kapanınca kaybolan yedek. */
function createMemoryStore(): KeyValueStore {
  const map = new Map<string, string>();
  return {
    getString: (key) => map.get(key),
    set: (key, value) => {
      map.set(key, String(value));
    },
    remove: (key) => map.delete(key),
  };
}

function openStore(): KeyValueStore {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mmkv = require('react-native-mmkv') as typeof import('react-native-mmkv');
    return mmkv.createMMKV({ id: STORAGE_ID });
  } catch (error) {
    if (__DEV__) {
      console.warn(
        '[progress/storage] MMKV açılamadı — ilerleme KALICI DEĞİL, uygulama ' +
          'kapanınca sıfırlanır. Beklenen sebep: MMKV v4 Nitro tabanlı ve Expo ' +
          "Go'da yok; kalıcılık için dev build (Faz 1.3) gerekiyor. Ayrıntı: " +
          String(error),
      );
    }
    return createMemoryStore();
  }
}

const store: KeyValueStore = openStore();

/** Zustand `persist` adaptörü. Üç metot da senkron. */
export const progressStorage: StateStorage = {
  getItem: (name) => store.getString(name) ?? null,
  setItem: (name, value) => {
    store.set(name, value);
  },
  removeItem: (name) => {
    store.remove(name);
  },
};
