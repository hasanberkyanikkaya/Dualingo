import { flattenLevels, freshRecord } from '@/features/progress/unlock';

import type { Difficulty, LevelId, LevelProgress, Unit } from '@/types';

/**
 * Seviye tespit sınavının karar mantığı — saf. React yok, store yok, tema yok.
 *
 * ⚠️ Bu dosyanın birim testli olmasının sebebi `unlock.ts`inkiyle aynı: **yanlış
 * yerleştirme elle test etmekle görünmez.** Sınav biter, harita makul görünür,
 * kullanıcı yanlış noktadan başlar. Hatanın ortaya çıkması için içeriğin
 * tamamını bilmek gerekir.
 *
 * Testleri `tests/placement.test.ts`.
 */

type ProgressMap = Record<LevelId, LevelProgress>;

/** Kademelerin sırası. Sözlük olması `Difficulty`ye yeni değer eklenirse derlemede yakalar. */
const RANK: Record<Difficulty, number> = { beginner: 0, basic: 1, advanced: 2 };

/** Sıradan kademeye — `RANK`ın tersi. */
const BY_RANK: readonly Difficulty[] = ['beginner', 'basic', 'advanced'];

/** Geçen not: yüzde 70. Kullanıcının beyanını onaylamak için gereken doğruluk. */
const PASS_PERCENT = 70;

/**
 * Sınav sonucundan başlangıç kademesi.
 *
 * Kullanıcı kademesini önce **beyan ediyor**; sınavın işi onu doğrulamak ya da
 * bir kademe düşürmek. ⚠️ **Asla yükseltmiyor:** kendi beyanının üstüne çıkarmak
 * sınavın işi değil — Başlangıç diyen birini altı soruya bakıp İleri'ye atmak,
 * kullanıcının kendi hakkındaki bilgisini yok saymak olurdu.
 *
 * ⚠️ **Tam sayı aritmetiği** (`lessonScoring.ts` kalıbı): `correct / total >= 0.7`
 * kayan noktada eşiğin tam üstündeki sonucu yanlış yöne yuvarlayabilir.
 *
 * `total <= 0` → beyan olduğu gibi kabul edilir. "En baştan başlamak istiyorum"
 * yolu ve içerik havuzunun boş olduğu durum bu daldan geçiyor; ikisi için ayrı
 * bir eylem yazmaya gerek kalmıyor.
 */
export function resolvePlacementDifficulty(
  declared: Difficulty,
  correct: number,
  total: number,
): Difficulty {
  if (!Number.isFinite(correct) || !Number.isFinite(total) || total <= 0) {
    return declared;
  }

  if (correct * 100 >= total * PASS_PERCENT) {
    return declared;
  }

  // Bir kademe aşağı; `beginner` taban yapar, altı yok.
  return BY_RANK[Math.max(0, RANK[declared] - 1)];
}

/**
 * Hedef kademenin yoldaki giriş noktası: **düz sırada o kademeyi taşıyan İLK
 * seviye.**
 *
 * ⚠️ Kural sıra tabanlı, kademe tabanlı değil — ve bu fark içerikte gerçek.
 * Örnek yolun kademeleri monoton DEĞİL (`beginner×4, basic, beginner×2,
 * basic×2, advanced`). "Kademesi daha düşük her seviyeyi atla" deseydik
 * `basic` sonucunda `u2-01`/`u2-02` de atlanır, `u2-03` kilitli kalır ve
 * haritada delikli bir yol çıkardı. Sıra tabanlı kural deliksiz bir yol
 * üretiyor: bir noktaya kadar her şey atlanmış, o noktadan sonrası dokunulmamış.
 *
 * Kademe hiç bulunamazsa bir alt kademeye iner (bugün `advanced` tek seviye
 * taşıyor; yarın içerikten çıkarsa akış kilitlenmemeli). Hiçbiri yoksa yolun
 * ilk seviyesi. Yol boşsa `null`.
 */
export function findEntryLevelId(units: readonly Unit[], difficulty: Difficulty): LevelId | null {
  const levels = flattenLevels(units);

  if (levels.length === 0) {
    return null;
  }

  for (let rank = RANK[difficulty]; rank >= 0; rank -= 1) {
    const target = BY_RANK[rank];
    const match = levels.find((level) => level.difficulty === target);

    if (match !== undefined) {
      return match.id;
    }
  }

  return levels[0].id;
}

/** Kayıt geçerli mi. Yumuşak silme mimari kural 6 (`unlock.ts`teki kopyanın eşi). */
function isLive(record: LevelProgress | undefined): record is LevelProgress {
  return record !== undefined && record.deletedAt === null;
}

/**
 * Tespit sonucunu ilerleme sözlüğüne uygular.
 *
 * Giriş noktasından **öncesi** `skipped` (atlandı ama açık — kullanıcı geri
 * dönüp çalışabilir), giriş noktası `available`, **sonrasına hiç dokunulmaz**.
 *
 * ⚠️ **Asla geri düşürmez** — `unlock.ts`in felsefesinin aynısı, ama burada
 * gerekçe daha keskin: sınav profilden tekrar edilebiliyor ve daha düşük bir
 * kademe seçmek çoktan bitirilmiş dersleri silmemeli.
 *
 *   yok / silinmiş → taze kayıt
 *   `available`    → önce ise `skipped` (ileri hareket: "sıran değil, atlandı")
 *   `skipped`      → giriş noktasıysa `available` (sırası geldi), değilse aynı
 *   `completed`    → **her koşulda dokunulmaz**
 *
 * ⚠️ **Giriş noktası her zaman yaşayan bir kayıt taşır.** Bu garanti olmadan
 * `findCurrentLevelId` `null` döner, "Şu an buradasın" kaybolur ve kullanıcının
 * gidecek yeri kalmaz. (Tek istisna: giriş noktası zaten `completed` — o zaman
 * `unlockNext` sonrasını çoktan açmıştır.)
 *
 * Değişiklik yoksa **aynı referans** döner; harita boşuna yeniden çizilmesin
 * diye (`useLevelProgress` doğrudan `store.levels`ı veriyor).
 * Hiçbir koşulda fırlatmaz ve girdiyi değiştirmez.
 */
export function applyPlacement(
  units: readonly Unit[],
  levels: ProgressMap,
  difficulty: Difficulty,
  now: number,
): ProgressMap {
  const order = flattenLevels(units).map((level) => level.id);
  const entryId = findEntryLevelId(units, difficulty);
  const entryIndex = entryId === null ? -1 : order.indexOf(entryId);

  if (entryIndex < 0) {
    return levels;
  }

  const next: ProgressMap = { ...levels };
  let changed = false;

  for (let index = 0; index <= entryIndex; index += 1) {
    const levelId = order[index];
    const current = levels[levelId];
    const target = index === entryIndex ? 'available' : 'skipped';

    if (isLive(current) && current.status === 'completed') {
      continue;
    }

    if (isLive(current) && current.status === target) {
      continue;
    }

    next[levelId] = isLive(current)
      ? { ...current, status: target, updatedAt: now }
      : // Yumuşak silinmiş kayıt "hiç açılmamış" sayılır (bkz. `levelStatus.ts`),
        // bu yüzden diriltilmiyor, taze kayıtla ÜZERİNE yazılıyor.
        freshRecord(levelId, target, now);
    changed = true;
  }

  return changed ? next : levels;
}
