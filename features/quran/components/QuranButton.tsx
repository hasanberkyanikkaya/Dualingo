import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { quranTheme } from '@/constants/quranTheme';
import { componentRadius } from '@/constants/radius';
import { layout, spacing } from '@/constants/spacing';
import { textStyles } from '@/constants/typography';
import { useTheme } from '@/lib/useTheme';

type QuranButtonProps = {
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  variant?: 'accent' | 'glass';
  surfaceTone?: 'quran' | 'app';
  disabled?: boolean;
};

export default function QuranButton({
  label,
  icon,
  onPress,
  variant = 'glass',
  surfaceTone = 'quran',
  disabled = false,
}: QuranButtonProps) {
  const { theme } = useTheme();
  const accent = variant === 'accent';
  const appSurface = surfaceTone === 'app';
  const contentColor = disabled
    ? appSurface
      ? theme.textMuted
      : quranTheme.textMuted
    : accent
      ? quranTheme.onAccent
      : appSurface
        ? theme.textPrimary
        : quranTheme.text;
  const glass = appSurface ? theme.surfaceGlass : quranTheme.glass;
  const glassPressed = appSurface ? theme.surfaceAlt : quranTheme.glassPressed;
  const glassBorder = appSurface ? theme.borderControl : quranTheme.glassBorder;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={styles.pressable}
    >
      {({ pressed }) => (
        <View
          style={[
            styles.surface,
            {
              backgroundColor: disabled
                ? glass
                : accent
                  ? quranTheme.accent
                  : pressed
                    ? glassPressed
                    : glass,
              borderColor: accent ? quranTheme.accent : glassBorder,
            },
          ]}
        >
          <Ionicons name={icon} size={spacing.xl} color={contentColor} />
          <Text style={[textStyles.labelLarge, { color: contentColor }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignSelf: 'stretch',
  },
  surface: {
    minHeight: layout.minTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderRadius: componentRadius.button,
  },
});
