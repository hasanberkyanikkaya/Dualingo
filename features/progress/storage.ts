import type { StateStorage } from 'zustand/middleware';
import type { MMKV } from 'react-native-mmkv';
import type { SQLiteDatabase } from 'expo-sqlite';

import { enqueueMutation, getActiveOwnerId } from '@/features/sync/localSyncDb';
import { getDatabase } from '@/lib/database';

/**
 * İlerleme store'unun kalıcı depolaması — Faz 7'den beri kullanıcı kapsamlı
 * SQLite `progress_state`. MMKV yalnız eski kaydı bir kez taşımak ve SQLite'ın
 * hiç açılamadığı olağan dışı durumda oturumluk yedek olmak için tutulur.
 *
 * ⚠️ **SQLite erişimi senkron.** Bu, `persist`in ilk çizimden ÖNCE hidre olması demek;
 * seviye haritası tek bir kare bile "her şey kilitli" görünmüyor. Asenkron bir
 * depolama seçilseydi ekranın hidrasyonu beklemesi ve `/app` altında bir yükleme
 * durumu gerekirdi — 2.4'ün "arayüze dokunma" kuralının ihlali.
 *
 * ⚠️ **Eski MMKV kaydı koruması.** `react-native-mmkv@4` Nitro tabanlıdır ve
 * Expo Go içinde yoktur. Korumasız bir `createMMKV()` çağrısı modül kapsamında
 * fırlatıp uygulamayı açılmaz hâle getireceği için:
 *
 *  - modül `require` ile TEMBEL yükleniyor (Nitro import ANINDA da fırlatabilir,
 *    yalnızca çağrı anında değil — statik `import` bu yüzden yeterli değil),
 *  - başarısızlıkta yalnız eski kayıt taşıması için bellek yedeğine düşülüyor,
 *  - asıl SQLite açık olduğu sürece ilerleme kalıcı kalıyor.
 *
 * Dev build alındığı gün `require` başarılı olur ve varsa eski MMKV kaydı
 * otomatik olarak SQLite'a taşınır.
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
        '[progress/storage] Eski MMKV deposu açılamadı; SQLite ilerleme deposu ' +
          'kullanılmaya devam edecek. Beklenen sebep: MMKV v4 Nitro tabanlı ve ' +
          "Expo Go'da yok. Ayrıntı: " +
          String(error),
      );
    }
    return createMemoryStore();
  }
}

const legacyStore: KeyValueStore = openStore();

type ProgressBaseline = {
  baselineXp: number;
  baselineAttemptCounts: string;
};

/** İlk Faz 7 snapshot'ından, sonradan oluşan olayları çıkarıp sabit tabanı bulur. */
function deriveBaseline(database: SQLiteDatabase, ownerId: string, value: string): ProgressBaseline {
  let xpTotal = 0;
  let levels: Record<string, unknown> = {};
  try {
    const envelope = JSON.parse(value) as unknown;
    if (typeof envelope === 'object' && envelope !== null && !Array.isArray(envelope)) {
      const state = (envelope as Record<string, unknown>).state;
      if (typeof state === 'object' && state !== null && !Array.isArray(state)) {
        const stateRecord = state as Record<string, unknown>;
        xpTotal = typeof stateRecord.xpTotal === 'number' && Number.isFinite(stateRecord.xpTotal)
          ? stateRecord.xpTotal
          : 0;
        levels = typeof stateRecord.levels === 'object' && stateRecord.levels !== null && !Array.isArray(stateRecord.levels)
          ? stateRecord.levels as Record<string, unknown>
          : {};
      }
    }
  } catch {
    return { baselineXp: 0, baselineAttemptCounts: '{}' };
  }

  const attempts = database.getAllSync<{ level_id: string; count: number; xp: number }>(
    `SELECT level_id, COUNT(*) AS count, COALESCE(SUM(xp_earned), 0) AS xp
       FROM learning_attempt
      WHERE owner_id = ? AND deleted_at IS NULL
      GROUP BY level_id;`,
    [ownerId],
  );
  const eventXp = attempts.reduce((sum, row) => sum + Math.max(0, row.xp), 0);
  const eventCounts = new Map(attempts.map((row) => [row.level_id, row.count]));
  const baselineCounts: Record<string, number> = {};
  for (const [levelId, level] of Object.entries(levels)) {
    if (typeof level !== 'object' || level === null || Array.isArray(level)) continue;
    const count = (level as Record<string, unknown>).attemptCount;
    if (typeof count === 'number' && Number.isFinite(count)) {
      baselineCounts[levelId] = Math.max(0, count - (eventCounts.get(levelId) ?? 0));
    }
  }
  return {
    baselineXp: Math.max(0, xpTotal - eventXp),
    baselineAttemptCounts: JSON.stringify(baselineCounts),
  };
}

