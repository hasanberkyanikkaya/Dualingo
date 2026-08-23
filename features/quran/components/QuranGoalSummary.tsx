import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { quranTheme } from '@/constants/quranTheme';
import { componentRadius } from '@/constants/radius';
import { spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import JuzProgressGrid from '@/features/quran/components/JuzProgressGrid';
import QuranButton from '@/features/quran/components/QuranButton';
import QuranProgressBar from '@/features/quran/components/QuranProgressBar';
import { formatString } from '@/lib/formatString';
import { formatGregorianTr } from '@/lib/turkishDate';

import type { QuranGoal, QuranGoalProgress } from '@/types';

type QuranGoalSummaryProps = {
  goal: QuranGoal;
  progress: QuranGoalProgress;
  onEdit: () => void;
  onRemove: () => void;
};

function decimal(value: number): string {
  return value.toFixed(1).replace('.', ',');
}

function titleFor(goal: QuranGoal): string {
  if (goal.type === 'daily_pages') {
    return strings.quran.goalDailyTitle;
  }
  return goal.type === 'monthly_juz'
    ? strings.quran.goalMonthlyTitle
    : strings.quran.goalFinishTitle;
}

export default function QuranGoalSummary({
  goal,
  progress,
  onEdit,
  onRemove,
}: QuranGoalSummaryProps) {
  const statusText =
    progress.status === 'complete'
      ? strings.quran.goalComplete
      : progress.status === 'overdue'
        ? strings.quran.goalOverdue
        : strings.quran.goalActive;
  const statusIcon =
    progress.status === 'complete'
      ? 'checkmark-circle'
      : progress.status === 'overdue'
        ? 'time-outline'
        : 'navigate-circle-outline';
  const statusColor = progress.status === 'overdue' ? quranTheme.warning : quranTheme.accent;
  const progressLabel =
    goal.type === 'monthly_juz'
      ? formatString(strings.quran.goalProgressJuz, {
          current: decimal(
            progress.targetPages === 0
              ? 0
              : Math.min(
                  goal.targetValue,
                  (progress.completedPages / progress.targetPages) * goal.targetValue,
                ),
          ),
          target: goal.targetValue,
        })
      : formatString(strings.quran.goalProgressPages, {
          current: progress.completedPages,
          target: Math.ceil(progress.targetPages),
        });
  const estimate =
    progress.estimatedCompletionDate === null
      ? strings.quran.goalEstimateUnavailable
      : formatString(strings.quran.goalEstimate, {
          date:
            formatGregorianTr(progress.estimatedCompletionDate) ??
            progress.estimatedCompletionDate,
        });

  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.iconSurface}>
            <Ionicons name="flag" size={spacing.xl} color={quranTheme.onAccent} />
          </View>
          <View style={styles.headerCopy}>
            <Text style={[textStyles.h3, { color: quranTheme.text }]}>{titleFor(goal)}</Text>
            <View style={styles.statusRow}>
              <Ionicons name={statusIcon} size={spacing.lg} color={statusColor} />
              <Text style={[textStyles.labelMedium, { color: statusColor }]}>{statusText}</Text>
            </View>
          </View>
          <Text style={[textStyles.h2, { color: quranTheme.accent }]}>{progress.percent}%</Text>
        </View>

        <View style={styles.progressSection}>
          <QuranProgressBar ratio={progress.ratio} accessibilityLabel={progressLabel} />
          <Text style={[textStyles.labelLarge, { color: quranTheme.text }]}>{progressLabel}</Text>
        </View>

        <View style={styles.metrics}>
          <View style={styles.metricRow}>
            <Ionicons name="calendar-outline" size={spacing.lg} color={quranTheme.textMuted} />
            <Text style={[textStyles.bodySmall, styles.metricText, { color: quranTheme.textMuted }]}>
              {estimate}
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Ionicons name="speedometer-outline" size={spacing.lg} color={quranTheme.textMuted} />
            <Text style={[textStyles.bodySmall, styles.metricText, { color: quranTheme.textMuted }]}>
              {formatString(strings.quran.goalDailyAverage, {
                pages: decimal(progress.dailyAveragePages),
              })}
            </Text>
          </View>
          {goal.targetDate !== null ? (
            <View style={styles.metricRow}>
              <Ionicons name="flag-outline" size={spacing.lg} color={quranTheme.textMuted} />
              <Text style={[textStyles.bodySmall, styles.metricText, { color: quranTheme.textMuted }]}>
                {formatString(strings.quran.goalDeadline, {
                  date: formatGregorianTr(goal.targetDate) ?? goal.targetDate,
                })}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <JuzProgressGrid items={progress.juzProgress} />

      <View style={styles.actions}>
        <QuranButton icon="options-outline" label={strings.quran.goalEdit} onPress={onEdit} />
        <QuranButton icon="close-circle-outline" label={strings.quran.goalRemove} onPress={onRemove} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xxl },
  card: {
    gap: spacing.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: quranTheme.glassBorder,
    borderRadius: componentRadius.modal,
    backgroundColor: quranTheme.glass,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconSurface: {
    width: spacing.xxxl,
    height: spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: componentRadius.button,
    backgroundColor: quranTheme.accent,
  },
  headerCopy: { flex: 1, gap: spacing.xs },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  progressSection: { gap: spacing.sm },
  metrics: { gap: spacing.sm },
  metricRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  metricText: { flex: 1 },
  actions: { gap: spacing.sm },
});
