/**
 * Tipografi ölçeği.
 *
 * Uygulama genelinde Nunito kullanılır. Kök yerleşim yalnız kullanılan dört
 * ağırlığı yükler; Arapça Mushaf ölçeği bu Latin arayüz ailesinden bağımsızdır.
 *
 * Bileşenler tekil `fontSize`/`fontWeight` yerine hazır `textStyles` jetonlarını
 * kullanır; böylece satır yüksekliği de tutarlı gelir.
 */

import type { TextStyle } from 'react-native';

import type { QuranReaderFontSize } from '@/types';

export const fontFamily = {
  regular: 'Nunito_400Regular',
  medium: 'Nunito_600SemiBold',
  semibold: 'Nunito_700Bold',
  bold: 'Nunito_800ExtraBold',
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  display: 36,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

export type FontWeightToken = keyof typeof fontWeight;

/** Bir metin stilinin taşıdığı alanlar. */
export type TextStyleToken = {
  fontSize: number;
  lineHeight: number;
  fontWeight: TextStyle['fontWeight'];
  fontFamily: string;
  letterSpacing?: number;
};

/**
 * Hazır metin stilleri.
 *   heading — başlıklar
 *   body    — gövde metni
 *   label   — buton, etiket, rozet gibi kısa metinler
 */
export const textStyles = {
  // Başlıklar
  h1: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.display,
    lineHeight: 44,
    fontWeight: fontWeight.extrabold,
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xxxl,
    lineHeight: 38,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.3,
  },
  h3: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xxl,
    lineHeight: 32,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.2,
  },
  h4: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xl,
    lineHeight: 28,
    fontWeight: fontWeight.semibold,
  },

  // Gövde
  bodyLarge: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.lg,
    lineHeight: 28,
    fontWeight: fontWeight.regular,
  },
  bodyMedium: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    lineHeight: 24,
    fontWeight: fontWeight.regular,
  },
  bodySmall: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    lineHeight: 20,
    fontWeight: fontWeight.regular,
  },
  /** Gövde metninde vurgu — soru metni, öne çıkan cümle */
  bodyStrong: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    lineHeight: 24,
    fontWeight: fontWeight.semibold,
  },

  // Etiketler
  labelLarge: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.md,
    lineHeight: 20,
    fontWeight: fontWeight.semibold,
  },
  labelMedium: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    lineHeight: 18,
    fontWeight: fontWeight.semibold,
  },
  labelSmall: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    lineHeight: 16,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.2,
  },
  /** Buton metni — çocuk kullanıcıda okunurluk için biraz iri */
  button: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.lg,
    lineHeight: 24,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.2,
  },
  /** Yardımcı açıklama, alt not */
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    lineHeight: 16,
    fontWeight: fontWeight.regular,
  },
} as const satisfies Record<string, TextStyleToken>;

export type TextStyleName = keyof typeof textStyles;

export type QuranTextScale = {
  arabic: { fontSize: number; lineHeight: number };
  translation: { fontSize: number; lineHeight: number };
  footnote: { fontSize: number; lineHeight: number };
};

/** Okuyucunun üç kademeli yazı ölçeği; Arapça harekeler kırpılmasın diye satır aralığı geniştir. */
export const quranTextScales = {
  small: {
    arabic: { fontSize: 24, lineHeight: 42 },
    translation: { fontSize: 14, lineHeight: 22 },
    footnote: { fontSize: 12, lineHeight: 18 },
  },
  medium: {
    arabic: { fontSize: 29, lineHeight: 50 },
    translation: { fontSize: 16, lineHeight: 25 },
    footnote: { fontSize: 14, lineHeight: 20 },
  },
  large: {
    arabic: { fontSize: 34, lineHeight: 58 },
    translation: { fontSize: 18, lineHeight: 28 },
    footnote: { fontSize: 16, lineHeight: 24 },
  },
} as const satisfies Record<QuranReaderFontSize, QuranTextScale>;
