import { Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { buildNavigationTheme } from '@/lib/navigationTheme';
import { useTheme } from '@/lib/useTheme';

/**
 * Kök yerleşim.
 *
 * `SafeAreaProvider` burada YOK — expo-router uygulamayı zaten kendisi sarıyor
 * (ExpoRoot). İkinci bir provider güvenli alan ölçülerini bozar.
 */
export default function RootLayout() {
  const { theme, isDark } = useTheme();

  return (
    <ThemeProvider value={buildNavigationTheme(theme, isDark)}>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
