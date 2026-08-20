import type {
  BadgeCondition,
  BadgeDefinition,
  BadgeId,
  BadgeUnlock,
  LevelId,
  LevelProgress,
  StreakState,
  Timestamp,
  Unit,
  UnitId,
} from '@/types';

/**
 * Rozet değerlendirmesi — saf karar mantığı.
 *
 * ⚠️ **Bu dosya YALNIZCA `@/types` import eder.** Ne store, ne `contentLoader`
 * (JSON'u `import` ile alıyor, Node onu çözemez), ne `badgeDb` (`expo-sqlite`
 * yerel modül). Kural kırılırsa `tests/badges.test.ts` değil **tüm test
 * paketi** okunamaz bir hatayla düşer — `dayLog` (saf, testli) / `activityDb`
 * (yerel, testsiz) ayrımının birebir aynısı.
 *
 * ⚠️ **Geri alma YOK ve bu imza düzeyinde bir garantidir.** `evaluateBadges`
 * yalnızca YENİ kazanılanları döndürür; "kaybedildi" diye bir dönüş değeri
 * yoktur. Sebebi somut: rozetin girdisi (`xpTotal`, `levels`) MMKV'de ve Expo
 * Go'da her soğuk açılışta sıfırlanıyor. Geri alma mümkün olsaydı kullanıcı
 * kazandığı rozeti uygulamayı kapattığı için kaybederdi. Amnezi bu tasarımda
 * en kötü ihtimalle "bugün yeni rozet yok" der.
 *
 * Değişiklik yoksa **aynı referans** döner (`unlock.ts` disiplini): rozet
 * aboneleri her derste gereksiz yere yeniden çizilmesin diye.
 */

type ProgressMap = Record<LevelId, LevelProgress>;

/** Değişiklik olmadığında dönen paylaşılan boş diziler — referans kararlılığı. */
const NO_AWARDS: readonly BadgeAward[] = [];
const NO_UNIT_IDS: readonly UnitId[] = [];

/**
 * Değerlendirmenin gördüğü tüm dünya.
 *
 * Store da veritabanı da burada YOK: girdi düz sayı ve kimlik listesi olduğu
 * için değerlendirme testte kurulabiliyor.
 */
export type BadgeSnapshot = {
  xpTotal: number;
  /** `status === 'completed'` ve `deletedAt === null` olan seviye sayısı. */
  completedLevelCount: number;
  /** `StreakState.longestDays`. */
  streakDays: number;
  /** Tüm seviyeleri tamamlanmış ünitelerin kimlikleri. */
  completedUnitIds: readonly UnitId[];
};

/** Bir rozetin kazanıldığı an. */
export type BadgeAward = {
  badgeId: BadgeId;
  earnedAt: Timestamp;
};

/** Kayıt yaşıyor mu — yumuşak silinmiş kayıt "hiç yok" sayılır (mimari kural 6). */
function isLive(record: LevelProgress | undefined): record is LevelProgress {
  return record !== undefined && record.deletedAt === null;
}

/** Seviye gerçekten çalışılıp tamamlandı mı. `skipped` buraya girmez. */
function isCompleted(record: LevelProgress | undefined): boolean {
  return isLive(record) && record.status === 'completed';
}

/**
 * Eşik kullanılabilir mi.
 *
 * ⚠️ `threshold: 0` "herkese hemen ver" demek olurdu — sessiz ve geri alınamaz
 * bir içerik hatası. Doğrulayıcı bunu zaten `error` olarak bildiriyor;
 * değerlendirici de bozuk bir tanımı bedava rozete çevirmemeli.
 */
