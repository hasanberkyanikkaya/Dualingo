import type {
  CityId,
  DistrictId,
  PrayerCity,
  PrayerDistrict,
  PrayerFetchOutcome,
} from '@/types';

/**
 * `ezanvakti.emushaf.net` istemcisi — bu servisin ADRESLERİNİ bilen TEK dosya.
 *
 * ⚠️ Sağlayıcı bilerek tek arayüzün arkasında (4.0 kararı): servis tek kişilik
 * gönüllü bir proje, yazılı kullanım şartı yok ve kapanabilir. Değişim günü
 * dokunulacak dosya burasıdır; ayrıştırma `prayerParse.ts`te, karar
 * `prayerCache.ts`te, ikisi de sağlayıcıdan bağımsız.
 *
 * ⚠️ **Hiçbir fonksiyon FIRLATMAZ.** Her yol `PrayerFetchOutcome`a düşüyor
 * (`features/learning/audio.ts` disiplini): ağ hatası bir uygulama çökmesi
 * değil, bir ekran durumudur.
 *
 * Test yazılamaz — ağ ve `fetch` Node koşucusunda anlamlı biçimde
 * kurgulanamıyor. Sınanabilir olan her şey saf modüllere itildi.
 */

const BASE_URL = 'https://ezanvakti.emushaf.net';

/** Türkiye'nin ülke kimliği. Servis bunu DİZGE döndürüyor (4.0 ölçümü). */
export const TURKEY_COUNTRY_ID = '2';

/**
 * İstek zaman aşımı.
 *
 * Bırakma kararı arayüze ait olmalıydı ama burada duruyor çünkü `AbortController`
 * isteğin kendisine bağlı. Sekiz saniye: mirror Diyanet'i proxy'liyor ve yavaş
 * bir yanıt normal; kullanıcı zaten önbellekteki vakitlere bakıyor olacak.
 */
const TIMEOUT_MS = 8_000;

/**
 * Oturum boyu liste önbelleği.
 *
 * ⚠️ Şehir/ilçe listeleri SQLite'a YAZILMIYOR ve bu bilinçli: bunlar kullanıcı
 * verisi değil, üçüncü tarafın kataloğu. Tabloya koymak onlara `updated_at` /
 * `deleted_at` ve dolayısıyla Faz 7'de senkronizasyon semantiği vermek olurdu —
 * bir mirror'ın şehir listesini buluta senkronlamak anlamsız.
 *
 * Kabul edilen sonuç: ilk açılışta ağ yoksa ilçe seçilemez ve ekran dürüst boş
 * durumu gösterir.
 */
const listCache = new Map<string, unknown>();

/**
 * Uçuştaki istekler.
 *
 * ⚠️ Tekilleştirme olmasa iki bileşen aynı anda monte olduğunda aynı liste iki
 * kez indirilirdi. `audio.ts`in aynı deseni.
 */
const inFlight = new Map<string, Promise<PrayerFetchOutcome<unknown>>>();

/**
 * Ham GET.
 *
 * Durum eşlemesi 4.0'da belgelenen sözleşmeye göre:
 * `422` geçersiz parametre (tekrar denemek anlamsız), `502` mirror Diyanet'e
 * ulaşamıyor (beklenen ve geçici). Diğer her şey `offline` sayılıyor — ayrı bir
 * "sunucu hatası" durumu kullanıcıya farklı bir şey söylemezdi.
 */
async function request(path: string): Promise<PrayerFetchOutcome<unknown>> {
  const cached = listCache.get(path);
  if (cached !== undefined) {
    return { kind: 'ok', data: cached };
  }

  const pending = inFlight.get(path);
  if (pending !== undefined) {
    return pending;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, TIMEOUT_MS);

  const task = (async (): Promise<PrayerFetchOutcome<unknown>> => {
    try {
      const response = await fetch(`${BASE_URL}${path}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      if (response.status === 422) {
        return { kind: 'invalid' };
      }

      if (response.status === 502) {
        return { kind: 'upstream' };
      }

      if (!response.ok) {
        return { kind: 'offline' };
      }

      return { kind: 'ok', data: (await response.json()) as unknown };
    } catch {
      // Zaman aşımı da ağ hatası da buraya düşüyor; kullanıcı açısından ikisi
      // aynı şey: şu an veri gelmiyor.
      return { kind: 'offline' };
    } finally {
      clearTimeout(timer);
      inFlight.delete(path);
    }
  })();

  inFlight.set(path, task);
  return task;
}

function readString(source: Record<string, unknown>, key: string): string | null {
  const value = source[key];

  if (typeof value === 'string' && value.trim() !== '') {
    return value.trim();
  }

  // ⚠️ Servis kimlikleri dizge döndürüyor ama sayı dönen bir sürüm gelirse
  // liste sessizce boşalmasın.
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

function mapList<T>(payload: unknown, map: (item: Record<string, unknown>) => T | null): T[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  const result: T[] = [];

  for (const item of payload) {
    if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
      const mapped = map(item as Record<string, unknown>);
      if (mapped !== null) {
        result.push(mapped);
      }
    }
  }

  return result;
}

/**
 * Türkiye'nin illeri.
 *
 * ⚠️ `/ulkeler` HİÇ çağrılmıyor: kapsam v0.3'te yalnızca Türkiye ve ülke
 * kimliği (`"2"`) 4.0'da ölçüldü. Ülke adımı eklemek ileride bir satır.
 */
export async function fetchCities(): Promise<PrayerFetchOutcome<PrayerCity[]>> {
  const path = `/sehirler/${TURKEY_COUNTRY_ID}`;
  const outcome = await request(path);

  if (outcome.kind !== 'ok') {
    return outcome;
  }

  const cities = mapList<PrayerCity>(outcome.data, (item) => {
    const cityId = readString(item, 'SehirID');
    const name = readString(item, 'SehirAdi');
    return cityId !== null && name !== null ? { cityId, name } : null;
  });

  if (cities.length > 0) {
    listCache.set(path, outcome.data);
  }

  return { kind: 'ok', data: cities };
}

/** Bir ilin ilçeleri. */
export async function fetchDistricts(
  cityId: CityId,
): Promise<PrayerFetchOutcome<PrayerDistrict[]>> {
  const path = `/ilceler/${encodeURIComponent(cityId)}`;
  const outcome = await request(path);

  if (outcome.kind !== 'ok') {
    return outcome;
  }

  const districts = mapList<PrayerDistrict>(outcome.data, (item) => {
    const districtId = readString(item, 'IlceID');
    const name = readString(item, 'IlceAdi');
    return districtId !== null && name !== null ? { districtId, name } : null;
  });

  if (districts.length > 0) {
    listCache.set(path, outcome.data);
  }

  return { kind: 'ok', data: districts };
}

/**
 * Bir ilçenin vakit penceresi — HAM yük döner, ayrıştırılmış değil.
 *
 * ⚠️ Ayrıştırma bilerek burada YAPILMIYOR: `parseTimetable` saf ve testli, bu
 * dosya test edilemez. Sınır tam olarak burada duruyor.
 *
 * ⚠️ Vakit yanıtı `listCache`e KONMUYOR — pencere zamanla bayatlıyor ve
 * kalıcılık zaten SQLite'ın işi. Listeler değişmez, vakitler değişir.
 */
export async function fetchTimetable(
  districtId: DistrictId,
): Promise<PrayerFetchOutcome<unknown>> {
  return request(`/vakitler/${encodeURIComponent(districtId)}`);
}
