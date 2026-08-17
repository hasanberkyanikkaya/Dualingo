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
 * gül `rose600`; maskotun canlı pembesi `rose400` yalnızca grafik, ikon,
 * ilerleme çubuğu ve seviye düğümü içindir (`primaryBright`) — üzerine küçük
 * metin konmaz.
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
  /** Maskotun canlı pembesi — ilerleme çubuğu, ikon, illüstrasyon. Metin taşımaz. */
  primaryBright: string;

  secondary: string;
  secondaryPressed: string;
  secondarySoft: string;
  onSecondary: string;

  success: string;
  successSoft: string;
  onSuccess: string;

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
  background: palette.neutral50,
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

  success: palette.green600,
  successSoft: palette.green100,
  onSuccess: palette.neutral0,

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
  focusRing: palette.rose600,

  disabledBackground: palette.neutral150,
  disabledText: palette.neutral400,

  elevation: lightElevation,
};

export const darkTheme: ColorTheme = {
  background: palette.neutral950,
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

  success: palette.green400,
  successSoft: palette.green800,
  onSuccess: palette.green900,

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
