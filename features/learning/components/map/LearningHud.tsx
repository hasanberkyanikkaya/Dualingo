import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { componentRadius } from '@/constants/radius';
import { layout, spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import { formatString } from '@/lib/formatString';
import { useTheme } from '@/lib/useTheme';

type LearningHudProps = {
  streakDays: number;
  unitNumber: number;
  levelNumber: number;
  totalLevels: number;
};

/** Öğren ekranında gerçek seri ve mevcut ünite konumunu gösteren küçük durum alanı. */
export default function LearningHud({
  streakDays,
  unitNumber,
  levelNumber,
  totalLevels,
}: LearningHudProps) {
  const { theme } = useTheme();
  const progress = formatString(strings.learn.hudProgress, {
    unit: unitNumber,
    current: levelNumber,
    total: totalLevels,
  });

  return (
    <View style={styles.row}>
      <View
        accessibilityLabel={formatString(strings.progress.streakDays, { count: streakDays })}
        style={[
          styles.pill,
          theme.elevation.card,
          { backgroundColor: theme.surface, borderColor: theme.textPrimary },
        ]}
      >
        <Ionicons name="flame" size={spacing.xl} color={theme.primaryBright} />
        <Text style={[textStyles.labelLarge, { color: theme.textPrimary }]}>{streakDays}</Text>
      </View>

      <View
        accessibilityLabel={progress}
        style={[
          styles.pill,
          styles.progressPill,
          theme.elevation.card,
          { backgroundColor: theme.secondarySoft, borderColor: theme.textPrimary },
        ]}
      >
        <Ionicons name="flag" size={spacing.lg} color={theme.textPrimary} />
        <Text numberOfLines={1} style={[textStyles.labelMedium, { color: theme.textPrimary }]}>
          {progress}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  pill: {
    minHeight: layout.minTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderWidth: 2,
    borderRadius: componentRadius.chip,
  },
  progressPill: {
    flex: 1,
  },
});
