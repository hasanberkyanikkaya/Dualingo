import { Redirect, Tabs } from 'expo-router';

import TextTabBar from '@/components/TextTabBar';
import strings from '@/constants/strings';
import { usePlacement } from '@/features/onboarding/usePlacement';
import { useTheme } from '@/lib/useTheme';

/**
 * Alt sekme yerleşimi.
 *
 * `Tabs` expo-router kökünden geliyor. SDK 57'de bu dışa aktarım kullanımdan
 * kaldırılıp `expo-router/js-tabs` altına taşınmıştı; SDK 54'te o yol henüz yok.
 */
export default function TabsLayout() {
  const { theme } = useTheme();
  const placement = usePlacement();

  /**
   * Karşılama kapısı — seviye tespiti yapılmadan sekmeler çizilmez.
   *
   * ⚠️ Bir `useEffect` + `router.replace` yerine bildirimsel `Redirect`:
   * depolama **senkron** (MMKV) olduğu için `placement` daha ilk çizimde doğru
   * ve sekme çubuğu tek bir kare bile parlamıyor. Asenkron bir depolama
   * seçilseydi burada bir yükleme durumu şart olurdu — depolama kararının
   * (Oturum 2.4) ikinci kez karşılığını verdiği yer.
   *
   * ⚠️ Kapı sekmelerin ÖNÜNDE, kök yerleşimde değil: `/lesson/[id]` derin
   * bağlantısı buradan geçmiyor ve geçmemeli — ders ekranının kendi kilit
   * denetimi (`resolveLevelStatus`) zaten yerinde.
   */
  if (placement === null) {
    return <Redirect href="/placement" />;
  }

  return (
    <Tabs
      tabBar={(props) => <TextTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        sceneStyle: { backgroundColor: theme.surfaceAlt },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: strings.tabs.learn,
        }}
      />

      <Tabs.Screen
        name="prayer"
        options={{
          title: strings.tabs.prayer,
        }}
      />

      <Tabs.Screen
        name="quran"
        options={{
          title: strings.tabs.quran,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: strings.tabs.profile,
        }}
      />
    </Tabs>
  );
}
