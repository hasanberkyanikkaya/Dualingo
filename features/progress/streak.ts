import type { IsoDate, StreakState, Timestamp } from '@/types';

/**
 * Günlük seri (streak) mantığı — saf. React yok, `Date.now()` yok.
 *
 * Testleri `tests/streak.test.ts`.
 */

/** İki basamağa doldurur: 3 → "03". */
function pad(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

/**
 * Epoch ms → `'YYYY-MM-DD'`, **yerel** takvime göre.
 *
 * ⚠️ `toISOString()` KULLANILMAZ. O UTC'ye çevirir; Türkiye'de akşam 21:00'de
 * bitirilen bir ders UTC'de ertesi güne düşer ve seri gün sınırını yanlış yerden
 * sayar. `types/progress.ts` `lastActiveDate`i tam bu yüzden epoch değil yerel
 * tarih olarak tanımlıyor.
 */
export function toLocalIsoDate(timestamp: Timestamp): IsoDate {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * İki yerel tarih arasındaki tam gün farkı.
 *
 * ⚠️ Epoch farkını 86.400.000'e bölmek YANLIŞ olurdu: yaz saati geçişinin
 * olduğu gün 23 ya da 25 saat sürer ve bölme o gün bir gün eksik/fazla verir.
 * Bu yüzden tarih parçaları `Date.UTC` ile gece yarısına sabitlenip
 * karşılaştırılıyor — ikisi de UTC olduğu için aradan yaz saati çıkıyor.
 *
 * Biçimi bozuk tarih için `null` döner; çağıran onu "boşluk" sayar.
 */
function dayDifference(from: IsoDate, to: IsoDate): number | null {
  const parse = (value: IsoDate): number | null => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
    if (match === null) {
      return null;
    }
    return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  };

  const start = parse(from);
  const end = parse(to);

  if (start === null || end === null) {
    return null;
  }

  return Math.round((end - start) / 86_400_000);
}

/**
 * Seriyi bugüne taşır.
 *
 * Aynı gün → seri değişmez (günde beş ders bitirmek seriyi beşe çıkarmaz).
 * Bir önceki gün → `+1`. Daha eski, ileri tarihli ya da bozuk → `1`'e sıfırlanır.
 *
 * `longestDays` asla düşmez.
 */
export function advanceStreak(
  streak: StreakState,
  todayIso: IsoDate,
  now: Timestamp,
): StreakState {
  const difference = dayDifference(streak.lastActiveDate, todayIso);

  if (difference === 0) {
    // Aynı gün: sayaç değişmiyor ama gün yine de "etkin" sayılıyor.
    return { ...streak, lastActiveDate: todayIso, updatedAt: now };
  }

  const currentDays = difference === 1 ? streak.currentDays + 1 : 1;

  return {
    currentDays,
    longestDays: Math.max(streak.longestDays, currentDays),
    lastActiveDate: todayIso,
    updatedAt: now,
  };
}

/** Hiç ders yapılmamış başlangıç serisi. */
export function emptyStreak(): StreakState {
  return { currentDays: 0, longestDays: 0, lastActiveDate: '', updatedAt: 0 };
}
