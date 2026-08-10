/**
 * React Navigation tema köprüsü.
 *
 * Navigatörün kendi çizdiği yüzeyler (sekme çubuğu zemini, sahne arka planı)
 * bizim `ColorTheme` jetonlarımızı bilmez, kendi `Theme` nesnesinden okur.
 * Bu dosya ikisini eşler. Köprü kurulmazsa koyu temada sekme çubuğu beyaz kalır.
 *
 * `fonts` alanı hazır temadan olduğu gibi devralınır — özel yazı tipi
 * expo-font ile geldiğinde burası da güncellenecek.
 */

// Tema API'si `@react-navigation/native`'den alınıyor. SDK 57'nin expo-router'ı
// bunları kökünden yeniden dışa aktarıyordu; SDK 54'te etmiyor.
import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';

import type { ColorTheme } from '@/constants/colors';

export function buildNavigationTheme(theme: ColorTheme, isDark: boolean): Theme {
  const base = isDark ? DarkTheme : DefaultTheme;

  return {
    ...base,
    colors: {
      ...base.colors,
      primary: theme.primary,
      background: theme.background,
      card: theme.surface,
      text: theme.textPrimary,
      border: theme.border,
      notification: theme.error,
    },
  };
}
