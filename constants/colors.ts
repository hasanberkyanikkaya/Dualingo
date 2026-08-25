/**
 * Renk paleti — "Aksolotl"
 *
 * Palet maskottan türetildi. Maskotun kendi renkleri ölçülerek alındı:
 * gövde `#FFE1EC`, karın `#FFF5F8`, solungaç/yanak `#FF8FBF`, kontur `#3A2B33`.
 * Bu dördü palette aynen duruyor; geri kalan basamaklar bunların etrafına
 * kuruldu. Metin rengi maskotun çizgi rengiyle aynı — kimliği bir arada tutan
 * şey bu.
 *
 * İki katman var:
 *   1. palette — ham renk basamakları. Bileşenlerde DOĞRUDAN kullanılmaz.
 *   2. lightTheme / darkTheme — anlamsal (semantic) jetonlar. Bileşenler bunları okur.
 *
 * Kontrast notu: metin taşıyan her dolgu rengi, üzerindeki `on*` rengiyle
 * WCAG AA (4.5:1) sağlar. ⚠️ Pembe açık bir hüe — canlı pembe beyaz metin
 * TAŞIYAMAZ (`rose400` üzerine beyaz 2.11:1). Bu yüzden buton dolgusu koyu
 * gül `rose600`; maskotun canlı pembesi `rose400` yalnızca grafik, ikon ve
 * seviye düğümü içindir (`primaryBright`) — üzerine küçük metin konmaz.
 *
 * ⚠️ `primaryBright` İLERLEME ÇUBUĞUNDA KULLANILMAZ (bu not eskiden tersini
 * söylüyordu). Çubuğun yolu `border` ile arasında açık temada 1.81:1 var;
 * WCAG 1.4.11 metin taşımayan parçalar için 3:1 istiyor ve dolu/boş sınırı
 * ilerlemeyi anlatan tek şey. Çubuk dolguları bu yüzden koyu: `primary`,
 * `secondaryStrong`, `success`.
 *
 * ⚠️ GÖLGE SINIR ÇİZEMEZ. Açık temada `background === surface === #FFFFFF`,
 * yani bir kart zeminden kendi dolgusuyla ayrılamıyor ve akla ilk gelen çözüm
 * gölge oluyor. Ölçüldü: `elevation.card` (`shadowOpacity: 0.08`,
 * `shadowColor: neutral900`) beyaz üzerinde üretebileceği EN KOYU piksel
 * `#EFEEEF`, yani **1.16:1** — üstelik bu, bulanıklık yayılmadan önceki tavan.
 * Dokunulabilir bir öğenin sınırı bu yüzden `borderControl` ile çizilir.
 * Gölge yalnızca derinlik hissi içindir, bilgi taşımaz.
 */

// ── Ham palet ────────────────────────────────────────────────────────────────

export const palette = {
  // Gül — birincil marka rengi. 50/100/400 doğrudan maskottan alındı.
  rose50: '#FFF5F8', // maskotun karnı
  rose100: '#FFE1EC', // maskotun gövdesi
  rose200: '#FFC7DE',
  rose300: '#FFB6D5',
  rose400: '#FF8FBF', // maskotun solungaçları — grafik/ilerleme, metin taşımaz
  rose500: '#F2609F',
  rose600: '#C9306F', // metin taşıyabilen en açık dolgu tonu (beyazla 5.08:1)
  rose700: '#A82459',
  rose800: '#5E1638',
  rose900: '#3A0C21',

  // Mercan — uygulamanın üst çubuğu (tavan). ÖrnekResim.jpeg'ten ölçüldü.
  // ⚠️ Bu, gül skalasından FARKLI bir hüe: gülde mavi yeşilden yüksek
  // (magentaya çalar), mercanda ikisi eşit (kırmızıya çalar). Yani palette
  // artık iki ayrı pembe var. Bilinçli — referans görüntü bu rengi istiyor.
  coral300: '#FEA3A2', // tavan, açık tema
  coral800: '#4A2321', // tavan, koyu tema

  // Güneş — ikincil, ödül ve vurgu. Üzerine koyu metin gelir.
  sun50: '#FFF6DF',
  sun100: '#FFEDBF',
  sun200: '#FFE096',
  sun300: '#FFD26B',
  sun400: '#FFC53D', // bal sarısı — rozet, XP, yıldız
  sun500: '#E0A315',
  sun600: '#AE7C0C',
  sun700: '#7A5608',
  sun800: '#4A3208',
  sun900: '#3A2705',

  // Yeşil — başarı geri bildirimi. Marka renginden uzak durur ki
  // "doğru cevap" ile "birincil eylem" karışmasın.
  green100: '#DFF5EC',
  green400: '#4BD79B',
  green500: '#22B27B',
  green600: '#12855C',
  green800: '#0E3A28',
  green900: '#052015',

  // Bahçe sahnesi — yalnızca grafik yüzeylerinde kullanılır, metin taşımaz.
  sky100: '#DDF4FF',
  sky800: '#173447',
  earth300: '#C98D5B',
  earth700: '#6B3F24',

  // Kırmızı — hata. Pembeye çok yaklaşmaması için turuncuya çalar.
  red100: '#FDE7EB',
  red400: '#FF7085',
  red500: '#EF4560',
  red600: '#D62F4B',
  red800: '#3E1620',
  red900: '#2A0710',

  // Erik nötrler — maskotun kontur rengi (#3A2B33) etrafında kurulmuş,
  // hafif pembeye çalan gri skalası. Soğuk gri pembeyle yan yana kirli durur.
  neutral0: '#FFFFFF',
  neutral50: '#FFF7FA',
  neutral100: '#FFF0F5',
  neutral150: '#FAE8EF',
  neutral200: '#F2DFE7',
  neutral300: '#E3CBD6',
  neutral400: '#B7A6AE',
  neutral500: '#94818B',
  neutral600: '#7A6670',
  neutral700: '#5C4952',
  neutral750: '#4A3841',
  neutral800: '#30222B',
  neutral850: '#241A21',
  neutral900: '#3A2B33', // maskotun kontur rengi — gövde metni
  neutral950: '#1A1218',
} as const;

