/**
 * Aktif renk temasını veren kanca.
 *
 * Bileşenler `lightTheme` / `darkTheme` nesnelerini DOĞRUDAN import etmez —
 * hepsi buradan okur. Faz 3'te MMKV'ye bağlı kullanıcı tercihi
 * (Açık / Koyu / Sistem) geldiğinde yalnızca bu dosyanın içi değişir,
 * çağrı yerleri olduğu gibi kalır.
 */

import { useColorScheme } from 'react-native';

import { getTheme, type ColorTheme, type ThemeName } from '@/constants/colors';

export type ThemeState = {
  /** Anlamsal renk jetonları */
  theme: ColorTheme;
  /** Çözümlenmiş tema adı */
  scheme: ThemeName;
  /** Kısayol — koşullu stil yazarken okunurluk için */
  isDark: boolean;
};

export function useTheme(): ThemeState {
  // Sistem henüz karar vermemişse `null` döner; açık tema kabul edilir.
  const systemScheme = useColorScheme();
  const scheme: ThemeName = systemScheme === 'dark' ? 'dark' : 'light';

  return {
    theme: getTheme(scheme),
    scheme,
    isDark: scheme === 'dark',
  };
}