/** Zustand `persist` adaptörü. Üç metot da senkron. */
export const progressStorage: StateStorage = {
  getItem: (name) => {
    const database = getDatabase();
    if (database === null) {
      return legacyStore.getString(name) ?? null;
    }

    const ownerId = getActiveOwnerId(database);
    const row = database.getFirstSync<{ state_json: string }>(
      `SELECT state_json FROM progress_state
        WHERE owner_id = ? AND deleted_at IS NULL;`,
      [ownerId],
    );
    if (row !== null) {
      return row.state_json;
    }

    // Faz 7'ye yükselen cihazdaki MMKV kaydını bir kez SQLite'a al.
    const legacy = legacyStore.getString(name);
    if (legacy === undefined) {
      return null;
    }
    const now = Date.now();
    const baseline = deriveBaseline(database, ownerId, legacy);
    database.withTransactionSync(() => {
      database.runSync(
        `INSERT INTO progress_state
           (owner_id, state_json, baseline_xp, baseline_attempt_counts_json,
            updated_at, deleted_at, server_version)
         VALUES (?, ?, ?, ?, ?, NULL, 0);`,
        [ownerId, legacy, baseline.baselineXp, baseline.baselineAttemptCounts, now],
      );
      enqueueMutation(database, 'progress_state', 'main', 'upsert', {
        state: legacy,
        baselineXp: baseline.baselineXp,
        baselineAttemptCounts: baseline.baselineAttemptCounts,
      }, now);
    });
    legacyStore.remove(name);
    return legacy;
  },
  setItem: (name, value) => {
    const database = getDatabase();
    if (database === null) {
      legacyStore.set(name, value);
      return;
    }
    const ownerId = getActiveOwnerId(database);
    const now = Date.now();
    const existing = database.getFirstSync<{
      state_json: string;
      baseline_xp: number;
      baseline_attempt_counts_json: string;
      deleted_at: number | null;
    }>(
      `SELECT state_json, baseline_xp, baseline_attempt_counts_json, deleted_at
         FROM progress_state WHERE owner_id = ?;`,
      [ownerId],
    );
    // `streak`, `badges` ve `pendingBadges` partialize dışında olsa da Zustand
    // her setState'te storage'ı çağırır. Aynı snapshot'ı tekrar outbox'a koymak
    // her pull sonrasında sonsuz bir progress_state yankısı üretirdi.
    if (existing?.deleted_at === null && existing.state_json === value) {
      return;
    }
    const baseline = existing === null
      ? deriveBaseline(database, ownerId, value)
      : {
          baselineXp: existing.baseline_xp,
          baselineAttemptCounts: existing.baseline_attempt_counts_json,
        };
    database.withTransactionSync(() => {
      database.runSync(
        `INSERT INTO progress_state
           (owner_id, state_json, baseline_xp, baseline_attempt_counts_json,
            updated_at, deleted_at, server_version)
         VALUES (?, ?, ?, ?, ?, NULL, 0)
         ON CONFLICT(owner_id) DO UPDATE SET
           state_json = excluded.state_json,
           updated_at = excluded.updated_at,
           deleted_at = NULL;`,
        [ownerId, value, baseline.baselineXp, baseline.baselineAttemptCounts, now],
      );
      enqueueMutation(database, 'progress_state', 'main', 'upsert', {
        state: value,
        baselineXp: baseline.baselineXp,
        baselineAttemptCounts: baseline.baselineAttemptCounts,
      }, now);
    });
  },
  removeItem: (name) => {
    const database = getDatabase();
    if (database === null) {
      legacyStore.remove(name);
      return;
    }
    const ownerId = getActiveOwnerId(database);
    const now = Date.now();
    const row = database.getFirstSync<{
      state_json: string;
      baseline_xp: number;
      baseline_attempt_counts_json: string;
    }>(
      `SELECT state_json, baseline_xp, baseline_attempt_counts_json
         FROM progress_state WHERE owner_id = ? AND deleted_at IS NULL;`,
      [ownerId],
    );
    if (row === null) {
      legacyStore.remove(name);
      return;
    }
    database.withTransactionSync(() => {
      database.runSync(
        `UPDATE progress_state
            SET deleted_at = ?, updated_at = ?
          WHERE owner_id = ? AND deleted_at IS NULL;`,
        [now, now, ownerId],
      );
      enqueueMutation(database, 'progress_state', 'main', 'delete', {
        state: row.state_json,
        baselineXp: row.baseline_xp,
        baselineAttemptCounts: row.baseline_attempt_counts_json,
      }, now);
    });
    legacyStore.remove(name);
  },
};
