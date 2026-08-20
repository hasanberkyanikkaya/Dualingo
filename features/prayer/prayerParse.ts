/**
 * Ham servis yanıtı → tipli satır. Saf: React yok, `expo-*` yok, ağ yok, DB yok.
 *
 * Bu dosya `ezanvakti.emushaf.net`in ALAN ADLARINI bilen iki yerden biridir
 * (diğeri `prayerApi.ts`, o da yalnızca adresleri bilir). Sağlayıcı değişirse
 * değişecek dosya burasıdır — 4.0'ın "sağlayıcı tek arayüzün arkasında" kararı.
 *
 * Hiçbir fonksiyon fırlatmaz. Bozuk kayıt uygulamayı düşürmez; `null` ya da
 * kısaltılmış liste döner (`features/learning/answerEngine.ts` disiplini).
 */

import type { DistrictId, IsoDate, PrayerTimes, Timestamp } from '@/types';

/** `"15.08.2026"` → `[15, 8, 2026]`; tek haneli gün/ay da kabul (`"1.3.2026"`). */
const DOTTED_DATE = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;

/** `"04:29"` ve `"4:29"`. Saniye taşıyan biçim gelmiyor, kabul de edilmiyor. */
const CLOCK = /^(\d{1,2}):(\d{2})$/;

function pad(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

/**
 * Servisin noktalı tarihini projenin yerel tarih kuralına çevirir.
 *
 * ⚠️ **Bu fonksiyonun girdisi `MiladiTarihKisaIso8601` alanıdır ama içeriği ISO
 * DEĞİLDİR.** Alan adı yanıltıcı (4.0'da ölçüldü): değeri `"15.08.2026"`.
 * Adına aldanıp değeri doğrudan `IsoDate` sanmak sessiz bir hatadır — bu yüzden
 * ISO görünümlü girdi bilerek `null` döner, sessizce geçmez.
 *
 * Takvim doğrulaması yapılmaz, biçim doğrulaması yapılır (`streak.parseIsoDate`
 * ile aynı tercih): 31.02 geçer ama servis öyle bir tarih göndermiyor.
 */
export function parseDottedDate(value: unknown): IsoDate | null {
  if (typeof value !== 'string') {
    return null;
  }

  const match = DOTTED_DATE.exec(value.trim());
  if (match === null) {
    return null;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  if (day < 1 || day > 31 || month < 1 || month > 12) {
    return null;
  }

  return `${year}-${pad(month)}-${pad(day)}`;
}

/** `"4:29"` → `"04:29"`. Aralık dışı (`"25:00"`, `"12:60"`) → `null`. */
export function parseClockTime(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const match = CLOCK.exec(value.trim());
  if (match === null) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) {
    return null;
  }

  return `${pad(hours)}:${pad(minutes)}`;
}

function readString(source: Record<string, unknown>, key: string): string | null {
  const value = source[key];
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

/**
 * Tek ham kayıt → satır.
 *
 * ⚠️ **Kısmi satır YAZILMAZ.** Tarih ya da altı vakitten biri okunamıyorsa
 * `null` döner. Gerekçe: yarım bir satır diske girse `findNextPrayer` onu
 * "bugünün verisi var" sayar, eksik vakti atlar ve kullanıcı bir vakti hiç
 * görmez — boş durumdan çok daha kötü bir hata.
 *
 * `kibleSaati` ve `hicriShort` eksikse satır GEÇERLİ kalır; ikisi de bugünkü
 * ekranın çalışması için gerekli değil.
 */
export function toPrayerTimes(
  raw: unknown,
  districtId: DistrictId,
  updatedAt: Timestamp,
): PrayerTimes | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return null;
  }

  const source = raw as Record<string, unknown>;

  const date = parseDottedDate(source.MiladiTarihKisaIso8601) ?? parseDottedDate(source.MiladiTarihKisa);
  if (date === null) {
    return null;
  }

  const imsak = parseClockTime(source.Imsak);
  const gunes = parseClockTime(source.Gunes);
  const ogle = parseClockTime(source.Ogle);
  const ikindi = parseClockTime(source.Ikindi);
  const aksam = parseClockTime(source.Aksam);
  const yatsi = parseClockTime(source.Yatsi);

  if (
    imsak === null ||
    gunes === null ||
    ogle === null ||
    ikindi === null ||
    aksam === null ||
    yatsi === null
  ) {
    return null;
  }

  return {
    districtId,
    date,
    imsak,
    gunes,
    ogle,
    ikindi,
    aksam,
    yatsi,
    kibleSaati: parseClockTime(source.KibleSaati),
    hicriShort: readString(source, 'HicriTarihKisa'),
    updatedAt,
    deletedAt: null,
  };
}

/**
 * Bir aylık pencere → satır listesi.
 *
 * ⚠️ **Geçmiş günler DÜŞÜRÜLMEZ.** Servisin penceresi bugünden başlamıyor ve
 * yanıt geçmiş günler içeriyor (4.0 ölçümü). Onları burada atmak `latestDate`i
 * bozmaz ama "pencere ilerledi mi" sorusunu cevaplayan tek veriyi zayıflatır;
 * ayrıca geçmiş çizelge Faz 4.2'nin işine yarayacak. Süzme okuma tarafında.
 *
 * Aynı tarih iki kez gelirse SON kayıt kazanır — mirror'ın düzelttiği bir
 * satırı eskisiyle ezmemek için.
 */
export function parseTimetable(
  payload: unknown,
  districtId: DistrictId,
  updatedAt: Timestamp,
): PrayerTimes[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  const byDate = new Map<IsoDate, PrayerTimes>();

  for (const raw of payload) {
    const row = toPrayerTimes(raw, districtId, updatedAt);
    if (row !== null) {
      byDate.set(row.date, row);
    }
  }

  return [...byDate.values()].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/**
 * Penceredeki en son tarih — yenileme kararının TEK girdisi.
 *
 * ⚠️ `rows[rows.length - 1]` DEĞİL: bu fonksiyon sıralanmamış listeye de doğru
 * cevap vermeli, çünkü çağıranın sıralamayı yaptığına güvenmek sessiz bir
 * bağımlılık olurdu. ⚠️ Ayrıca kayıt SAYISI ölçüt değildir — 4.0'da aynı ilçe
 * 15 dakika arayla 34 ve 32 kayıt döndürdü.
 */
export function latestDate(rows: readonly PrayerTimes[]): IsoDate | null {
  let latest: IsoDate | null = null;

  for (const row of rows) {
    if (latest === null || row.date > latest) {
      latest = row.date;
    }
  }

  return latest;
}
