/**
 * Günün vakit tablosunun durumu — saf. `Date.now()` YOK; şimdi her zaman
 * argüman.
 *
 * `prayerSchedule.ts` "sıradaki vakit hangisi" sorusunu cevaplıyor; bu dosya
 * "tablodaki her satır ne durumda" sorusunu. İkisi ayrı çünkü kart ile tablo
 * aynı kararı iki kez vermemeli.
 *
 * ⚠️ **Faz kararı `findNextPrayer`in kararına UYAR, onu tekrar hesaplamaz.**
 * Bağımsız hesaplansaydı iki tanım bir gün ayrışır ve kart "sıradaki: İkindi"
 * derken tablo Akşam'ı işaretlerdi — hiçbir testin yakalayamayacağı, yalnızca
 * ekrana bakınca görülen bir çelişki.
 */

import { localEpochFor, orderedPrayers } from '@/features/prayer/prayerSchedule';

import type { ClockTime, NextPrayer, PrayerName, PrayerTimes, Timestamp } from '@/types';

/**
 * Satırın gün içindeki yeri.
 *
 * ⚠️ **`enum` DEĞİL, union** — Node'un tip soyucusu `enum` desteklemiyor
 * (`tests/setup.ts`); `enum` yazılırsa tüm test paketi çalışmaz.
 */
export type PrayerPhase = 'past' | 'next' | 'upcoming';

export type PrayerRow = {
  name: PrayerName;
  time: ClockTime;
  /** Vaktin yerel epoch karşılığı — sıralama ve karşılaştırma buradan. */
  at: Timestamp;
  phase: PrayerPhase;
  /**
   * Namaz mı — işaretleme kutusunu bu alan açar.
   *
   * ⚠️ Güneş için `false`. Güneş bir namaz vakti değil, sabah namazının
   * bittiği andır; "kıldım" diye işaretlenebilir olması yanlış olurdu.
   * Satırın kendisi tabloda KALIR — Diyanet'in yayınladığı tablo altı satır ve
   * atıf metni o tabloya yapılıyor.
   */
  trackable: boolean;
  marked: boolean;
};

/**
 * İşaretlenebilir vakitler — beş vakit namaz.
 *
 * Yapısal bir liste, fıkhi bir hüküm değil: hangi satırın yanında kutu
 * çizileceğini söylüyor, o kadar.
 */
const TRACKABLE: readonly PrayerName[] = ['imsak', 'ogle', 'ikindi', 'aksam', 'yatsi'];

/** Güneş dışındaki her vakit işaretlenebilir. */
export function isTrackable(name: PrayerName): boolean {
  return TRACKABLE.includes(name);
}

/**
 * Günün tablosu.
 *
 * ⚠️ **Vaktin TAM dakikasında satır `'past'` olur.** `findNextPrayer` katı `>`
 * kullanıyor (o dakikada sıradaki vakit artık o değildir); buradaki `at <= now`
 * onun aynadaki yüzü. İkisi gevşerse tablo ile kart aynı anda hem "geçti" hem
 * "sıradaki" der.
 *
 * ⚠️ **Yatsı'dan sonra altı satırın altısı da `'past'`tır** ve hiçbiri `'next'`
 * işaretlenmez: `next` o saatte yarının İmsak'ıdır ve bu tabloya ait değildir
 * (`isTomorrow`). Doğru ve dürüst hâl — gün bitmiştir.
 *
 * ⚠️ Okunamayan vakit `orderedPrayers` tarafından düşürülür; epoch'a
 * çevrilemeyen vakit burada düşer. Ekranda yanlış bir saat göstermektense o
 * satırı hiç göstermemek doğru.
 */
export function buildPrayerDay(
  times: PrayerTimes | null,
  next: NextPrayer | null,
  marked: readonly PrayerName[],
  now: Timestamp,
): PrayerRow[] {
  if (times === null) {
    return [];
  }

  // `next` yarına aitse bu tablonun hiçbir satırı "sıradaki" değildir.
  const nextName = next !== null && !next.isTomorrow && next.date === times.date ? next.name : null;

  const rows: PrayerRow[] = [];

  for (const { name, time } of orderedPrayers(times)) {
    const at = localEpochFor(times.date, time);
    if (at === null) {
      continue;
    }

    rows.push({
      name,
      time,
      at,
      phase: name === nextName ? 'next' : at <= now ? 'past' : 'upcoming',
      trackable: isTrackable(name),
      marked: isTrackable(name) && marked.includes(name),
    });
  }

  return rows;
}

/**
 * İşaretlenmiş vakit sayısı.
 *
 * ⚠️ Yalnızca `trackable` satırlar sayılır. Diskte bir şekilde `gunes` kaydı
 * bulunsa bile (bugün yazan yol yok) özet satırı `6 / 5` gibi imkânsız bir
 * sayı göstermemeli.
 */
export function markedCount(rows: readonly PrayerRow[]): number {
  return rows.filter((row) => row.trackable && row.marked).length;
}

/** Tabloda kaç vakit işaretlenebilir — sağlam veride 5. */
export function trackableCount(rows: readonly PrayerRow[]): number {
  return rows.filter((row) => row.trackable).length;
}
