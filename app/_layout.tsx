import { ThemeProvider } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import { Nunito_400Regular } from '@expo-google-fonts/nunito/400Regular';
import { Nunito_600SemiBold } from '@expo-google-fonts/nunito/600SemiBold';
import { Nunito_700Bold } from '@expo-google-fonts/nunito/700Bold';
import { Nunito_800ExtraBold } from '@expo-google-fonts/nunito/800ExtraBold';
import { useFonts } from 'expo-font';
import * as Linking from 'expo-linking';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { syncPrayerNotifications } from '@/features/prayer/notificationSync';
import { prepareNotifications } from '@/features/prayer/notifications';
import { syncQuranGoalNotification } from '@/features/quran/goalNotificationSync';
import { buildNavigationTheme } from '@/lib/navigationTheme';
import { useTheme } from '@/lib/useTheme';
import { handleAuthCallback, useAccountStore } from '@/features/account/store';
import { getSupabaseClient } from '@/features/account/supabase';
import { requestSync } from '@/features/sync/syncEngine';

/**
 * Kök yerleşim.
 *
 * `SafeAreaProvider` burada YOK — expo-router uygulamayı zaten kendisi sarıyor
 * (ExpoRoot). İkinci bir provider güvenli alan ölçülerini bozar.
 */
export default function RootLayout() {
  const { theme, isDark } = useTheme();
  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  /**
   * Bildirim hazırlığı ve zamanlaması (Faz 4.4 ve 5.3).
   *
   * ⚠️ **Burada olmak ZORUNDA, özellik sekmelerinde değil.** Kullanıcı ilgili
   * sekmeye hiç girmezse özellik hook'u monte olmaz; hatırlatmalar kurulduğu
   * yerde kalır, namaz önbellek penceresi kayar ve bir gün sessizce tükenirdi.
   * Zamanlanmış bildirimin bütün anlamı uygulamanın açılmadığı günlerde de
   * çalışması.
   *
   * ⚠️ Ön plana dönüş de dinleniyor: gün dönmüş, kullanıcı sistem
   * ayarlarından izni değiştirmiş ya da aradan bildirimler tetiklenmiş
   * olabilir. Her iki eşitleyici de aynı planı ikinci kez KURMUYOR (imza
   * denetimi), yani bu dinleyici bedavaya yakın.
   */
  useEffect(() => {
    void (async () => {
      await prepareNotifications();
      await Promise.all([syncPrayerNotifications(), syncQuranGoalNotification()]);
      await useAccountStore.getState().initialize();
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl !== null) {
        await handleAuthCallback(initialUrl);
      }
      await requestSync();
    })();

    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') {
        getSupabaseClient()?.auth.startAutoRefresh();
        void syncPrayerNotifications();
        void syncQuranGoalNotification();
        void requestSync();
      } else {
        getSupabaseClient()?.auth.stopAutoRefresh();
      }
    });
    const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      void handleAuthCallback(url).then(requestSync);
    });
    const networkSubscription = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        void requestSync();
      }
    });

    return () => {
      subscription.remove();
      linkingSubscription.remove();
      networkSubscription();
    };
  }, []);

  if (!fontsLoaded && fontError === null) {
    return null;
  }

  return (
    <ThemeProvider value={buildNavigationTheme(theme, isDark)}>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
