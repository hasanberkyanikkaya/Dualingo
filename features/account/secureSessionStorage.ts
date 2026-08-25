import * as SecureStore from 'expo-secure-store';

const CHUNK_SIZE = 1800;
const SERVICE = 'dietrying.supabase.session';

function metaKey(key: string): string {
  return `${key}.chunks`;
}

function chunkKey(key: string, index: number): string {
  return `${key}.${index}`;
}

async function readChunkCount(key: string): Promise<number> {
  const value = await SecureStore.getItemAsync(metaKey(key), { keychainService: SERVICE });
  const count = value === null ? 0 : Number.parseInt(value, 10);
  return Number.isFinite(count) && count > 0 ? count : 0;
}

/** Supabase oturumunu SecureStore'un platform boyut sınırına takılmadan saklar. */
export const secureSessionStorage = {
  getItem: async (key: string): Promise<string | null> => {
    const count = await readChunkCount(key);
    if (count === 0) {
      return null;
    }
    const chunks = await Promise.all(
      Array.from({ length: count }, (_, index) =>
        SecureStore.getItemAsync(chunkKey(key, index), { keychainService: SERVICE }),
      ),
    );
    return chunks.some((chunk) => chunk === null) ? null : chunks.join('');
  },

  setItem: async (key: string, value: string): Promise<void> => {
    const previousCount = await readChunkCount(key);
    const chunks: string[] = [];
    for (let offset = 0; offset < value.length; offset += CHUNK_SIZE) {
      chunks.push(value.slice(offset, offset + CHUNK_SIZE));
    }

    await Promise.all(
      chunks.map((chunk, index) =>
        SecureStore.setItemAsync(chunkKey(key, index), chunk, {
          keychainService: SERVICE,
          keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        }),
      ),
    );
    await SecureStore.setItemAsync(metaKey(key), String(chunks.length), {
      keychainService: SERVICE,
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    await Promise.all(
      Array.from({ length: Math.max(0, previousCount - chunks.length) }, (_, index) =>
        SecureStore.deleteItemAsync(chunkKey(key, chunks.length + index), {
          keychainService: SERVICE,
        }),
      ),
    );
  },

  removeItem: async (key: string): Promise<void> => {
    const count = await readChunkCount(key);
    await Promise.all(
      Array.from({ length: count }, (_, index) =>
        SecureStore.deleteItemAsync(chunkKey(key, index), { keychainService: SERVICE }),
      ),
    );
    await SecureStore.deleteItemAsync(metaKey(key), { keychainService: SERVICE });
  },
};

