import { addDays, dayDifference, isValidIsoDate } from '@/features/progress/streak';

import type { IsoDate, StreakState, Timestamp } from '@/types';

/**
 * Seri (streak) hesabı — **saf**. React yok, `Date.now()` yok, saat dilimi yok.
 *
 * ⚠️ **Bu dosya `activityDb.ts`i HİÇBİR KOŞULDA import etmez.** Bağımlılık yönü
 * tek taraflı: `store → dayLog` ve `store → activityDb`; `dayLog` veritabanını
 * bilmez. `expo-sqlite` yerel bir modül ve Node test koşucusunda yüklenemez;
 * ters bağımlılık kurulursa TÜM test paketi okunamaz bir hatayla patlar.
 * (Oturum 2.5'teki `audioKey` saf / `audio` yerel ayrımının aynısı.)
 *
 * ## Seri dondurma kalıcılaştırılmaz, YENİDEN OYNATILIR
 *
 * Diskte freeze tablosu ya da sütunu **yok**. Hak, gün listesi üzerinde ileri
 * yürünerek her seferinde yeniden türetiliyor.
 *
 * Gerekçe Faz 7 (bulut senkronizasyonu): freeze bir veri değil, veri üzerinde
 * bir **hesap sonucudur**. Kalıcılaştırılsaydı çevrimdışı iki cihaz aynı boşluğu
 * farklı görür, senkronizasyondan sonra "gün kaydı var ama onu çelişkiye düşüren
 * freeze satırı da var" durumu doğardı; düzeltmek ya sert silme (mimari kural 6
 * ihlali) ya da kayan pencerenin kalıcı olarak kirlenmesi demekti. Yeniden
 * oynatmada bu hata sınıfı **var olamaz**: gün kümesi bir *küme*dir, birleşimi
 * sıradan bağımsız ve tekrara dayanıklıdır. Aynı gün kümesi → aynı sonuç.
 *
 * ⚠️ Kabul edilen iki bedel:
 * 1. **Kural değişimi geçmişi geriye yazar.** Yarın "haftada iki freeze" denirse
 *    eski seriler sessizce uzar. Bugün kural sabit; kaçış yolu `STREAK_RULES`in
 *    `computeStreak`e parametre olarak geçebilmesi (versiyonlu kural).
 * 2. **Yalnız otomatik hak türetilebilir.** İleride satın alınan ya da rozetle
 *    kazanılan freeze gelirse o kalıcı OLMAK ZORUNDA — hiçbir gün verisinden
 *    çıkarılamaz. İmza onu kırıcı olmayan bir dördüncü argümanla alabilir.
 *
 * Testleri `tests/dayLog.test.ts`.
 */

/**
 * Serinin bugün gözüken hâli.
 *
 * ⚠️ **`enum` DEĞİL, union type.** Node'un tip soyucusu `enum` desteklemiyor
 * (`tests/setup.ts`); `enum` yazılırsa testler hiç çalışmaz.
 *
 * `none` ile `broken` bilerek ayrı: `strings.progress` hem `streakStarted` hem
 * `streakLost` taşıyor ve "hiç başlamadı" ile "kırıldı" ayrılmadan doğru metin
 * seçilemez.
 */
export type StreakStatus =
  /** Hiç etkin gün yok (ya da bugünün tarihi okunamadı). */
  | 'none'
  /** Bugün ders yapıldı. */
  | 'active'
  /** Dün yapıldı, bugün henüz yok — seri yaşıyor ama bugün kaçarsa kırılır. */
  | 'atRisk'
  /** Dün kaçırıldı, hak var — seri bir dondurmayla ayakta duruyor. */
  | 'frozen'
  /** Seri kırıldı. */
  | 'broken';

/** Seri hesabının tam sonucu. */
export type StreakSnapshot = {
  /** Süregelen seri, gün. Kırıksa 0. */
  currentDays: number;
  /** Tüm geçmişteki en uzun seri, gün. */
  longestDays: number;
  /** En son etkin gün; hiç yoksa `null`. */
  lastActiveDate: IsoDate | null;
  /**
   * ⚠️ **BUGÜNE BAĞLI ALAN — asla kalıcılaştırılmaz.** Geçmiş deterministik ama
   * "bugün" cihaza göre değişir (Türkiye'de 20 Ağustos, Hawaii'de 19 Ağustos).
   * Diske yazılan tek şey `toStreakState`in döndürdüğü dört sayıdır.
   */
  status: StreakStatus;
  /** Geçerli ve benzersiz etkin gün sayısı. */
  totalActiveDays: number;
  /**
   * Kapalı geçmişte **tüketilmiş** dondurma günleri.
   *
   * ⚠️ Bugünkü `status: 'frozen'` buraya GİRMEZ — o hak rezervedir, tüketilmiş
   * değil. Boşluğun ikinci ucu (bir sonraki etkin gün) henüz yok; kullanıcı
   * bugün de oynamazsa boşluk üçe çıkar, seri kırılır ve hak harcanmamış olur.
   */
  frozenDates: readonly IsoDate[];
  /** Dondurma hakkının doğacağı gün. `null` ise hak şu an var. */
  freezeReadyOn: IsoDate | null;
};

