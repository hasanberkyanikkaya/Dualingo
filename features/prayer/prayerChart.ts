/**
 * Çizelge geometrisi ve durum döngüsü — saf. `Date.now()` YOK; "bugün" her
 * zaman argüman.
 *
 * `prayerDay.ts` BİR günün tablosunu kuruyor; bu dosya bir HAFTANIN ve bir
 * AYIN ızgarasını. İkisi de aynı `PrayerMarkMap`i okuyor, hiçbiri diske
 * dokunmuyor. Testleri `tests/prayerChart.test.ts`.
 *
 * ⚠️ **Gün aritmetiği `features/progress/streak.ts`ten geliyor** (`addDays`,
 * `dayDifference`, `isValidIsoDate`). İkinci bir tarih kütüphanesi yazmak, yaz
 * saati ve UTC kararlarını ikinci kez vermek olurdu; o kararlar 3.1'de bir kez
 * verildi ve testleri var.
 */

import { TRACKABLE_PRAYERS } from '@/features/prayer/prayerDay';
import { addDays, dayDifference, isValidIsoDate } from '@/features/progress/streak';

import type { IsoDate, PrayerMarkMap, PrayerMarkStatus, PrayerName } from '@/types';

/**
 * Izgaranın sütunları — beş vakit, gün içi sırasıyla.
 *
 * Güneş HİÇ girmiyor: namaz vakti değil, sabah namazının bittiği andır
 * (`prayerDay.isTrackable`). Günlük tabloda satırı korunuyor çünkü orada
 * Diyanet'in yayınladığı tablo gösteriliyor; çizelge ise kullanıcının kendi
 * kaydı ve orada Güneş'in işi yok.
 */
export const CHART_PRAYERS: readonly PrayerName[] = TRACKABLE_PRAYERS;

/** Bir ızgara hücresi — ay görünümünde ay dışı hücreler için `null`. */
export type ChartDay = {
  date: IsoDate;
  /** Ayın kaçıncı günü — hücrede yazan sayı. */
  dayOfMonth: number;
  isToday: boolean;
  /**
   * Düzenlenebilir mi.
   *
   * ⚠️ **Gelecek günler düzenlenemez.** Henüz girmemiş bir vakti "kıldım" diye
   * işaretlemek anlamsız (günlük tablodaki `phase === 'past'` kuralının
   * çizelgedeki karşılığı). Çizelge GÜN hassasiyetinde çalışıyor: bugün
   * düzenlenebilir, yarın değil. Bugünün henüz girmemiş vakitleri için gün içi
   * hassasiyet günlük tabloda duruyor — çizelgede aynı katılığı uygulamak,
   * geçmiş bir günü düzeltmeye gelen kullanıcıyı bugünün yarısından mahrum
   * bırakırdı.
   */
  editable: boolean;
  marks: PrayerMarkMap;
};

export type ChartCell = ChartDay | null;

/** Özet — yalnızca OLUMLU kayıtlar sayılır. */
export type ChartSummary = {
  kilindi: number;
  kaza: number;
};

/**
 * 5 Ocak 1970 bir Pazartesi. Hafta başlangıcını bulmanın çapası.
 *
 * ⚠️ Hafta **Pazartesi** başlıyor. `Date.getUTCDay()` kullanılsaydı 0 = Pazar
 * olurdu ve her yerde bir kaydırma taşımak gerekirdi.
 */
const EPOCH_MONDAY: IsoDate = '1970-01-05';

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Durum döngüsü: kayıt yok → kılındı → kaza → kayıt yok.
 *
 * ⚠️ Sıralama bilinçli: en sık konacak işaret (kılındı) tek dokunuşta geliyor,
 * kaza ikinci dokunuşta, temizleme üçüncüde. Ters sıra kullanıcıyı en sık
 * yaptığı işlem için iki dokunuşa zorlardı.
 */
export function nextStatus(current: PrayerMarkStatus): PrayerMarkStatus {
  if (current === 'kilinmadi') {
    return 'kilindi';
  }
  return current === 'kilindi' ? 'kaza' : 'kilinmadi';
}

