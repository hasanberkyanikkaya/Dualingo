import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { syncPrayerNotifications } from '@/features/prayer/notificationSync';
import { prepareNotifications } from '@/features/prayer/notifications';
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

  /**
   * Bildirim hazırlığı ve zamanlaması (Faz 4.4).
   *
   * ⚠️ **Burada olmak ZORUNDA, namaz sekmesinde değil.** Kullanıcı namaz
   * sekmesine hiç girmezse `usePrayerTimes` monte olmaz; hatırlatmalar
   * kurulduğu yerde kalır, önbellek penceresi kayar ve bir gün sessizce
   * tükenirdi. Zamanlanmış bildirimin bütün anlamı uygulamanın açılmadığı
   * günlerde de çalışması.
   *
   * ⚠️ Ön plana dönüş de dinleniyor: gün dönmüş, kullanıcı sistem
   * ayarlarından izni değiştirmiş ya da aradan bildirimler tetiklenmiş
   * olabilir. `syncPrayerNotifications` aynı planı ikinci kez KURMUYOR
   * (imza denetimi), yani bu dinleyici bedavaya yakın.
   */
  useEffect(() => {
    void (async () => {
      await prepareNotifications();
      await syncPrayerNotifications();
    })();

    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') {
        void syncPrayerNotifications();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <ThemeProvider value={buildNavigationTheme(theme, isDark)}>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
