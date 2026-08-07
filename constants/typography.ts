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