// ── Jeton tipleri ────────────────────────────────────────────────────────────

/** Gölge jetonu — React Native `ViewStyle` gölge alanlarıyla uyumlu. */
export type ElevationToken = {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  /** Android karşılığı */
  elevation: number;
};

export type ColorTheme = {
  /** Ekran zemini */
  background: string;
  /**
   * Üst çubuk (tavan) zemini — durum çubuğu alanı dahil.
   * Ekranın kendi zemininden ayrı bir renk; uygulamanın kimliğini taşıyan şerit.
   */
  appBar: string;
  /** Üst çubuğun üzerine gelen içerik rengi (ikon, başlık) */
  onAppBar: string;
  /** Kart, sayfa üstü yüzey */
  surface: string;
  /** İkincil yüzey — girdi alanı, pasif sekme */
  surfaceAlt: string;
  /** Modal arkası karartma */
  overlay: string;

  primary: string;
  primaryPressed: string;
  /** Açık tonlu zemin — rozet, seçili seçenek arkası */
  primarySoft: string;
  onPrimary: string;
  /**
   * Maskotun canlı pembesi — ikon, illüstrasyon, seviye düğümü. Metin taşımaz.
   * İlerleme çubuğunun dolgusu DEĞİLDİR; bkz. dosya başındaki uyarı.
   */
  primaryBright: string;

  secondary: string;
  secondaryPressed: string;
  secondarySoft: string;
  onSecondary: string;
  /**
   * Metin taşımayan güçlü ikincil dolgu — ilerleme çubuğunun altın varyantı.
   *
   * `secondary` (sun400) burada kullanılamaz: açık temada ilerleme çubuğunun
   * yolu olan `border` ile arasında yalnızca 1.35:1 var, dolu kısım boş
   * kısımdan ayırt edilemiyor. Bu jeton aynı sarının okunabilir basamağı.
   */
  secondaryStrong: string;

  success: string;
  successSoft: string;
  onSuccess: string;

  /** Cennet Bahçesi'nin metin taşımayan sahne renkleri. */
  gardenSky: string;
  gardenGround: string;
  gardenSoil: string;
  gardenTrunk: string;
  gardenFlower: string;

  error: string;
  errorSoft: string;
  onError: string;

  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  /** Koyu zemin üzerindeki metin */
  textInverse: string;
  textDisabled: string;

  border: string;
  borderStrong: string;
  /**
   * Dokunulabilir bir öğenin SINIRINI çizen kenarlık — seçenek kartı, girdi
   * alanı, kart. Zemine karşı 3:1 sağlar (WCAG 1.4.11).
   *
   * ⚠️ `borderStrong` bu iş için YETMEZ: beyaz zemine karşı 1.52:1. Gölge de
   * yetmez — bkz. dosya başındaki uyarı. Ayrıntı ve neden `borderStrong`
   * koyulaştırılamadığı: CLAUDE.md "Soru bileşenleri kararları".
   */
  borderControl: string;
  focusRing: string;

  disabledBackground: string;
  disabledText: string;

  elevation: {
    none: ElevationToken;
    card: ElevationToken;
    raised: ElevationToken;
    modal: ElevationToken;
  };
};

export type ThemeName = 'light' | 'dark';

// ── Gölgeler ─────────────────────────────────────────────────────────────────

const noElevation: ElevationToken = {
  shadowColor: 'transparent',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0,
  shadowRadius: 0,
  elevation: 0,
};

// Gölge rengi nötr siyah değil koyu erik — pembe yüzeylerin altında gri gölge
// isli durur, erik gölge rengin içinden çıkmış gibi oturur.
const lightElevation: ColorTheme['elevation'] = {
  none: noElevation,
  card: {
    shadowColor: palette.neutral900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  raised: {
    shadowColor: palette.neutral900,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  modal: {
    shadowColor: palette.neutral900,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
};

// Koyu temada gölge zayıf okunur; derinlik ağırlıklı olarak yüzey renkleriyle
// verilir, gölge sadece hafif bir ayrım için durur.
const darkElevation: ColorTheme['elevation'] = {
  none: noElevation,
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 2,
  },
  raised: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 6,
  },
  modal: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 24,
    elevation: 12,
  },
};

