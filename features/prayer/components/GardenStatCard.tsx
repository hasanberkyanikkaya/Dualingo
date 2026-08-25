import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { componentRadius } from '@/constants/radius';
import { spacing } from '@/constants/spacing';
import { textStyles } from '@/constants/typography';
import { useTheme } from '@/lib/useTheme';

import type { ComponentProps } from 'react';

type GardenStatCardProps = {
  value: number;
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
};

export default function GardenStatCard({ value, label, icon }: GardenStatCardProps) {
  const { theme } = useTheme();

  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}`}
      style={[
        styles.card,
        theme.elevation.card,
        { backgroundColor: theme.surface, borderColor: theme.borderStrong },
      ]}
    >
      <View style={[styles.icon, { backgroundColor: theme.secondarySoft }]}> 
        <Ionicons name={icon} size={spacing.xl} color={theme.secondaryStrong} />
      </View>
      <Text style={[textStyles.h3, { color: theme.textPrimary }]}>{value}</Text>
      <Text style={[textStyles.bodySmall, styles.label, { color: theme.textSecondary }]}> 
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.md,
    borderWidth: 1,
    borderRadius: componentRadius.card,
  },
  icon: {
    width: spacing.xxxl,
    height: spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: componentRadius.button,
  },
  label: { textAlign: 'center' },
});
