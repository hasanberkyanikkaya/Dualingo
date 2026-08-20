import type { LevelId, LevelProgress, LevelStatus, StarCount, Unit } from '@/types';

/**
 * İlerleme kaydından seviye durumunu türeten saf mantık.
 *
 * Faz 2.4'te sahte veri gerçek store'la değişecek ama bu dosya AYNEN kalacak:
 * girdisi `Record<LevelId, LevelProgress>`, kaynağı kim olursa olsun.
 * Saf olduğu için o gün birim testi de buraya yazılabilir.
 */

type ProgressMap = Record<LevelId, LevelProgress>;

/**
 * Bir kaydın geçerli olup olmadığı. Yumuşak silme (`deletedAt`) mimari kural 6:
 * sert silme yok, silinen kayıt sözlükte durmaya devam eder.
 *
 * ⚠️ Silinmiş kaydı YOK saymak zorunda olduğumuz tek yer burası. Kural başka
 * dosyalara dağılırsa biri unutur ve seviye sessizce yanlış durumda görünür.
 */
function isLive(progress: LevelProgress | undefined): progress is LevelProgress {
  return progress !== undefined && progress.deletedAt === null;
}

/**
 * Seviyenin haritada görüneceği durum.
 * Kaydı olmayan — ya da yumuşak silinmiş — seviye hiç açılmamıştır: `locked`.
 */
export function resolveLevelStatus(levelId: LevelId, progress: ProgressMap): LevelStatus {
  const record = progress[levelId];
  return isLive(record) ? record.status : 'locked';
}

/** Tamamlanmamış seviyenin yıldızı yoktur; eski bir yıldız kalıntısı gösterilmez. */
export function resolveStars(levelId: LevelId, progress: ProgressMap): StarCount {
  const record = progress[levelId];
  if (!isLive(record) || record.status !== 'completed') {
    return 0;
  }
  return record.stars;
}

/**
 * "Şu an buradasın" işareti taşıyacak seviye.
 *
 * ⚠️ Bu bir `LevelStatus` DEĞİL, türetilmiş bir bayrak. Seviye tespit sınavından
 * sonra aynı anda birden çok seviye `available` olabilir; geçerli olan, yol
 * sırasında bunlardan İLKİdir. Kimse açık değilse `null` döner.
 */
export function findCurrentLevelId(units: readonly Unit[], progress: ProgressMap): LevelId | null {
  for (const unit of units) {
    for (const level of unit.levels) {
      if (resolveLevelStatus(level.id, progress) === 'available') {
        return level.id;
      }
    }
  }
  return null;
}

/**
 * Verilen seviyeden SONRA gelen ilk oynanabilir seviye — ders sonundaki
 * "Sonraki ders" butonunun hedefi.
 *
 * ⚠️ `findCurrentLevelId` bu iş için KULLANILAMAZ. O, yolun tamamındaki ilk
 * `available` seviyeyi verir; yolun ortasındaki tamamlanmış bir seviyeyi tekrar
 * eden kullanıcıda o seviye çok ileride kalır ve buton kullanıcıyı ileri
 * fırlatırdı. Burada sıra `afterLevelId`'den başlıyor.
 *
 * `locked` olmayan ilk seviye seçiliyor: `completed` ve `skipped` de geçerli
 * hedefler — tekrar oynanabilirler, `xpForRun` zaten tekrarı ayrıştırıyor.
 * `afterLevelId` yolda yoksa ya da sonrası boşsa `null` döner.
 */
export function findNextLevelId(
  units: readonly Unit[],
  progress: ProgressMap,
  afterLevelId: LevelId,
): LevelId | null {
  let seen = false;

  for (const unit of units) {
    for (const level of unit.levels) {
      if (!seen) {
        // Ünite sınırını aşarak arıyoruz: sonraki ders bir sonraki ünitede olabilir.
        seen = level.id === afterLevelId;
        continue;
      }
      if (resolveLevelStatus(level.id, progress) !== 'locked') {
        return level.id;
      }
    }
  }

  return null;
}

/** Ünite başlığındaki ilerleme çubuğunun payı. */
export function countCompleted(unit: Unit, progress: ProgressMap): number {
  return unit.levels.filter((level) => resolveLevelStatus(level.id, progress) === 'completed').length;
}
