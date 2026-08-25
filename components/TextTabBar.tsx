import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { layout, spacing } from '@/constants/spacing';
import { textStyles } from '@/constants/typography';
import { useTheme } from '@/lib/useTheme';

/** Dört ana pencereyi yalnızca metinle gösteren özel alt navigasyon. */
export default function TextTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const { theme } = useTheme();

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.bar,
        {
          height: layout.tabBarHeight + insets.bottom,
          paddingBottom: insets.bottom,
          backgroundColor: theme.surfaceAlt,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const options = descriptors[route.key].options;
        const selected = state.index === index;
        const label = options.title ?? route.name;

        function openTab(): void {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!selected && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        }

        return (
          <Pressable
            key={route.key}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
            onPress={openTab}
            style={styles.tab}
          >
            <Text
              numberOfLines={1}
              style={[
                textStyles.labelSmall,
                styles.label,
                { color: selected ? theme.textPrimary : theme.textSecondary },
              ]}
            >
              {label}
            </Text>
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={[
                styles.dot,
                { backgroundColor: selected ? theme.textPrimary : 'transparent' },
              ]}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  tab: {
    flex: 1,
    minHeight: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing.xs,
  },
  label: {
    textAlign: 'center',
  },
  dot: {
    width: spacing.xs,
    height: spacing.xs,
    borderRadius: spacing.xs,
  },
});