// ── Temalar ──────────────────────────────────────────────────────────────────

export const lightTheme: ColorTheme = {
  // Saf beyaz. Eskiden `neutral50` (#FFF7FA) idi; referans görüntüdeki gibi
  // pembe tavanın altındaki alan tamamen beyaz olsun diye değiştirildi.
  // ⚠️ Sonuç: `background` ile `surface` açık temada AYNI renk. Kart bileşeni
  // zeminden kendi rengiyle ayrışamaz, kenarlık veya gölge taşımak zorunda.
  background: palette.neutral0,
  // Tavan üzerine koyu erik metin: 7.00:1
  appBar: palette.coral300,
  onAppBar: palette.neutral900,
  surface: palette.neutral0,
  surfaceAlt: palette.neutral100,
  overlay: 'rgba(58, 43, 51, 0.45)',

  primary: palette.rose600,
  primaryPressed: palette.rose700,
  primarySoft: palette.rose100,
  onPrimary: palette.neutral0,
  primaryBright: palette.rose400,

  secondary: palette.sun400,
  secondaryPressed: palette.sun500,
  secondarySoft: palette.sun50,
  onSecondary: palette.sun800,
  // Açık temada altın, yola (#F2DFE7) karşı 3.15:1 — sun400 ve sun500
  // sınırın altında kalıyor (1.35:1 ve 1.91:1).
  secondaryStrong: palette.sun600,

  success: palette.green600,
  successSoft: palette.green100,
  onSuccess: palette.neutral0,
  gardenSky: palette.sky100,
  gardenGround: palette.green100,
  gardenSoil: palette.earth300,
  gardenTrunk: palette.earth700,
  gardenFlower: palette.rose400,

  error: palette.red600,
  errorSoft: palette.red100,
  onError: palette.neutral0,

  textPrimary: palette.neutral900,
  textSecondary: palette.neutral700,
  textMuted: palette.neutral600,
  textInverse: palette.neutral50,
  textDisabled: palette.neutral400,

  border: palette.neutral200,
  borderStrong: palette.neutral300,
  // Beyaz zemine karşı 3.64:1. Bir basamak koyusu (neutral600, 5.30:1) kart
  // değil sert bir form çerçevesi gibi okunuyordu.
  borderControl: palette.neutral500,
  focusRing: palette.rose600,

  disabledBackground: palette.neutral150,
  disabledText: palette.neutral400,

  elevation: lightElevation,
};

export const darkTheme: ColorTheme = {
  background: palette.neutral950,
  // Koyu temada somon tavan parlar; aynı hüenin koyu basamağı kullanılıyor.
  // Üzerine açık metin: 11.81:1
  appBar: palette.coral800,
  onAppBar: '#F7EDF2',
  surface: palette.neutral850,
  surfaceAlt: palette.neutral800,
  overlay: 'rgba(0, 0, 0, 0.6)',

  // Koyu zeminde açık pembe dolgu + koyu metin okunur; tersi değil.
  primary: '#FF9FC9',
  primaryPressed: '#FFC1DC',
  primarySoft: palette.rose800,
  onPrimary: palette.rose900,
  primaryBright: palette.rose400,

  secondary: palette.sun400,
  secondaryPressed: palette.sun500,
  secondarySoft: palette.sun800,
  onSecondary: palette.sun900,
  // Koyu temada yol koyu (#3A2B33); bal sarısı orada 8.46:1 veriyor,
  // koyulaştırmaya gerek yok — canlı sarı olduğu gibi kalır.
  secondaryStrong: palette.sun400,

  success: palette.green400,
  successSoft: palette.green800,
  onSuccess: palette.green900,
  gardenSky: palette.sky800,
  gardenGround: palette.green800,
  gardenSoil: palette.earth700,
  gardenTrunk: palette.earth300,
  gardenFlower: palette.rose400,

  error: palette.red400,
  errorSoft: palette.red800,
  onError: palette.red900,

  textPrimary: '#F7EDF2',
  textSecondary: '#D4C3CC',
  textMuted: '#A08F99',
  textInverse: palette.neutral950,
  textDisabled: '#6B5A64',

  border: palette.neutral900,
  borderStrong: palette.neutral750,
  // Koyu zemine (#1A1218) karşı 3.46:1. Açık temadakinden bir basamak koyu
  // seçildi; koyu zeminde neutral500 (5.05:1) fazla parlak kalıyordu.
  borderControl: palette.neutral600,
  focusRing: '#FF9FC9',

  disabledBackground: '#2A1F26',
  disabledText: '#6B5A64',

  elevation: darkElevation,
};

export const themes: Record<ThemeName, ColorTheme> = {
  light: lightTheme,
  dark: darkTheme,
};

/** Tema adından tema nesnesi. Şimdilik varsayılan açık tema. */
export function getTheme(name: ThemeName = 'light'): ColorTheme {
  return themes[name];
}
