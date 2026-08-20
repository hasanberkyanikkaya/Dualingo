/**
 * `expo-location` sarmalayıcısı — cihazdan yalnızca AD DİZGELERİ çıkarır.
 *
 * ⚠️ Bu dosya eşleme YAPMAZ. Eşleme `districtMatch.ts`te ve orası saf olduğu
 * için Türkçe büyük harf tuzağı ("ISPARTA" ↔ "Isparta") testle çivilenebiliyor.
 * `audioKey`/`audio` ve `dayLog`/`activityDb` ayrımının aynısı.
 *
 * ⚠️ **Konum ZORUNLU DEĞİL** (4.0 kararı). Bu dosyanın hiç çağrılmadığı bir yol
 * her zaman açık: kullanıcı ili ve ilçeyi elle seçebilir. İzin istemek yalnızca
 * bir kısayolun bedeli.
 *
 * ⚠️ **Bu "en yakın ilçe" DEĞİL.** Servis ilçe koordinatı vermiyor; yapılan iş
 * "cihazın bildirdiği ilçe adı listede var mı". Ekran metinleri de bu yüzden
 * "bulunduğun ilçe" der.
 *
 * ⚠️ **Gizlilik notu (belgelere yansıyacak):** `reverseGeocodeAsync` iOS'ta
 * koordinatı Apple'ın sunucusuna gönderir (CLGeocoder); Android'de Play
 * Services'in cihaz üstü `Geocoder`ını kullanır. Yani "konum cihazdan çıkmıyor"
 * denemez. Bizim sunucumuza gitmiyor ve cihazda saklanmıyor — saklanan tek şey
 * kullanıcının onayladığı ilçe kimliği.
 *
 * Test yazılamaz (yerel modül).
 */

/**
 * Konum sorgusunun sonucu.
 *
 * `denied` ile `unavailable` ayrı çünkü kullanıcıya söylenecek şey farklı:
 * biri "izin vermedin", diğeri "veremedim". `outsideTurkey` burada da var —
 * ülke kodu belliyse eşlemeye hiç gitmeye gerek yok.
 */
export type LocationLookup =
  | { kind: 'ok'; countryCode: string | null; cityCandidates: string[]; districtCandidates: string[] }
  | { kind: 'denied' }
  | { kind: 'unavailable' };

function pushName(target: string[], value: unknown): void {
  if (typeof value === 'string' && value.trim() !== '') {
    target.push(value.trim());
  }
}

/**
 * İzin ister, konumu alır, ters coğrafi kodlar ve aday adları döndürür.
 *
 * ⚠️ Doğruluk `Low`: ilçe çözünürlüğü için yeter ve GPS'i uyandırmaz — hem
 * hızlı hem pil dostu, hem de topladığımız konumu gereğinden hassas yapmamak
 * gizlilik açısından doğru olan.
 *
 * ⚠️ Aday SIRASI önemli ve platform farkını taşıyor: iOS `subregion`a ilçeyi
 * yazarken Android bazen `district`a, bazen hiçbirine yazmıyor. Sıra öncelik
 * demek; `districtMatch` ilk tutanı alıyor.
 *
 * Hiçbir yol fırlatmaz — konum servisi kapalı, izin reddi, kodlama boş dönmesi
 * hepsi birleşik tipe düşüyor.
 */
export async function lookupCurrentPlace(): Promise<LocationLookup> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Location = require('expo-location') as typeof import('expo-location');

    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      return { kind: 'denied' };
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Low,
    });

    const places = await Location.reverseGeocodeAsync({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    });

    const place = places[0];
    if (!place) {
      return { kind: 'unavailable' };
    }

    const cityCandidates: string[] = [];
    pushName(cityCandidates, place.region);
    pushName(cityCandidates, place.city);
    pushName(cityCandidates, place.subregion);

    const districtCandidates: string[] = [];
    pushName(districtCandidates, place.subregion);
    pushName(districtCandidates, place.district);
    pushName(districtCandidates, place.city);
    pushName(districtCandidates, place.name);

    if (cityCandidates.length === 0 && districtCandidates.length === 0) {
      return { kind: 'unavailable' };
    }

    return {
      kind: 'ok',
      countryCode: place.isoCountryCode ?? null,
      cityCandidates,
      districtCandidates,
    };
  } catch (error) {
    if (__DEV__) {
      console.warn('[prayer/location] Konum alınamadı — elle seçime düşülüyor.', error);
    }
    return { kind: 'unavailable' };
  }
}
