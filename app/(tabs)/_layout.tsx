import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { layout } from '@/constants/spacing';
import { quranTheme } from '@/constants/quranTheme';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
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
  const insets = useSafeAreaInsets();
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
      screenOptions={{
        // Kök Stack'teki ayar Tabs navigatörünün kendi başlığını kapatmıyor.
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarLabelStyle: textStyles.labelSmall,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          // Özel yükseklik verildiğinde navigatör güvenli alanı EKLEMİYOR ama
          // alt dolguyu uygulamaya devam ediyor. Inset elle eklenmezse
          // çentikli cihazlarda ikon ve etiket kırpılır.
          height: layout.tabBarHeight + insets.bottom,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: strings.tabs.learn,
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'school' : 'school-outline'} size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="prayer"
        options={{
          title: strings.tabs.prayer,
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'moon' : 'moon-outline'} size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="quran"
        options={{
          title: strings.tabs.quran,
          tabBarActiveTintColor: quranTheme.accent,
          tabBarInactiveTintColor: quranTheme.textMuted,
          tabBarStyle: {
            height: layout.tabBarHeight + insets.bottom,
            backgroundColor: quranTheme.backgroundBottom,
            borderTopColor: quranTheme.glassBorder,
          },
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'book' : 'book-outline'} size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: strings.tabs.profile,
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