/** Tarihin içinde bulunduğu haftanın Pazartesi'si. Bozuk tarihte `null`. */
export function startOfWeek(date: IsoDate): IsoDate | null {
  const diff = dayDifference(EPOCH_MONDAY, date);
  if (diff === null) {
    return null;
  }

  // ⚠️ İki kez `% 7`: JavaScript'te `-3 % 7` **-3** verir, 4 değil. 1970
  // öncesi bir tarih bugün gelmiyor ama kural elle yazılmış bir tarihle
  // sınanabilir ve sessizce yanlış hafta üretmemeli.
  const offset = ((diff % 7) + 7) % 7;
  return addDays(date, -offset);
}

/**
 * Haftanın kapsadığı aralık — Pazartesi'den Pazar'a, **sınırlar dahil**.
 *
 * SQLite aralık okuması bunu doğrudan kullanıyor (`readPrayerLogRange`).
 */
export function weekRange(date: IsoDate): { from: IsoDate; to: IsoDate } | null {
  const from = startOfWeek(date);
  if (from === null) {
    return null;
  }

  const to = addDays(from, 6);
  return to === null ? null : { from, to };
}

/** Ayın gün sayısı. `Date.UTC(y, m, 0)` bir önceki ayın son gününü verir. */
function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function pad(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

/**
 * `'2026-08-20'` → parçalar. Takvimde olmayan tarihte `null`.
 *
 * ⚠️ `streak.parseIsoDate` yalnızca BİÇİM denetliyor ve `'2026-02-31'`i kabul
 * edip 3 Mart'a taşıyor; orada bu bilinçliydi çünkü girdi hep `toLocalIsoDate`
 * ya da diskten geliyor. Burada girdi ayrıca ROTA PARAMETRESİ olabiliyor,
 * dolayısıyla takvim doğrulaması da yapılıyor (`lib/turkishDate.ts`in aynı
 * gerekçesi).
 */
function parseParts(date: IsoDate): { year: number; month: number; day: number } | null {
  const match = ISO_DATE.exec(date ?? '');
  if (match === null) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    return null;
  }

  return { year, month, day };
}

/** `(2026, 8)` → `'2026-08-01'`. */
export function firstOfMonth(year: number, month: number): IsoDate {
  return `${year}-${pad(month)}-01`;
}

/** Bir tarihin yıl ve ay parçaları — başlık yazmak için. Bozuk tarihte `null`. */
export function monthOf(date: IsoDate): { year: number; month: number } | null {
  const parts = parseParts(date);
  return parts === null ? null : { year: parts.year, month: parts.month };
}

/**
 * Ayın kapsadığı aralık — ayın ilk ve son günü, **sınırlar dahil**.
 *
 * ⚠️ Izgaranın ay DIŞI hücreleri bu aralığa girmiyor ve girmemeli: o hücreler
 * boş çiziliyor, onlar için veri okumak gereksiz olurdu.
 */
export function monthRange(anchor: IsoDate): { from: IsoDate; to: IsoDate } | null {
  const parts = parseParts(anchor);
  if (parts === null) {
    return null;
  }

  return {
    from: firstOfMonth(parts.year, parts.month),
    to: `${parts.year}-${pad(parts.month)}-${pad(daysInMonth(parts.year, parts.month))}`,
  };
}

/**
 * Ay ekler/çıkarır ve **ayın ilkine** oturur.
 *
 * ⚠️ Gün korunsaydı 31 Ocak + 1 ay taşardı (`Date` onu 3 Mart'a atar) ve
 * kullanıcı "sonraki ay" düğmesine basınca Şubat'ı atlardı. Çapa her zaman
 * ayın ilki; ay görünümünün gün bilgisine ihtiyacı yok.
 */
export function addMonths(anchor: IsoDate, delta: number): IsoDate | null {
  const parts = parseParts(anchor);
  if (parts === null) {
    return null;
  }

  // Aylar 0 tabanına indiriliyor ki taşma tek bir bölme ve çıkarmayla çözülsün.
  const zeroBased = parts.year * 12 + (parts.month - 1) + delta;
  const year = Math.floor(zeroBased / 12);
  const month = zeroBased - year * 12 + 1;

  return firstOfMonth(year, month);
}

