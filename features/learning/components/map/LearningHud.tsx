import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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
  onOpenGames: () => void;
};

/** Öğren ekranında gerçek seri ve mevcut ünite konumunu gösteren küçük durum alanı. */
export default function LearningHud({
  streakDays,
  unitNumber,
  levelNumber,
  totalLevels,
  onOpenGames,
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
          { backgroundColor: theme.secondary, borderColor: theme.secondaryStrong },
        ]}
      >
        <View
          style={[
            styles.flagMark,
            { backgroundColor: theme.primaryBright, borderColor: theme.textPrimary },
          ]}
        >
          <Ionicons name="flag" size={spacing.lg} color={theme.textPrimary} />
        </View>
        <Text numberOfLines={1} style={[textStyles.labelMedium, { color: theme.textPrimary }]}>
          {progress}
        </Text>
      </View>

      <Pressable
        accessibilityLabel={strings.games.openActivities}
        accessibilityRole="button"
        onPress={onOpenGames}
        style={({ pressed }) => [
          styles.gameButton,
          theme.elevation.card,
          {
            backgroundColor: pressed ? theme.secondary : theme.primaryBright,
            borderColor: theme.textPrimary,
          },
        ]}
      >
        <Ionicons name="game-controller" size={spacing.xl} color={theme.textPrimary} />
      </Pressable>
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
    justifyContent: 'flex-start',
    paddingLeft: spacing.xs,
  },
  flagMark: {
    width: spacing.xxl,
    height: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: componentRadius.button,
  },
  gameButton: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: componentRadius.button,
  },
});
