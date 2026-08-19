import type { LevelId, LevelProgress, Unit } from '@/types';

/**
 * Seviye kilidi açma mantığı — saf. React yok, store yok, tema yok.
 *
 * ⚠️ Bu dosyanın birim testli olmasının sebebi titizlik değil: **yanlış kilit
 * elle test etmekle görünmez.** Kullanıcı dersi bitirir, ekran doğru görünür,
 * sıradaki seviye sessizce kapalı kalır ve yol orada donar. Hatanın ortaya
 * çıkması için tam o seviyeye kadar oynamak gerekir.
 *
 * Testleri `tests/unlock.test.ts`.
 */

type ProgressMap = Record<LevelId, LevelProgress>;

/**
 * Kayıt geçerli mi. Yumuşak silme mimari kural 6: silinen kayıt sözlükte durur.
 *
 * ⚠️ Aynı cümle `features/learning/levelStatus.ts` içinde de var ve orası onu
 * dışa vermiyor — bilinçli (2.1 kararı: "kural tek yerde" derken kastedilen
 * *durum türetme*nin tek yerde olması). Buradaki kopya üç satır ve testli;
 * iki modülü birbirine bağlamaktan ucuz.
 */
function isLive(record: LevelProgress | undefined): record is LevelProgress {
  return record !== undefined && record.deletedAt === null;
}

/** Yeni açılan seviyenin sıfırdan kaydı. */
function freshAvailable(levelId: LevelId, now: number): LevelProgress {
  return {
    levelId,
    status: 'available',
    stars: 0,
    bestAccuracy: 0,
    attemptCount: 0,
    updatedAt: now,
    deletedAt: null,
  };
}

/**
 * Yolun tamamındaki seviye kimlikleri, oynanış sırasıyla.
 *
 * Sıralama burada YAPILMAZ: `contentLoader` üniteleri ve seviyeleri `order`
 * alanına göre sıralanmış veriyor. İkinci kez sıralamak, sıralamanın iki yerde
 * yaşaması demek olurdu.
 */
export function flattenLevelIds(units: readonly Unit[]): LevelId[] {
  const ids: LevelId[] = [];
  for (const unit of units) {
    if (!Array.isArray(unit?.levels)) {
      continue;
    }
    for (const level of unit.levels) {
      ids.push(level.id);
    }
  }
  return ids;
}

/**
 * Bir seviye tamamlandığında sıradakini açar.
 *
 * Sıra **ünite sınırını aşar**: bir ünitenin son seviyesi bitince sıradaki
 * ünitenin ilk seviyesi açılır.
 *
 * ⚠️ **Asla geri düşürmez.** Sıradaki seviyenin yaşayan bir kaydı varsa
 * (`available`, `skipped` ya da `completed`) sözlüğe dokunulmaz. Tespit
 * sınavıyla açılmış (`skipped`) ya da çoktan bitirilmiş bir seviye, önceki
 * seviyenin tekrarı yüzünden `available`'a inmemeli.
 *
 * ⚠️ **Değişiklik yoksa AYNI referans döner.** `useLevelProgress` doğrudan
 * `store.levels`'ı veriyor; her çağrıda yeni nesne üretmek seviye haritasını
 * boşuna yeniden çizdirirdi.
 *
 * Hiçbir koşulda fırlatmaz ve girdiyi değiştirmez.
 */
export function unlockNext(
  units: readonly Unit[],
  levels: ProgressMap,
  completedLevelId: LevelId,
  now: number,
): ProgressMap {
  const order = flattenLevelIds(units);
  const index = order.indexOf(completedLevelId);

  // Bilinmeyen seviye ya da yolun sonu — açılacak bir şey yok.
  if (index < 0 || index + 1 >= order.length) {
    return levels;
  }

  const nextId = order[index + 1];

  // Yaşayan kayıt varsa dokunma. Yumuşak silinmiş kayıt "hiç açılmamış"
  // sayıldığı için (bkz. `levelStatus.ts`) taze kayıtla DİRİLTİLİR.
  if (isLive(levels[nextId])) {
    return levels;
  }

  return { ...levels, [nextId]: freshAvailable(nextId, now) };
}

/**
 * Yolun ilk seviyesinin açık olmasını garanti eder.
 *
 * ⚠️ Bu fonksiyon olmadan **bomboş bir kurulum tamamen kilitli** açılır: hiç
 * kayıt yoktur, `resolveLevelStatus` kaydı olmayan her seviyeye `locked` der,
 * ilk seviye dahil hiçbir şeye dokunulamaz ve `unlockNext`'i tetikleyecek bir
 * tamamlama da hiçbir zaman olamaz. Kilitlenmenin en sessiz biçimi.
 *
 * `unlockNext` gibi: değişiklik yoksa aynı referans döner, fırlatmaz.
 */
export function ensureEntryPoint(
  units: readonly Unit[],
  levels: ProgressMap,
  now: number,
): ProgressMap {
  const firstId = flattenLevelIds(units)[0];

  if (firstId === undefined || isLive(levels[firstId])) {
    return levels;
  }

  return { ...levels, [firstId]: freshAvailable(firstId, now) };
}
