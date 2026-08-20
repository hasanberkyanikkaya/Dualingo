/**
 * Türkçe tarih biçimlendirme — saf, `Date.now()` çağırmaz.
 *
 * ⚠️ **`toLocaleDateString('tr-TR')` KULLANILMIYOR ve bu bilinçli.** Hermes'in
 * tam ICU içermeyen Android derlemesinde yerel biçimlendirme sessizce köke
 * (`en`) düşebiliyor; "20 August 2026" gibi bir satır ekrana çıkar ve hata
 * yalnızca bazı cihazlarda görünür. `answerEngine.normalizeTr`in (2.3) elle
 * harf eşlemesi tam bu yüzden yazılmıştı — aynı motor, aynı temkin.
 *
 * ⚠️ Ay ve gün adları **yapısal takvim etiketidir**, dini içerik değil.
 * (Hicri tarih bu dosyada YOK: onu servis yazıyor, biz göstermekle
 * yetiniyoruz — `types/prayer.ts` `hicriLong`.)
 */

import type { IsoDate } from '@/types';

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

const MONTHS: readonly string[] = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];

/** `Date.getUTCDay()` sırası: 0 = Pazar. */
const WEEKDAYS: readonly string[] = [
  'Pazar',
  'Pazartesi',
  'Salı',
  'Çarşamba',
  'Perşembe',
  'Cuma',
  'Cumartesi',
];

/**
 * `'2026-08-20'` → `'20 Ağustos 2026, Perşembe'`. Bozuk ya da takvimde
 * olmayan tarihte `null`.
 *
 * ⚠️ **Gün adı `Date.UTC` üzerinden bulunuyor, yerel `new Date(y, m, d)` ile
 * DEĞİL.** Yerel kurulumda motor tarih dizgesini yerel gece yarısına oturtur
 * ve saat dilimine göre gün adı bir kayabilir. `streak.dayDifference`in aynı
 * disiplini: gün SAYILIRKEN ya da ADLANDIRILIRKEN UTC, duvar saati
 * ÇÖZÜLÜRKEN yerel (`prayerSchedule.localEpochFor`).
 *
 * ⚠️ Burada `streak.parseIsoDate`ten bir adım öteye gidilip **takvim
 * doğrulaması** da yapılıyor: `2026-02-29` biçim olarak geçerli ama takvimde
 * yok ve `Date.UTC` onu sessizce 1 Mart'a taşır. Sessizce yanlış gün adı
 * yazmaktansa satırı hiç yazmamak doğru.
 */
export function formatGregorianTr(date: IsoDate): string | null {
  const match = ISO_DATE.exec(date);
  if (match === null) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  const resolved = new Date(Date.UTC(year, month - 1, day));

  // Taşma denetimi: `Date.UTC(2026, 1, 29)` 1 Mart döner ve sessizce yanlış
  // gün adı yazdırırdı.
  if (
    resolved.getUTCFullYear() !== year ||
    resolved.getUTCMonth() !== month - 1 ||
    resolved.getUTCDate() !== day
  ) {
    return null;
  }

  return `${day} ${MONTHS[month - 1]} ${year}, ${WEEKDAYS[resolved.getUTCDay()]}`;
}
