/**
 * Ses anahtarı sözleşmesi — adlandırma, uzak adres ve önbellek dosya adı.
 *
 * Bu dosya **saf**: React, React Native ya da yerel modül import etmez.
 * `audio.ts`'in bütün karar mantığı bilinçle buraya itildi, çünkü `expo-audio`
 * ve `expo-file-system` yerel modüller ve Node test koşucusunda yüklenemezler.
 * Sınanabilir olan her şey burada yaşar.
 *
 * ── ADLANDIRMA DÜZENİ ───────────────────────────────────────────────────────
 *
 *     <ünite-slug>/<konu>-<nn>.m4a
 *
 *     temel-inanc/kelime-i-tevhid-01.m4a
 *     islamin-sartlari/ezan-01.m4a
 *
 * Kurallar:
 *
 * 1. **Tam olarak iki parça**: bir dizin katmanı + bir dosya adı. Daha derin
 *    yuvalama yok; `..` yazılamaz, dolayısıyla dizin dışına çıkan bir anahtar
 *    üretilemez.
 * 2. **Alfabe yalnız `a-z`, `0-9` ve `-`.** Parçalar harf/rakamla başlar ve
 *    biter, arka arkaya iki tire olmaz.
 * 3. **Türkçe harf YASAK** (`ç ğ ı ö ş ü` ve büyükleri). Sebep kozmetik değil:
 *    iOS'un dosya sistemi Unicode'u ayrıştırılmış (NFD) biçimde saklar, sunucu
 *    ise birleşik (NFC) yazar; `ş` taşıyan bir anahtar cihazda bir dosyaya,
 *    CDN'de başka bir dosyaya çözülür ve hata "bazen çalışıyor" diye görünür.
 * 4. **Büyük harf YASAK.** Çoğu CDN büyük-küçük harfe duyarlı, çoğu geliştirme
 *    makinesi (Windows, macOS) değil — fark ancak yayında ortaya çıkar.
 * 5. **Uzantı `.m4a`** (AAC). Tek biçim: iOS ve Android'de yerel destekli,
 *    konuşma kaydında MP3'ten küçük.
 * 6. ⚠️ **Yayınlanan bir anahtar bir daha DEĞİŞMEZ.** Anahtar aynı zamanda
 *    önbellek anahtarıdır; değişirse cihazlarda eski dosya asılı kalır. Kaydın
 *    yenisi çekildiyse numara artırılır (`-01` → `-02`), ad korunur.
 *
 * ── DOSYA KONULMUYOR ────────────────────────────────────────────────────────
 *
 * `/content` bugün altı anahtar taşıyor (`ornek/placeholder-01.m4a` …) ama
 * karşılığında hiç dosya yok ve `audioBaseUrl` boş. Bu bilinçli: mimari kural
 * 7 gereği ses pakete gömülmez, uzaktan gelir. Bugün sistem uçtan uca kurulu
 * ama tek bir ağ isteği yapmıyor; sorular yazılı yedekleriyle çalışıyor.
 */

/**
 * Bir parça: harf/rakamla başlar ve biter, aralarda tek tire.
 * `ornek`, `kelime-i-tevhid-01` geçer; `-x`, `x-`, `x--y` geçmez.
 */
const SEGMENT = '[a-z0-9]+(?:-[a-z0-9]+)*';

const KEY_PATTERN = new RegExp(`^${SEGMENT}/${SEGMENT}\.m4a$`);

/** Anahtar sözleşmeye uyuyor mu. */
export function isValidAudioKey(key: string): boolean {
  return KEY_PATTERN.test(key);
}

/**
 * Anahtarı indirilebilir adrese çevirir.
 *
 * Anahtar geçersizse ya da `baseUrl` boş/`http(s)` değilse **`null`** döner —
 * fırlatmaz. Çağıran yer sessizce sessiz kalmak zorunda (`ProgressBar`'ın
 * "bozuk girdi sessizce çalışır" doktrini).
 *
 * Sondaki `/` olsa da olmasa da tek birleşim üretilir; `//` oluşmaz.
 */
export function audioUrlFor(key: string, baseUrl: string): string | null {
  if (!isValidAudioKey(key)) {
    return null;
  }

  const base = baseUrl.trim().replace(/\/+$/, '');

  if (!/^https?:\/\/\S+$/.test(base)) {
    return null;
  }

  return `${base}/${key}`;
}

/**
 * Anahtarı önbellekteki düz dosya adına çevirir.
 *
 * `/` → `__` düzleştirmesi ara dizin açma derdini kaldırıyor: bütün sesler tek
 * klasörde durur. Anahtar alfabesinde `_` bulunmadığı için dönüşüm **birebir**,
 * yani iki farklı anahtar aynı dosyada buluşamaz.
 *
 * ⚠️ Geçersiz anahtarla çağrılmaz; çağrı yeri önce `isValidAudioKey` bakar.
 */
export function cacheFileNameFor(key: string): string {
  return key.replace(/\//g, '__');
}

/**
 * Yarım kalmış indirmenin geçici adı.
 *
 * ⚠️ İndirme doğrudan son ada yapılmaz. `expo-file-system` **Android'de**
 * yanıt gövdesini hedefe akıtıyor ve indirme ortasında koparsa **kısmi dosya
 * yerinde kalıyor** (iOS geçici konumda tamamlayıp taşıdığı için etkilenmez).
 * Kısmi dosya `exists` denetimini geçer, `expo-audio` onu sessizce çalamaz ve
 * durum **kalıcı** olur — önbellek zehirlenir. Çözüm: önce `.part`, boyut
 * denetiminden sonra son ada taşı.
 */
export function partFileNameFor(key: string): string {
  return `${cacheFileNameFor(key)}.part`;
}
