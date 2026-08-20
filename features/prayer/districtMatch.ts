/**
 * Ters coğrafi kodlamadan gelen yer ADLARINI Diyanet listesiyle eşler — saf.
 * `expo-location` bilmez; listeler ve aday adlar argüman olarak gelir.
 *
 * ⚠️ Bu bir "en yakın ilçe" hesabı DEĞİL, olamaz da: servis ilçe koordinatı
 * vermiyor (`/ilceler` yalnızca ad + kimlik döndürüyor), elimizde mesafe
 * hesaplayacak veri yok. Yapılan iş "cihazın bildirdiği ilçe adı listede var
 * mı" — ekran metinleri de bu yüzden "bulunduğun ilçe" der, "en yakın" demez.
 */

import { normalizeTr } from '@/lib/turkishText';

import type { DistrictMatch, PrayerCity, PrayerDistrict } from '@/types';

/**
 * Karşılaştırma için yer adını sadeleştirir.
 *
 * ⚠️ `normalizeTr` burada dekoratif değil, işin TAMAMI: Diyanet listesi büyük
 * harf (`"ISPARTA"`), Apple/Google başlık biçimi (`"Isparta"`) döndürüyor. Naif
 * `toLowerCase()` ile liste tarafı `"ısparta"`, cihaz tarafı `"isparta"` olur ve
 * eşleşme sessizce kaçar. `normalizeTr` tam bu çift için yazılmıştı.
 *
 * Noktalama sadeleştirmesi kesme işaretini de kapsıyor (`"Şehit'kamil"` gibi
 * yazımlar). ⚠️ Unicode özellik kaçışı (`\p{L}`) KULLANILMIYOR — Hermes'te
 * güvenilmez; açık karakter sınıfı yazıldı.
 */
export function normalizePlaceName(value: string): string {
  return normalizeTr(value.replace(/['\u2019\u00B4\-_./]/g, ' '));
}

/** Boşlukları da atarak karşılaştırma anahtarı — `"Şehit Kamil"` ↔ `"ŞEHİTKAMİL"`. */
function tightKey(value: string): string {
  return normalizePlaceName(value).replace(/ /g, '');
}

/**
 * Adaylardan tam olarak BİR kayda düşen eşleşmeyi döndürür.
 *
 * İki geçiş: önce normalize tam eşitlik, sonra boşluksuz karşılaştırma. Her
 * geçiş kendi içinde TEKİLLİK arar.
 *
 * ⚠️ **Birden fazla kayıt eşleşirse `null` döner, ilki seçilmez.** Yanlış ilçe
 * = yanlış vakit; bu modülün tek kabul edilemez hatası ve tahmin etmektense
 * kullanıcıya sormak her zaman doğru. Aynı sebeple bulanık/önek eşleşme yok.
 */
function matchUnique<T>(
  candidates: readonly string[],
  items: readonly T[],
  nameOf: (item: T) => string,
): T | null {
  const passes: ((value: string) => string)[] = [normalizePlaceName, tightKey];

  for (const key of passes) {
    for (const candidate of candidates) {
      const needle = key(candidate);
      if (needle === '') {
        continue;
      }

      const hits = items.filter((item) => key(nameOf(item)) === needle);
      if (hits.length === 1) {
        return hits[0];
      }
    }
  }

  return null;
}

export function matchCity(
  candidates: readonly string[],
  cities: readonly PrayerCity[],
): PrayerCity | null {
  return matchUnique(candidates, cities, (city) => city.name);
}

/**
 * ⚠️ **`MERKEZ` otomatik seçilmez.** Küçük illerde doğru olma ihtimali yüksek
 * ama garanti değil; bu fonksiyon yalnızca adayların söylediğini arar, listenin
 * içinden bir varsayılan uydurmaz.
 */
export function matchDistrict(
  candidates: readonly string[],
  districts: readonly PrayerDistrict[],
): PrayerDistrict | null {
  return matchUnique(candidates, districts, (district) => district.name);
}

export type MatchInput = {
  /** Cihazın bildirdiği ülke kodu (`reverseGeocodeAsync().isoCountryCode`). */
  countryCode: string | null;
  /** İl adayları — genelde `[region, city]`. */
  cityCandidates: readonly string[];
  /** İlçe adayları — genelde `[subregion, district, city, name]`. */
  districtCandidates: readonly string[];
  cities: readonly PrayerCity[];
  /** Eşleşen ilin ilçeleri. İl daha çözülmediyse boş liste. */
  districts: readonly PrayerDistrict[];
};

/**
 * Tam eşleme kararı.
 *
 * ⚠️ Türkiye dışı ERKEN çıkar ve eşleme hiç denenmez: v0.3 kapsamı yalnızca
 * Türkiye ve yabancı bir şehir adının Türkiye listesinde rastlantısal olarak
 * eşleşmesi (örneğin bir "Merkez") kullanıcıyı bambaşka bir ülkenin vakitlerine
 * bakarken bırakırdı.
 *
 * ⚠️ `'district'` sonucu bile OTOMATİK SEÇİM anlamına gelmez — çağıran onu
 * kullanıcıya onaya sunar.
 */
export function matchLocation(input: MatchInput): DistrictMatch {
  if (input.countryCode !== null && input.countryCode.toUpperCase() !== 'TR') {
    return { kind: 'outsideTurkey' };
  }

  const city = matchCity(input.cityCandidates, input.cities);
  if (city === null) {
    return { kind: 'none' };
  }

  const district = matchDistrict(input.districtCandidates, input.districts);
  if (district === null) {
    return { kind: 'city', city };
  }

  return { kind: 'district', city, district };
}
