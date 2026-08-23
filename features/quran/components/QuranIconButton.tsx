import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { quranTheme } from '@/constants/quranTheme';
import { componentRadius } from '@/constants/radius';
import { layout, spacing } from '@/constants/spacing';

type QuranIconButtonProps = {
  accessibilityLabel: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  disabled?: boolean;
};

export default function QuranIconButton({
  accessibilityLabel,
  icon,
  onPress,
  disabled = false,
}: QuranIconButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={spacing.sm}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor:
            pressed && !disabled ? quranTheme.glassPressed : quranTheme.glass,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={spacing.xl}
        color={disabled ? quranTheme.textMuted : quranTheme.text}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: quranTheme.glassBorder,
    borderRadius: componentRadius.button,
  },
});
