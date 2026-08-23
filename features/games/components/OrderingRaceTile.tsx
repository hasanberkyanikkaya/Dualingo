import { Pressable, StyleSheet, Text, View } from 'react-native';

import { componentRadius } from '@/constants/radius';
import { layout, spacing } from '@/constants/spacing';
import { strings } from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import { formatString } from '@/lib/formatString';
import { useTheme } from '@/lib/useTheme';

type OrderingRaceTileProps = {
  text: string;
  position: number | null;
  disabled: boolean;
  onPress: () => void;
};

export default function OrderingRaceTile({
  text,
  position,
  disabled,
  onPress,
}: OrderingRaceTileProps) {
  const { theme } = useTheme();
  const placed = position !== null;
  const accessibilityLabel = placed
    ? formatString(strings.a11y.orderingRacePlacedItem, { position, text })
    : formatString(strings.a11y.orderingRaceAvailableItem, { text });

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ selected: placed, disabled }}
      disabled={disabled}
      onPress={onPress}
    >
      {({ pressed }) => (
        <View
          style={[
            styles.tile,
            {
              backgroundColor: placed || pressed ? theme.primarySoft : theme.surface,
              borderColor: placed ? theme.primary : theme.borderControl,
            },
          ]}
        >
          {position === null ? null : (
            <View style={[styles.badge, { backgroundColor: theme.primary }]}>
              <Text style={[textStyles.labelMedium, { color: theme.onPrimary }]}>{position}</Text>
            </View>
          )}
          <Text style={[textStyles.bodyStrong, styles.text, { color: theme.textPrimary }]}>
            {text}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    minHeight: layout.minTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 2,
    borderRadius: componentRadius.card,
  },
  badge: {
    minWidth: spacing.xl,
    height: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: componentRadius.chip,
  },
  text: { flexShrink: 1 },
});
