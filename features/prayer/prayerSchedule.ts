/**
 * Gün içi vakit mantığı — saf. `Date.now()` YOK; şimdi her zaman argüman.
 *
 * Bu dosyanın saf olması testlerin var olma sebebi: "Yatsı'dan sonra sıradaki
 * vakit yarının İmsak'ıdır" gibi bir kuralı cihaz saatini değiştirmeden
 * sınamanın başka yolu yok.
 */

import { addDays } from '@/features/progress/streak';

import type { ClockTime, IsoDate, NextPrayer, PrayerName, PrayerTimes, Timestamp } from '@/types';

/**
 * Vakitlerin gün içi sırası. `orderedPrayers` ve `findNextPrayer` bu diziye
 * dayanıyor; sırası değiştirilirse ikisi de yanlış cevap verir.
 */
const PRAYER_ORDER: readonly PrayerName[] = ['imsak', 'gunes', 'ogle', 'ikindi', 'aksam', 'yatsi'];

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const CLOCK = /^(\d{2}):(\d{2})$/;

/** `'HH:MM'` → gün içi dakika. Bozuk girdide `null`. */
export function clockToMinutes(time: ClockTime): number | null {
  const match = CLOCK.exec(time);
  if (match === null) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) {
    return null;
  }

  return hours * 60 + minutes;
}

/**
 * Yerel tarih + duvar saati → epoch.
 *
 * ⚠️ **`gününEpoch'u + dakika * 60000` YAPILMAZ.** Yaz saati geçişinin olduğu
 * gün 23 ya da 25 saat sürer ve toplama o gün bütün vakitleri kaydırır.
 * `new Date(y, m - 1, d, hh, mm)` motorun yerel çözümünü kullanır ve geçişi
 * kendisi halleder. (`streak.dayDifference`in `Date.UTC` disiplininin bu
 * dosyadaki karşılığı — orada gün sayılıyor, burada duvar saati çözülüyor.)
 *
 * ⚠️ Türkiye 2016'dan beri kalıcı UTC+3, yaz saati yok; bu satırın koruduğu
 * kullanıcı Türkiye vakitlerine yurt dışından bakan kullanıcı ve testlerin
 * koştuğu makine.
 *
 * İleri alma boşluğuna düşen (var olmayan) bir saat motor tarafından ileri
 * kaydırılır; kabul edilen davranış.
 */
export function localEpochFor(date: IsoDate, time: ClockTime): Timestamp | null {
  const dateMatch = ISO_DATE.exec(date);
  if (dateMatch === null) {
    return null;
  }

  const minutes = clockToMinutes(time);
  if (minutes === null) {
    return null;
  }

  const resolved = new Date(
    Number(dateMatch[1]),
    Number(dateMatch[2]) - 1,
    Number(dateMatch[3]),
    Math.floor(minutes / 60),
    minutes % 60,
    0,
    0,
  );

  const epoch = resolved.getTime();
  return Number.isFinite(epoch) ? epoch : null;
}

/**
 * Altı vakit, gün içi sırasıyla.
 *
 * Okunamayan vakit listeden DÜŞER — ekranda yanlış bir saat göstermektense o
 * satırı hiç göstermemek doğru. (`toPrayerTimes` kısmi satır yazmadığı için
 * pratikte bu yalnızca elle kurulmuş veride olur.)
 */
export function orderedPrayers(times: PrayerTimes): { name: PrayerName; time: ClockTime }[] {
  const result: { name: PrayerName; time: ClockTime }[] = [];

  for (const name of PRAYER_ORDER) {
    const time = times[name];
    if (clockToMinutes(time) !== null) {
      result.push({ name, time });
    }
  }

  return result;
}

/**
 * Sıradaki vakit.
 *
 * Aday listesi = bugünün altı vakti + YARININ İmsak'ı. İlk `at > now` olan
 * kazanır.
 *
 * ⚠️ Karşılaştırma **katı `>`**, `>=` değil: vaktin tam dakikasında sıradaki
 * vakit ARTIK O DEĞİLDİR. `>=` olsaydı geri sayım o dakika boyunca sıfırda
 * takılır ve `useCountdown` sürekli `onElapsed` tetiklerdi.
 *
 * ⚠️ Yarının İmsak'ının aday listesinde olması gece yarısını kendiliğinden
 * aşan şeydir: 22:30'da Yatsı geçmiştir, kalan tek aday yarının İmsak'ıdır ve
 * `at` doğal olarak gece yarısının ötesindedir. Ayrı bir "gece" dalı yok.
 *
 * Adayların hepsi geçmişse **`null`** döner — negatif geri sayım yok, dürüst
 * boş durum (4.0'ın "boş durumu dürüstçe göster" kararı).
 */
export function findNextPrayer(
  today: PrayerTimes | null,
  tomorrow: PrayerTimes | null,
  now: Timestamp,
): NextPrayer | null {
  const candidates: NextPrayer[] = [];

  if (today !== null) {
    for (const { name, time } of orderedPrayers(today)) {
      const at = localEpochFor(today.date, time);
      if (at !== null) {
        candidates.push({ name, date: today.date, time, at, isTomorrow: false });
      }
    }
  }

  if (tomorrow !== null) {
    const at = localEpochFor(tomorrow.date, tomorrow.imsak);
    if (at !== null && clockToMinutes(tomorrow.imsak) !== null) {
      candidates.push({
        name: 'imsak',
        date: tomorrow.date,
        time: tomorrow.imsak,
        at,
        isTomorrow: true,
      });
    }
  }

  candidates.sort((a, b) => a.at - b.at);

  return candidates.find((candidate) => candidate.at > now) ?? null;
}

/**
 * `date`in ertesi günü. `addDays`in ince sarmalayıcısı — namaz tarafı "yarın"ı
 * tek bir yerden söylesin diye.
 */
export function nextDay(date: IsoDate): IsoDate | null {
  return addDays(date, 1);
}