function isUsableThreshold(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

/**
 * Bozuk sayıyı 0'a indirger.
 *
 * `NaN >= 100` zaten `false` verir, ama `NaN`i anlık görüntünün içine sokmak
 * onu arayüze ve `strings` yer tutucularına taşırdı. `ProgressBar`ın "bozuk
 * girdi sessizce boş çubuk" kuralının buradaki karşılığı.
 */
function safeCount(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

/**
 * Yol + ilerleme + seri → anlık görüntü.
 *
 * `units` argüman olarak geliyor; bu dosya `contentLoader`ı çağıramaz.
 */
export function buildBadgeSnapshot(
  units: readonly Unit[],
  levels: ProgressMap,
  xpTotal: number,
  streak: StreakState,
): BadgeSnapshot {
  let completedLevelCount = 0;
  const completedUnitIds: UnitId[] = [];

  for (const unit of units) {
    // ⚠️ Boş ünite rozet VERMEZ. `every` boş dizide `true` döner; koruma
    // olmasaydı içerikteki bir yazım hatası (seviyesiz ünite) bedava rozete
    // dönerdi.
    let unitComplete = unit.levels.length > 0;

    for (const level of unit.levels) {
      if (isCompleted(levels[level.id])) {
        completedLevelCount += 1;
      } else {
        unitComplete = false;
      }
    }

    if (unitComplete) {
      completedUnitIds.push(unit.id);
    }
  }

  return {
    xpTotal: safeCount(xpTotal),
    completedLevelCount,
    streakDays: safeCount(streak.longestDays),
    completedUnitIds: completedUnitIds.length > 0 ? completedUnitIds : NO_UNIT_IDS,
  };
}

/** Tek bir koşul sağlandı mı. Bilinmeyen ya da bozuk koşul → `false`. */
export function isConditionMet(condition: BadgeCondition, snapshot: BadgeSnapshot): boolean {
  switch (condition.type) {
    case 'xpTotal':
      return isUsableThreshold(condition.threshold) && snapshot.xpTotal >= condition.threshold;

    case 'levelsCompleted':
      return (
        isUsableThreshold(condition.threshold) &&
        snapshot.completedLevelCount >= condition.threshold
      );

    case 'streakDays':
      return isUsableThreshold(condition.threshold) && snapshot.streakDays >= condition.threshold;

    case 'unitCompleted':
      return snapshot.completedUnitIds.includes(condition.unitId);

    default:
      // İçerik OTA ile geliyor; bilinmeyen bir koşul tipi eski bir ikilide
      // gerçekten görülebilir. Sessizce kazanılmamış sayılır.
      return false;
  }
}

/**
 * Yeni kazanılan rozetler — başka hiçbir şey.
 *
 * Yeni bir şey yoksa **paylaşılan boş dizi** döner.
 */
export function evaluateBadges(
  definitions: readonly BadgeDefinition[],
  snapshot: BadgeSnapshot,
  earnedIds: readonly BadgeId[],
  now: Timestamp,
): readonly BadgeAward[] {
  const earned = new Set(earnedIds);
  const awards: BadgeAward[] = [];

  for (const definition of definitions) {
    if (earned.has(definition.id)) {
      continue;
    }
    if (!isConditionMet(definition.condition, snapshot)) {
      continue;
    }

    awards.push({ badgeId: definition.id, earnedAt: now });
  }

  return awards.length > 0 ? awards : NO_AWARDS;
}

/**
 * Kuyruğa ekler; aynı kimliği İKİ KEZ eklemez.
 *
 * ⚠️ İdempotens burada bir süs değil: React 19 + `reactCompiler` altında bir
 * güncelleyici iki kez çalışabiliyor ve kuyruk körü körüne `[...eski, ...yeni]`
 * ile büyütülseydi kullanıcı her rozeti iki kez görürdü.
 */
export function queueBadges(
  current: readonly BadgeId[],
  incoming: readonly BadgeId[],
): readonly BadgeId[] {
  const seen = new Set(current);
  const added = incoming.filter((badgeId) => {
    if (seen.has(badgeId)) {
      return false;
    }
    seen.add(badgeId);
    return true;
  });

  return added.length > 0 ? [...current, ...added] : current;
}

/**
 * Kazanım önbelleğini yeni kazanımlarla birleştirir.
 *
 * ⚠️ Var olan kaydın `earnedAt`i KORUNUR — ilk kazanım anı ezilmemeli
 * (`badgeDb`deki `MIN(earned_at)` ile aynı kural, iki tarafta da aynı sonuç).
 */
export function mergeAwards(
  current: readonly BadgeUnlock[],
  awards: readonly BadgeAward[],
): readonly BadgeUnlock[] {
  if (awards.length === 0) {
    return current;
  }

  const known = new Set(current.map((unlock) => unlock.badgeId));
  const added: BadgeUnlock[] = [];

  for (const award of awards) {
    if (known.has(award.badgeId)) {
      continue;
    }
    known.add(award.badgeId);
    added.push({
      badgeId: award.badgeId,
      earnedAt: award.earnedAt,
      updatedAt: award.earnedAt,
      deletedAt: null,
    });
  }

  return added.length > 0 ? [...current, ...added] : current;
}

/**
 * İki kazanım listesi aynı kimlik kümesini mi taşıyor.
 *
 * `readEarnedBadges()` her çağrıda YENİ bir dizi döndürüyor; bu kapı olmadan
 * her ders sonunda tüm rozet aboneleri yeniden çizilirdi
 * (`ensureEntryPoint`teki `levels !== state.levels` denetiminin ikizi).
 */
export function hasSameUnlocks(a: readonly BadgeUnlock[], b: readonly BadgeUnlock[]): boolean {
  if (a === b) {
    return true;
  }
  if (a.length !== b.length) {
    return false;
  }

  const ids = new Set(a.map((unlock) => unlock.badgeId));
  return b.every((unlock) => ids.has(unlock.badgeId));
}
