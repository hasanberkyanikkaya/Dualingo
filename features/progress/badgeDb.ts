import { getDatabase } from '@/lib/database';

import type { BadgeId, BadgeUnlock, Timestamp } from '@/types';

/**
 * Kazanılmış rozetlerin okuma/yazma katmanı — `badge_unlock` tablosu.
 *
 * ⚠️ **Bu dosyada KARAR MANTIĞI yok** (veritabanı yoksa sessizce çık dışında).
 * Değerlendirmenin tamamı `badges.ts`te ve orası saf olduğu için Node test
 * koşucusunda sınanabiliyor. `tests/badgeDb.test.ts` **yazılamaz**: Node
 * `expo-sqlite`ı yükleyemez. `activityDb.ts`in birebir deseni.
 *
 * ⚠️ **Doğruluk kaynağı burasıdır**, store'daki `badges` alanı değil. Rozetin
 * girdisi (`xpTotal`, `levels`) MMKV'de ve Expo Go'da her soğuk açılışta
 * sıfırlanıyor; yani seride olduğu gibi "her açılışta yeniden hesapla" yolu
 * kapalı. Kalıcı olması gereken şey sonucun kendisi.
 *
 * Şema `lib/database.ts` içindeki göç listesinde (`MIGRATIONS[1]`).
 */

/** Yaşayan tüm kazanımları kazanılma sırasına göre verir. */
export function readEarnedBadges(): BadgeUnlock[] {
  const database = getDatabase();
  if (database === null) {
    return [];
  }

  const rows = database.getAllSync<{
    badge_id: string;
    earned_at: number;
    updated_at: number;
    deleted_at: number | null;
  }>(
    'SELECT badge_id, earned_at, updated_at, deleted_at FROM badge_unlock WHERE deleted_at IS NULL ORDER BY earned_at ASC;',
  );

  return rows.map((row) => ({
    badgeId: row.badge_id,
    earnedAt: row.earned_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  }));
}

/** Bir rozetin kazanıldığını yazar. Zaten kazanılmışsa ilk anı korur. */
export function recordBadgeUnlock(badgeId: BadgeId, earnedAt: Timestamp, now: Timestamp): void {
  const database = getDatabase();
  if (database === null) {
    return;
  }

  // ⚠️ `MIN(earned_at)`: ikinci yazma ilk kazanım anını EZMEZ. Çağrının
  // idempotent olması bir süs değil — açılıştaki geriye dönük tarama, React
  // 19'un çift çalışması ve Faz 7'nin birleştirmesi aynı satıra üç ayrı yoldan
  // gelebiliyor. (`activity_day`in `lesson_count + 1` tuzağının burada
  // karşılığı yok, çünkü sayaç yok.)
  //
  // ⚠️ `deleted_at = NULL` **diriltme** satırı: `resetProgress`ten sonra aynı
  // rozet yeniden kazanılırsa satır geri gelmeli (`activityDb`nin aynı kuralı).
  // Kabul edilen bedel: o durumda kart ESKİ tarihi gösterir.
  database.runSync(
    `INSERT INTO badge_unlock (badge_id, earned_at, updated_at, deleted_at)
     VALUES (?, ?, ?, NULL)
     ON CONFLICT(badge_id) DO UPDATE SET
       earned_at  = MIN(badge_unlock.earned_at, excluded.earned_at),
       updated_at = excluded.updated_at,
       deleted_at = NULL;`,
    [badgeId, earnedAt, now],
  );
}

/**
 * Tüm rozetleri yumuşak siler — `resetProgress`in veritabanı ayağı.
 *
 * ⚠️ Bu çağrı olmadan "her şeyi sıfırla" dedikten sonra rozetler hayalet gibi
 * geri gelir: MMKV tarafı sıfırlanır ama tablo yerinde durur. Seride yaşanmış
 * hatanın aynısı.
 */
export function softDeleteAllBadges(now: Timestamp): void {
  const database = getDatabase();
  if (database === null) {
    return;
  }

  database.runSync(
    'UPDATE badge_unlock SET deleted_at = ?, updated_at = ? WHERE deleted_at IS NULL;',
    [now, now],
  );
}
