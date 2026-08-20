import type { IsoDate, StreakState, Timestamp } from '@/types';

/**
 * Yerel gün aritmetiği — saf. React yok, `Date.now()` yok.
 *
 * ⚠️ Seri KARARLARI burada DEĞİL, `features/progress/dayLog.ts`te. Bu dosya
 * yalnızca "epoch → yerel gün" ve "iki gün arası kaç gün" sorularını yanıtlar.
 * (Faz 3.1'e kadar burada bir `advanceStreak` vardı; seri artık SQLite'taki gün
 * kayıtlarından türetildiği için silindi.)
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
 * Biçimi bozuk tarih için `null` döner; çağıran onu geçersiz sayar.
 */
export function dayDifference(from: IsoDate, to: IsoDate): number | null {
  const start = parseIsoDate(from);
  const end = parseIsoDate(to);

  if (start === null || end === null) {
    return null;
  }

  return Math.round((end - start) / 86_400_000);
}

/**
 * `'YYYY-MM-DD'` → UTC gece yarısı epoch'u. Biçim tutmuyorsa `null`.
 *
 * ⚠️ Yalnızca biçim denetleniyor, takvim geçerliliği DEĞİL: `'2026-02-31'`
 * kabul edilir ve `Date.UTC` onu 3 Mart'a taşır. Bu bilinçli — girdi her zaman
 * `toLocalIsoDate`ten ya da diskteki bir satırdan gelir, ikisi de var olmayan
 * gün üretemez. Elle yazılmış bozuk veriyi eleyen şey biçim denetimidir.
 */
function parseIsoDate(value: IsoDate): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
  if (match === null) {
    return null;
  }
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/** Biçimi geçerli bir yerel tarih mi? `dayDifference`ın tekil hâli. */
export function isValidIsoDate(value: IsoDate): boolean {
  return parseIsoDate(value) !== null;
}

/**
 * Bir yerel tarihe gün ekler (negatif değer çıkarır).
 *
 * ⚠️ Toplama UTC gece yarısında yapılıyor, `Date` üzerinde yerel saatle değil:
 * yaz saati geçişinin olduğu gün yerel toplama saat kaydırır ve sonuç aynı güne
 * ya da iki gün ötesine düşebilir. `dayDifference`ın tersidir ve onunla aynı
 * zeminde çalışmak zorunda.
 *
 * Biçimi bozuk tarih için `null` döner.
 */
export function addDays(value: IsoDate, days: number): IsoDate | null {
  const base = parseIsoDate(value);
  if (base === null) {
    return null;
  }
  const shifted = new Date(base + days * 86_400_000);
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`;
}

/** Hiç ders yapılmamış başlangıç serisi. */
export function emptyStreak(): StreakState {
  return { currentDays: 0, longestDays: 0, lastActiveDate: '', updatedAt: 0 };
}
