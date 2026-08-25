/**
 * Köşe yuvarlaklığı değerleri.
 *
 * Uygulamanın tonu sıcak ve davetkâr olduğu için ölçek genel olarak yumuşak
 * tarafta; keskin köşe (0) sadece tam genişlik ayırıcılarda kullanılır.
 */

export const radius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  /** Hap biçimli buton ve rozetler */
  pill: 999,
  /** Tam daire — avatar, seviye düğümü */
  full: 9999,
} as const;

export type RadiusToken = keyof typeof radius;

/** Bileşen bazlı varsayılanlar — bileşenler önce buraya bakar. */
export const componentRadius = {
  button: radius.pill,
  card: radius.xl,
  input: radius.md,
  chip: radius.pill,
  modal: radius.xxl,
  progressBar: radius.pill,
  /** Öğrenme yolundaki seviye düğümü */
  levelNode: radius.full,
} as const;