/** Bir günün hücresini kurar. */
function buildDay(date: IsoDate, marks: PrayerMarkMap, today: IsoDate): ChartDay | null {
  const parts = parseParts(date);
  if (parts === null) {
    return null;
  }

  const distance = dayDifference(date, today);

  return {
    date,
    dayOfMonth: parts.day,
    isToday: date === today,
    // ⚠️ `distance === null` (bozuk "bugün") düzenlemeyi KAPATIR. Emin
    // olunamayan bir günde yazmaya izin vermektense yazmamak doğru.
    editable: distance !== null && distance >= 0,
    marks,
  };
}

/**
 * Bir hafta — **her zaman 7 gün**, Pazartesi'den Pazar'a.
 *
 * ⚠️ Uzunluk sabit ve bu bir arayüz sözleşmesi: ızgara satır sayısını veriden
 * öğrenmiyor. Bozuk bir tarih tek bir hücreyi `null` yapar, haftayı kısaltmaz.
 */
export function buildWeek(
  anchor: IsoDate,
  marksByDate: Record<IsoDate, PrayerMarkMap>,
  today: IsoDate,
): ChartCell[] {
  const start = startOfWeek(anchor);
  if (start === null) {
    return [];
  }

  const cells: ChartCell[] = [];
  for (let index = 0; index < 7; index += 1) {
    const date = addDays(start, index);
    cells.push(date === null ? null : buildDay(date, marksByDate[date] ?? {}, today));
  }

  return cells;
}

/**
 * Bir ay — **her zaman 42 hücre** (6×7), Pazartesi başlangıçlı.
 *
 * ⚠️ Sabit 42 hücre, değişken satır sayısı DEĞİL: bir ay 4, 5 ya da 6 satıra
 * sığabiliyor ve ızgaranın yüksekliği aylar arasında gezinirken zıplardı.
 *
 * ⚠️ **Ay dışı hücreler `null`.** Komşu ayın günlerini soluk çizmek de bir
 * seçenekti; elendi çünkü o günler dokunulabilir olsaydı kullanıcı görünmeyen
 * bir aya yazardı, olmasaydı da aynı görünen iki hücreden biri çalışıp diğeri
 * çalışmazdı.
 */
export function buildMonth(
  anchor: IsoDate,
  marksByDate: Record<IsoDate, PrayerMarkMap>,
  today: IsoDate,
): ChartCell[] {
  const range = monthRange(anchor);
  if (range === null) {
    return [];
  }

  const gridStart = startOfWeek(range.from);
  if (gridStart === null) {
    return [];
  }

  const cells: ChartCell[] = [];
  for (let index = 0; index < 42; index += 1) {
    const date = addDays(gridStart, index);

    // Metinsel karşılaştırma takvim sırasıyla aynı: `'YYYY-MM-DD'` sabit
    // genişlikte ve sıfır dolgulu (`activityDb`nin `ORDER BY date` kararı).
    if (date === null || date < range.from || date > range.to) {
      cells.push(null);
      continue;
    }

    cells.push(buildDay(date, marksByDate[date] ?? {}, today));
  }

  return cells;
}

/**
 * Özet — kaç vakit kılındı, kaç vakit kaza olarak işaretlendi.
 *
 * ⚠️ **Payda ÜRETİLMEZ.** "5 üzerinden 2" gibi bir oran, hiçbir suçlayıcı
 * kelime kullanmadan bir eksiklik bildirir; ekran sayar, hüküm vermez. Aynı
 * sebeple "işaretsiz" sayısı da döndürülmüyor — hesaplanabilir olması bile o
 * satırın bir gün ekrana çıkmasına davetiye olurdu.
 *
 * ⚠️ Yalnızca `CHART_PRAYERS` sayılıyor: diskte bir şekilde `gunes` kaydı
 * bulunsa bile (bugün yazan yol yok) özet onu görmez.
 */
export function summarize(cells: readonly ChartCell[]): ChartSummary {
  let kilindi = 0;
  let kaza = 0;

  for (const cell of cells) {
    if (cell === null) {
      continue;
    }

    for (const prayer of CHART_PRAYERS) {
      const status = cell.marks[prayer];
      if (status === 'kilindi') {
        kilindi += 1;
      } else if (status === 'kaza') {
        kaza += 1;
      }
    }
  }

  return { kilindi, kaza };
}

/** Çizelgede gösterilebilir bir tarih mi — dışarıdan gelen tarihi elemek için. */
export function isChartDate(value: IsoDate): boolean {
  return isValidIsoDate(value) && parseParts(value) !== null;
}
