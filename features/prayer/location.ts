/**
 * `expo-location` sarmalayıcısı — projenin bu yerel modüle açılan TEK kapısı.
 *
 * İki tüketicisi var ve ikisi cihazdan farklı şeyler çıkarıyor:
 *  - `lookupCurrentPlace` (Faz 4.1) → yalnızca AD DİZGELERİ (il/ilçe adayları).
 *  - `lookupCoordinates` + `watchHeading` (Faz 4.5) → KOORDİNAT ve YÖN.
 *
 * ⚠️ Bu dosya eşleme YAPMAZ, açı da HESAPLAMAZ. Eşleme `districtMatch.ts`te,
 * kıble matematiği `qibla.ts`te ve ikisi de saf olduğu için testle çivilenebiliyor
 * (Türkçe büyük harf tuzağı "ISPARTA" ↔ "Isparta"; 360/0 dikişi).
 * `audioKey`/`audio` ve `dayLog`/`activityDb` ayrımının aynısı.
 *
 * ⚠️ **Konum ZORUNLU DEĞİL** (4.0 kararı). Namaz vakitleri için bu dosyanın hiç
 * çağrılmadığı bir yol her zaman açık: kullanıcı ili ve ilçeyi elle seçebilir.
 * İzin istemek yalnızca bir kısayolun bedeli. Kıble ekranı bunun tek istisnası
 * ve olmak zorunda — açı koordinat olmadan hesaplanamaz; oradaki karşılığı izin
 * verilmediğinde dürüst bir boş durum göstermek.
 *
 * ⚠️ **Bu "en yakın ilçe" DEĞİL.** Servis ilçe koordinatı vermiyor; yapılan iş
 * "cihazın bildirdiği ilçe adı listede var mı". Ekran metinleri de bu yüzden
 * "bulunduğun ilçe" der.
 *
 * ⚠️ **Gizlilik notu (belgelere yansıyacak) — iki yol AYRI:**
 *  - `lookupCurrentPlace` `reverseGeocodeAsync` çağırır ve o, iOS'ta koordinatı
 *    Apple'ın sunucusuna gönderir (CLGeocoder); Android'de Play Services'in
 *    cihaz üstü `Geocoder`ını kullanır. Yani "konum cihazdan çıkmıyor" denemez.
 *  - `lookupCoordinates` ters kodlamayı **HİÇ ÇAĞIRMAZ**. Koordinat yalnızca
 *    belleğe çıkar, hiçbir sunucuya gitmez, **diske yazılmaz** ve ekran
 *    kapanınca kaybolur. Bu yüzden Faz 4.5 gizlilik politikasını ve veri
 *    güvenliği formunu DEĞİŞTİRMEDİ; değiştirecek olan şey koordinatın
 *    kalıcılaştırılmasıydı ve o bilinçle yapılmadı.
 *
 * Bizim sunucumuza hiçbir yoldan konum gitmiyor — saklanan tek şey kullanıcının
 * onayladığı ilçe kimliği.
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
import type { Coordinates } from '@/features/prayer/qibla';

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

/**
 * Ham koordinat sorgusunun sonucu.
 *
 * `LocationLookup`ten ayrı bir tip çünkü taşıdığı şey farklı: orada ad
 * adayları var, burada tek bir nokta. Ayrımın adları (`denied`/`unavailable`)
 * bilerek aynı — kullanıcıya söylenecek şey de aynı.
 */
export type CoordinateLookup =
  | { kind: 'ok'; coordinates: Coordinates }
  | { kind: 'denied' }
  | { kind: 'unavailable' };

/**
 * İzin ister ve cihazın konumunu HAM koordinat olarak döndürür (Faz 4.5).
 *
 * ⚠️ **Ters coğrafi kodlama YOK.** `lookupCurrentPlace`in aksine bu yol hiçbir
 * sunucuya bir şey göndermiyor; koordinat çağırana döner ve orada bellekte
 * kalır. Dosya başlığındaki gizlilik notunun ikinci maddesi bu.
 *
 * ⚠️ **Doğruluk `Balanced`, `Low` DEĞİL.** İlçe ADI çözmek için `Low` (~1–3 km)
 * yeter; kıble AÇISI için sınırda kalır. `Balanced` (~100 m) hem fazlasıyla
 * yeterli hem GPS'i tam güce çıkarmıyor. Daha hassasını istemek burada
 * gereksiz bir gizlilik ve pil bedeli olurdu.
 *
 * Hiçbir yol fırlatmaz — izin reddi, konum servisi kapalı, zaman aşımı hepsi
 * birleşik tipe düşüyor (`lookupCurrentPlace`in disiplini).
 */
export async function lookupCoordinates(): Promise<CoordinateLookup> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Location = require('expo-location') as typeof import('expo-location');

    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      return { kind: 'denied' };
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const { latitude, longitude } = position.coords;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return { kind: 'unavailable' };
    }

    return { kind: 'ok', coordinates: { latitude, longitude } };
  } catch (error) {
    if (__DEV__) {
      console.warn('[prayer/location] Koordinat alınamadı.', error);
    }
    return { kind: 'unavailable' };
  }
}

/** Pusula aboneliğini kapatan fonksiyon. Çağrılmazsa sensör pil yakmaya devam eder. */
export type HeadingUnsubscribe = () => void;

/**
 * Cihazın pusula yönünü dinler (Faz 4.5).
 *
 * ⚠️ **`expo-sensors` manyetometresi KULLANILMIYOR ve bu ölçülmüş bir karar.**
 * Ham manyetometre MANYETİK kuzeyi verir; kıble açısı (`qibla.ts`) GERÇEK
 * kuzeye göre hesaplanır ve Türkiye'de ikisi ~5–6° ayrışır. Düzeltmek bir dünya
 * manyetik modeli (WMM) tablosu gerektirir — bu projeye girmez.
 * `watchHeadingAsync` `trueHeading`i işletim sisteminden hazır alır, üstüne
 * `accuracy` ile kalibrasyon durumunu verir (tahmin değil) ve cihaz yönelimini
 * kendisi çözer. Yan kazanç: yeni bağımlılık yok, `expo-location` zaten kurulu.
 *
 * ⚠️ **`trueHeading` NEGATİF gelebilir.** iOS henüz gerçek kuzeyi
 * çözemediğinde (konum yok ya da pusula kalibre değil) bu alan `-1` döner.
 * O değeri olduğu gibi kullanmak kadranı yanlış yere kilitler; manyetik yöne
 * düşmek eksik ama dürüst bir cevap ve kalibrasyon uyarısı zaten çıkıyor.
 *
 * Fırlatmaz: sensör yoksa ya da abonelik kurulamazsa hiçbir şey yapmayan bir
 * iptal fonksiyonu döner ve ekran "yön alınamadı" durumunda kalır.
 */
export async function watchHeading(
  onHeading: (degrees: number, accuracy: number | null) => void,
): Promise<HeadingUnsubscribe> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Location = require('expo-location') as typeof import('expo-location');

    const subscription = await Location.watchHeadingAsync((reading) => {
      const trueHeading = reading.trueHeading;
      const degrees = Number.isFinite(trueHeading) && trueHeading >= 0 ? trueHeading : reading.magHeading;

      if (!Number.isFinite(degrees)) {
        return;
      }

      onHeading(degrees, Number.isFinite(reading.accuracy) ? reading.accuracy : null);
    });

    return () => {
      subscription.remove();
    };
  } catch (error) {
    if (__DEV__) {
      console.warn('[prayer/location] Pusula dinlenemedi.', error);
    }
    return () => {};
  }
}
