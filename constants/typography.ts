/**
 * Tipografi ölçeği.
 *
 * Şimdilik sistem yazı tipi kullanılır (fontFamily verilmez) — özel font
 * Faz 1'de expo-font ile eklenecek, o zaman buraya `fontFamily` alanı gelir.
 *
 * Bileşenler tekil `fontSize`/`fontWeight` yerine hazır `textStyles` jetonlarını
 * kullanır; böylece satır yüksekliği de tutarlı gelir.
 */

import type { TextStyle } from 'react-native';

import type { QuranReaderFontSize } from '@/types';

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
    fontSize: fontSize.display,
    lineHeight: 44,
    fontWeight: fontWeight.extrabold,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: fontSize.xxxl,
    lineHeight: 38,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: fontSize.xxl,
    lineHeight: 32,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.2,
  },
  h4: {
    fontSize: fontSize.xl,
    lineHeight: 28,
    fontWeight: fontWeight.semibold,
  },

  // Gövde
  bodyLarge: {
    fontSize: fontSize.lg,
    lineHeight: 28,
    fontWeight: fontWeight.regular,
  },
  bodyMedium: {
    fontSize: fontSize.md,
    lineHeight: 24,
    fontWeight: fontWeight.regular,
  },
  bodySmall: {
    fontSize: fontSize.sm,
    lineHeight: 20,
    fontWeight: fontWeight.regular,
  },
  /** Gövde metninde vurgu — soru metni, öne çıkan cümle */
  bodyStrong: {
    fontSize: fontSize.md,
    lineHeight: 24,
    fontWeight: fontWeight.semibold,
  },

  // Etiketler
  labelLarge: {
    fontSize: fontSize.md,
    lineHeight: 20,
    fontWeight: fontWeight.semibold,
  },
  labelMedium: {
    fontSize: fontSize.sm,
    lineHeight: 18,
    fontWeight: fontWeight.semibold,
  },
  labelSmall: {
    fontSize: fontSize.xs,
    lineHeight: 16,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.2,
  },
  /** Buton metni — çocuk kullanıcıda okunurluk için biraz iri */
  button: {
    fontSize: fontSize.lg,
    lineHeight: 24,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.2,
  },
  /** Yardımcı açıklama, alt not */
  caption: {
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
