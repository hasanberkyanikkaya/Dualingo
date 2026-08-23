import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import Button from '@/components/Button';
import { componentRadius } from '@/constants/radius';
import { spacing } from '@/constants/spacing';
import { strings } from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import { formatString } from '@/lib/formatString';
import { useTheme } from '@/lib/useTheme';

import type { OrderingRaceSession } from '@/types';

type OrderingRaceFinishProps = {
  session: OrderingRaceSession;
  puzzleCount: number;
  onRestart: () => void;
  onBack: () => void;
};

export default function OrderingRaceFinish({
  session,
  puzzleCount,
  onRestart,
  onBack,
}: OrderingRaceFinishProps) {
  const { theme } = useTheme();
  const completedDeck = session.finishReason === 'completed';

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.icon,
          { backgroundColor: completedDeck ? theme.successSoft : theme.secondarySoft },
        ]}
      >
        <Ionicons
          name={completedDeck ? 'checkmark-done' : 'timer-outline'}
          size={spacing.huge}
          color={completedDeck ? theme.success : theme.secondaryStrong}
        />
      </View>

      <View style={styles.copy}>
        <Text accessibilityRole="header" style={[textStyles.h2, { color: theme.textPrimary }]}>
          {completedDeck
            ? strings.games.orderingRaceFinishedDeck
            : strings.games.orderingRaceFinishedTime}
        </Text>
        <Text style={[textStyles.bodyMedium, { color: theme.textSecondary }]}>
          {strings.games.orderingRaceFinishedBody}
        </Text>
      </View>

      <View accessible accessibilityLabel={formatString(strings.a11y.orderingRaceScore, {
        score: session.score,
      })} style={[styles.scoreCard, { backgroundColor: theme.secondarySoft }]}>
        <Ionicons name="trophy" size={spacing.xxl} color={theme.secondaryStrong} />
        <Text style={[textStyles.h1, { color: theme.textPrimary }]}>{session.score}</Text>
        <Text style={[textStyles.labelLarge, { color: theme.textSecondary }]}>
          {strings.games.orderingRacePointsLabel}
        </Text>
      </View>

      <View style={styles.metrics}>
        <View style={[styles.metric, { backgroundColor: theme.surface, borderColor: theme.borderControl }]}>
          <Text style={[textStyles.h3, { color: theme.success }]}>
            {session.correctCount} / {puzzleCount}
          </Text>
          <Text style={[textStyles.bodySmall, { color: theme.textSecondary }]}>
            {strings.games.orderingRaceCorrectCount}
          </Text>
        </View>
        <View style={[styles.metric, { backgroundColor: theme.surface, borderColor: theme.borderControl }]}>
          <Text style={[textStyles.h3, { color: theme.primary }]}>{session.attemptCount}</Text>
          <Text style={[textStyles.bodySmall, { color: theme.textSecondary }]}>
            {strings.games.orderingRaceAttemptCount}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          fullWidth
          label={strings.games.orderingRacePlayAgain}
          onPress={onRestart}
          size="large"
        />
        <Button
          fullWidth
          label={strings.games.orderingRaceBackToLearn}
          onPress={onBack}
          size="large"
          variant="ghost"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'stretch', gap: spacing.xl },
  icon: {
    width: spacing.huge + spacing.xxl,
    height: spacing.huge + spacing.xxl,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: componentRadius.modal,
  },
  copy: { alignItems: 'center', gap: spacing.sm },
  scoreCard: {
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.xl,
    borderRadius: componentRadius.modal,
  },
  metrics: { flexDirection: 'row', gap: spacing.md },
  metric: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.lg,
    borderWidth: 2,
    borderRadius: componentRadius.card,
  },
  actions: { gap: spacing.sm },
});
