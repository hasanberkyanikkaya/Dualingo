import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router/js-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { layout } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import { useTheme } from '@/lib/useTheme';

/**
 * Alt sekme yerleşimi.
 *
 * `Tabs` expo-router kökünden değil `expo-router/js-tabs` altından geliyor —
 * kökteki dışa aktarım SDK 57'de kullanımdan kaldırıldı.
 */
export default function TabsLayout() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

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
