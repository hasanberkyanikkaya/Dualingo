import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { quranTheme } from '@/constants/quranTheme';
import { componentRadius } from '@/constants/radius';
import { layout, spacing } from '@/constants/spacing';
import { textStyles } from '@/constants/typography';

type QuranButtonProps = {
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  variant?: 'accent' | 'glass';
  disabled?: boolean;
};

export default function QuranButton({
  label,
  icon,
  onPress,
  variant = 'glass',
  disabled = false,
}: QuranButtonProps) {
  const accent = variant === 'accent';
  const contentColor = disabled
    ? quranTheme.textMuted
    : accent
      ? quranTheme.onAccent
      : quranTheme.text;

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
                ? quranTheme.glass
                : accent
                  ? quranTheme.accent
                  : pressed
                    ? quranTheme.glassPressed
                    : quranTheme.glass,
              borderColor: accent ? quranTheme.accent : quranTheme.glassBorder,
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
