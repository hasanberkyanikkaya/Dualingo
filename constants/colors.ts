/**
 * Renk paleti — "Zümrüt & Bal"
 *
 * İki katman var:
 *   1. palette — ham renk basamakları. Bileşenlerde DOĞRUDAN kullanılmaz.
 *   2. lightTheme / darkTheme — anlamsal (semantic) jetonlar. Bileşenler bunları okur.
 *
 * Kontrast notu: metin taşıyan her dolgu rengi, üzerindeki `on*` rengiyle
 * WCAG AA (4.5:1) sağlar. `emerald500` gibi parlak tonlar sadece grafik,
 * ikon ve ilerleme çubuğu içindir — üzerine küçük metin konmaz.
 */

// ── Ham palet ────────────────────────────────────────────────────────────────

export const palette = {
  // Zümrüt — birincil marka rengi
  emerald50: '#E6F7F0',
  emerald100: '#C3EDDD',
  emerald200: '#94DFC4',
  emerald300: '#5FCDA6',
  emerald400: '#2ED396',
  emerald500: '#17A67A', // marka zümrütü — grafik/ilerleme, metin taşımaz
  emerald600: '#0C8059', // metin taşıyabilen dolgu tonu
  emerald700: '#0A6647',
  emerald800: '#07422F',
  emerald900: '#06251A',

  // Bal — ikincil, vurgu ve ödül
  honey50: '#FEF1DA',
  honey100: '#FDE9BC',
  honey200: '#FADB90',
  honey300: '#F8CA68',
  honey400: '#F5B342', // bal sarısı — üzerine koyu metin gelir
  honey500: '#D9911F',
  honey600: '#A96C14',
  honey700: '#77490C',
  honey800: '#3D2A05',
  honey900: '#2A1C03',

  // Yeşil — başarı geri bildirimi (zümrütten biraz daha sarıya çalar,
  // "doğru cevap" ile "marka rengi" karışmasın diye)
  green100: '#E2F5E8',
  green400: '#3FD07E',
  green500: '#2FBF63',
  green600: '#17864A',
  green800: '#10331F',
  green900: '#05230F',

  // Kırmızı — hata
  red100: '#FBE7E7',
  red400: '#FF6369',
  red500: '#E5484D',
  red600: '#D13438',
  red800: '#3A1A1B',
  red900: '#2A0708',

  // Sıcak nötrler — soğuk gri yerine kahveye çalan gri (davetkâr ton)
  neutral0: '#FFFFFF',
  neutral50: '#FFFDF8',
  neutral100: '#F7F3EA',
  neutral150: '#F0EBE1',
  neutral200: '#E8E3D9',
  neutral300: '#D5CEC1',
  neutral400: '#B0A899',
  neutral500: '#8A8375',
  neutral600: '#6E6A61',
  neutral700: '#4A463F',
  neutral750: '#34302A',
  neutral800: '#2B2823',
  neutral850: '#1F1C18',
  neutral900: '#1C1A16',
  neutral950: '#14120F',
} as const;

// ── Tip tanımları ────────────────────────────────────────────────────────────

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
  /** Parlak marka zümrütü — ilerleme çubuğu, ikon, illüstrasyon. Metin taşımaz. */
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

const lightElevation: ColorTheme['elevation'] = {
  none: noElevation,
  card: {
    shadowColor: palette.neutral900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  raised: {
    shadowColor: palette.neutral900,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  modal: {
    shadowColor: palette.neutral900,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
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
  overlay: 'rgba(28, 26, 22, 0.45)',

  primary: palette.emerald600,
  primaryPressed: palette.emerald700,
  primarySoft: palette.emerald50,
  onPrimary: palette.neutral0,
  primaryBright: palette.emerald500,

  secondary: palette.honey400,
  secondaryPressed: palette.honey500,
  secondarySoft: palette.honey50,
  onSecondary: palette.honey800,

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
  focusRing: palette.emerald600,

  disabledBackground: palette.neutral150,
  disabledText: palette.neutral400,

  elevation: lightElevation,
};

export const darkTheme: ColorTheme = {
  background: palette.neutral950,
  surface: palette.neutral850,
  surfaceAlt: palette.neutral800,
  overlay: 'rgba(0, 0, 0, 0.6)',

  // Koyu zeminde parlak yeşil dolgu + koyu metin okunur; tersi değil.
  primary: palette.emerald400,
  primaryPressed: palette.emerald300,
  primarySoft: palette.emerald800,
  onPrimary: palette.emerald900,
  primaryBright: palette.emerald400,

  secondary: palette.honey400,
  secondaryPressed: palette.honey500,
  secondarySoft: palette.honey800,
  onSecondary: palette.honey900,

  success: palette.green400,
  successSoft: palette.green800,
  onSuccess: palette.green900,

  error: palette.red400,
  errorSoft: palette.red800,
  onError: palette.red900,

  textPrimary: '#F5F1E8',
  textSecondary: '#C9C3B6',
  textMuted: '#948D80',
  textInverse: palette.neutral950,
  textDisabled: '#5C564C',

  border: palette.neutral750,
  borderStrong: palette.neutral700,
  focusRing: palette.emerald400,

  disabledBackground: '#262320',
  disabledText: '#5C564C',

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