/**
 * Dondurma kuralları.
 *
 * `freezeWindowDays` **kayan** penceredir, takvim haftası değil: hak, son
 * tüketimden bu kadar gün sonra doğar. Takvim haftası seçilseydi pazar akşamı ve
 * pazartesi ard arda iki dondurma mümkün olurdu.
 *
 * `freezableGapDays` iki etkin gün arasındaki kurtarılabilir mesafedir; 2 = tam
 * bir gün kaçırıldı. Üç ve üzeri (iki gün kaçırma) tek hakla zaten kurtarılamaz.
 */
export type StreakRules = {
  /** Kayan pencere uzunluğu, gün. */
  freezeWindowDays: number;
  /** Kurtarılabilir boşluk, gün. */
  freezableGapDays: number;
};

/**
 * ⚠️ `as const` KULLANILMAZ: değerler `7` ve `2` gibi birebir tiplere daralır ve
 * `Partial<StreakRules>` ile kural geçersiz kılınamaz hâle gelirdi. Testlerin
 * pencereyi değiştirebilmesi bu genişliğe bağlı.
 */
export const STREAK_RULES: StreakRules = {
  freezeWindowDays: 7,
  freezableGapDays: 2,
};

/** Hiç etkin gün yokken dönen sonuç. */
function emptySnapshot(): StreakSnapshot {
  return {
    currentDays: 0,
    longestDays: 0,
    lastActiveDate: null,
    status: 'none',
    totalActiveDays: 0,
    frozenDates: [],
    freezeReadyOn: null,
  };
}

/**
 * Girdiyi temizler: biçimi bozuk günleri atar, bugünden ileri olanları atar,
 * tekilleştirir, artan sıralar.
 *
 * ⚠️ Girdi sırasına **güvenilmiyor**, çağıranın sıralamış olması beklenmiyor.
 * (`activityDb.readActiveDates` `ORDER BY date ASC` veriyor ama bu fonksiyonun
 * doğruluğu ona bağlı olmamalı.)
 *
 * ⚠️ Bozuk tarih ve ileri tarih **atılıyor**, seriyi sıfırlamıyor. Faz 3.1
 * öncesindeki `advanceStreak` ikisini de "boşluk" sayıp seriyi kırıyordu;
 * bilinçli davranış değişikliği — tek bir bozuk satır geçmişin tamamını
 * silmemeli.
 */
function normalizeDates(activeDates: readonly IsoDate[], todayIso: IsoDate): IsoDate[] {
  const todayValid = isValidIsoDate(todayIso);
  const unique = new Set<IsoDate>();

  for (const date of activeDates) {
    if (!isValidIsoDate(date)) {
      continue;
    }
    if (todayValid && (dayDifference(date, todayIso) ?? -1) < 0) {
      continue;
    }
    unique.add(date);
  }

  // `YYYY-MM-DD` sabit genişlikte ve sıfır dolgulu olduğu için metinsel sıralama
  // takvim sırasıyla aynı. Biçim seçiminin sessiz kazancı.
  return [...unique].sort();
}

/** Verilen gün için dondurma hakkı var mı? Kayan pencere; sınır gün DAHİL. */
function canFreeze(lastFreeze: IsoDate | null, missed: IsoDate, rules: StreakRules): boolean {
  if (lastFreeze === null) {
    return true;
  }
  const since = dayDifference(lastFreeze, missed);
  return since !== null && since >= rules.freezeWindowDays;
}

/**
 * Serinin ardışık gün sayısını, en uzun seriyi ve tüketilen dondurmaları
 * kapalı geçmiş üzerinde hesaplar. Bugün kenarı burada DEĞİL.
 */
function replayHistory(
  days: readonly IsoDate[],
  rules: StreakRules,
): { run: number; longest: number; frozenDates: IsoDate[]; lastFreeze: IsoDate | null } {
  let run = 1;
  let longest = 1;
  let lastFreeze: IsoDate | null = null;
  const frozenDates: IsoDate[] = [];

  for (let index = 1; index < days.length; index += 1) {
    // Günler tekil ve sıralı olduğu için fark her zaman >= 1.
    const gap = dayDifference(days[index - 1], days[index]) ?? Number.MAX_SAFE_INTEGER;

    if (gap === 1) {
      run += 1;
    } else {
      const missed = gap === rules.freezableGapDays ? addDays(days[index - 1], 1) : null;

      if (missed !== null && canFreeze(lastFreeze, missed, rules)) {
        frozenDates.push(missed);
        lastFreeze = missed;
        // ⚠️ Dondurulan gün sayaca EKLENMEZ; artıran şey onu izleyen ETKİN gün.
        // 5 günlük seri + kaçırılan gün + bir ders = 6, 7 değil. `currentDays`
        // "kaç gün ders yaptım"ı anlatır ve `currentDays <= totalActiveDays`
        // sınanabilir bir değişmez olarak kalır.
        run += 1;
      } else {
        run = 1;
      }
    }

    longest = Math.max(longest, run);
  }

  return { run, longest, frozenDates, lastFreeze };
}

