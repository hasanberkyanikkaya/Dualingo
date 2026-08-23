import type { StateStorage } from 'zustand/middleware';
import type { MMKV } from 'react-native-mmkv';

const STORAGE_ID = 'dietrying.quran';

type KeyValueStore = Pick<MMKV, 'getString' | 'set' | 'remove'>;

function createMemoryStore(): KeyValueStore {
  const values = new Map<string, string>();
  return {
    getString: (key) => values.get(key),
    set: (key, value) => values.set(key, String(value)),
    remove: (key) => values.delete(key),
  };
}

function openStore(): KeyValueStore {
  try {
    // Expo Go'da Nitro modülü yoktur; statik import uygulamayı açılışta çökertir.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mmkv = require('react-native-mmkv') as typeof import('react-native-mmkv');
    return mmkv.createMMKV({ id: STORAGE_ID });
  } catch (error) {
    if (__DEV__) {
      console.warn(
        '[quran/storage] MMKV açılamadı — okuyucu ayarları bu oturumla sınırlı. ' +
          'Kalıcılık dev build ile açılacak. Ayrıntı: ' +
          String(error),
      );
    }
    return createMemoryStore();
  }
}

const store = openStore();

export const quranStorage: StateStorage = {
  getItem: (name) => store.getString(name) ?? null,
  setItem: (name, value) => {
    store.set(name, value);
  },
  removeItem: (name) => {
    store.remove(name);
  },
};

