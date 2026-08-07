/**
 * Boşluk ölçeği — tüm değerler 4'ün katı.
 *
 * Doğrudan sayı yazma (`marginTop: 10`), ölçekten seç. Ölçekte olmayan bir
 * boşluğa ihtiyaç duyuyorsan önce düzeni gözden geçir.
 */

export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  huge: 64,
} as const;

export type SpacingToken = keyof typeof spacing;

/** Düzen sabitleri — ekran ve dokunma hedefi ölçüleri. */
export const layout = {
  /** Ekranın sol/sağ iç boşluğu */
  screenPaddingHorizontal: spacing.lg,
  /** Ekranın üst/alt iç boşluğu */
  screenPaddingVertical: spacing.xl,
  /** Kart içi iç boşluk */
  cardPadding: spacing.lg,
  /** Liste elemanları arası boşluk */
  listGap: spacing.md,
  /** Bölümler arası boşluk */
  sectionGap: spacing.xxl,
  /** En küçük dokunulabilir alan — erişilebilirlik alt sınırı */
  minTouchTarget: 48,
  /** Alt sekme çubuğu yüksekliği (güvenli alan hariç) */
  tabBarHeight: 60,
} as const;