/**
 * Bugün kenarı: seri hâlâ yaşıyor mu, yaşıyorsa hangi gerekçeyle?
 *
 * ⚠️ `atRisk` ve `frozen` durumlarında `currentDays` **DÜŞMEZ**. Ekranda
 * "serin 5 gün" yazarken altında "bugün henüz ders yapmadın" demek doğru;
 * sayıyı düşürmek kullanıcının kazandığı günleri geri almak olurdu. Ayrım
 * sayıda değil `status` alanında taşınıyor — bu alanın var olma sebebi budur.
 */
function resolveToday(
  lastActiveDate: IsoDate,
  tailGap: number | null,
  run: number,
  lastFreeze: IsoDate | null,
  rules: StreakRules,
): { status: StreakStatus; currentDays: number } {
  // Bugünün tarihi okunamadı: geçmiş yine de hesaplandı (`longestDays` doğru),
  // ama "şu an" hakkında hiçbir şey söylenemez.
  if (tailGap === null) {
    return { status: 'none', currentDays: 0 };
  }

  if (tailGap === 0) {
    return { status: 'active', currentDays: run };
  }

  if (tailGap === 1) {
    return { status: 'atRisk', currentDays: run };
  }

  const missed = tailGap === rules.freezableGapDays ? addDays(lastActiveDate, 1) : null;

  if (missed !== null && canFreeze(lastFreeze, missed, rules)) {
    return { status: 'frozen', currentDays: run };
  }

  return { status: 'broken', currentDays: 0 };
}

/** Hak şu an varsa `null`, yoksa doğacağı gün. */
function resolveFreezeReadyOn(
  lastFreeze: IsoDate | null,
  todayIso: IsoDate,
  rules: StreakRules,
): IsoDate | null {
  if (lastFreeze === null) {
    return null;
  }

  const readyOn = addDays(lastFreeze, rules.freezeWindowDays);
  if (readyOn === null) {
    return null;
  }

  const remaining = dayDifference(todayIso, readyOn);
  return remaining !== null && remaining > 0 ? readyOn : null;
}

/**
 * Etkin gün listesinden seriyi hesaplar.
 *
 * `activeDates` sırasız ve bozuk kayıt içerebilir; `todayIso` yerel bugündür
 * (`toLocalIsoDate(Date.now())`). `rules` yalnızca sınama ve gelecekteki kural
 * versiyonlaması için — üretimde geçilmez.
 */
export function computeStreak(
  activeDates: readonly IsoDate[],
  todayIso: IsoDate,
  rules?: Partial<StreakRules>,
): StreakSnapshot {
  const merged: StreakRules = { ...STREAK_RULES, ...rules };
  const days = normalizeDates(activeDates, todayIso);

  if (days.length === 0) {
    return emptySnapshot();
  }

  const { run, longest, frozenDates, lastFreeze } = replayHistory(days, merged);
  const lastActiveDate = days[days.length - 1];
  const tailGap = dayDifference(lastActiveDate, todayIso);

  const { status, currentDays } = resolveToday(lastActiveDate, tailGap, run, lastFreeze, merged);

  return {
    currentDays,
    longestDays: longest,
    lastActiveDate,
    status,
    totalActiveDays: days.length,
    frozenDates,
    freezeReadyOn: resolveFreezeReadyOn(lastFreeze, todayIso, merged),
  };
}

/**
 * Anlık görüntüyü store önbelleğine daraltır.
 *
 * ⚠️ **Türetilmiş alanları düşüren TEK kapı burasıdır.** `status`, `frozenDates`
 * ve `freezeReadyOn` bugüne bağlı; diske yazılırlarsa yarın yalan söylerler.
 * Store içinde elle nesne kurulsaydı er geç biri `status`u da kopyalardı —
 * tek kapı, tek test (`tests/dayLog.test.ts`, anahtar sayısı denetimi).
 */
export function toStreakState(snapshot: StreakSnapshot, now: Timestamp): StreakState {
  return {
    currentDays: snapshot.currentDays,
    longestDays: snapshot.longestDays,
    lastActiveDate: snapshot.lastActiveDate ?? '',
    updatedAt: now,
  };
}
