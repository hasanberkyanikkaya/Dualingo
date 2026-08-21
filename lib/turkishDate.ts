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

/**
 * Kısa ay adları — çizelgenin dar hücreleri için (Faz 4.3).
 *
 * ⚠️ Kısaltmalar UZUN adlardan TÜRETİLMİYOR (`slice(0, 3)` "Ağu" verirdi ama
 * "Haz"ı "Haz", "Tem"i "Tem" yaparken "Mayıs"ı "May"a indirir ve tutarsız
 * görünürdü). Elle yazılmış olması, bir gün biri değiştirmek istediğinde
 * değiştirilecek tek yerin burası olması demek.
 */
const MONTHS_SHORT: readonly string[] = [
  'Oca',
  'Şub',
  'Mar',
  'Nis',
  'May',
  'Haz',
  'Tem',
  'Ağu',
  'Eyl',
  'Eki',
  'Kas',
  'Ara',
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

/** Kısa gün adları — ızgara başlıkları. `WEEKDAYS` ile aynı sıra. */
const WEEKDAYS_SHORT: readonly string[] = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

/**
 * Pazartesi başlangıçlı kısa gün adları — aylık ızgaranın sütun başlıkları.
 *
 * ⚠️ Sıra `WEEKDAYS_SHORT`ten FARKLI: o `Date.getUTCDay()` sırasında (0 =
 * Pazar), bu takvim ızgarasının sırasında (`prayerChart.startOfWeek` haftayı
 * Pazartesi'den başlatıyor). İki sıra karışırsa takvim bir gün kayar ve hata
 * yalnızca gözle görülür.
 */
export const WEEKDAY_HEADERS_TR: readonly string[] = [
  'Pzt',
  'Sal',
  'Çar',
  'Per',
  'Cum',
  'Cmt',
  'Paz',
];

/**
 * `'2026-08-20'` → parçalar, takvim doğrulamasıyla. Bozuk tarihte `null`.
 *
 * `formatGregorianTr`ın içinden çıkarıldı (Faz 4.3): aynı taşma denetimini üç
 * biçimlendiricinin ayrı ayrı yazması, birinde unutulması demekti.
 */
function parse(date: IsoDate): { year: number; month: number; day: number; weekday: number } | null {
  const match = ISO_DATE.exec(date ?? '');
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

  // ⚠️ Taşma denetimi: `Date.UTC(2026, 1, 29)` 1 Mart döner ve sessizce yanlış
  // gün adı yazdırırdı.
  if (
    resolved.getUTCFullYear() !== year ||
    resolved.getUTCMonth() !== month - 1 ||
    resolved.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day, weekday: resolved.getUTCDay() };
}

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
  const parts = parse(date);
  if (parts === null) {
    return null;
  }

  return `${parts.day} ${MONTHS[parts.month - 1]} ${parts.year}, ${WEEKDAYS[parts.weekday]}`;
}

/**
 * `(2026, 8)` → `'Ağustos 2026'`. Ay aralık dışındaysa `null`.
 *
 * Ay görünümünün başlığı. Yıl her zaman yazılıyor: kullanıcı aylar arasında
 * ileri geri gezinirken yıl sınırını geçtiğini başka türlü fark edemez.
 */
export function monthTitleTr(year: number, month: number): string | null {
  if (month < 1 || month > 12) {
    return null;
  }
  return `${MONTHS[month - 1]} ${year}`;
}

/** `'2026-08-18'` → `'18 Ağu'`. Bozuk ya da takvimde olmayan tarihte `null`. */
export function shortDateTr(date: IsoDate): string | null {
  const parts = parse(date);
  return parts === null ? null : `${parts.day} ${MONTHS_SHORT[parts.month - 1]}`;
}

/** `'2026-08-18'` → `'Sal'`. Bozuk ya da takvimde olmayan tarihte `null`. */
export function weekdayShortTr(date: IsoDate): string | null {
  const parts = parse(date);
  return parts === null ? null : WEEKDAYS_SHORT[parts.weekday];
}
