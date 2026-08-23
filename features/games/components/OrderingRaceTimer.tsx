import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import ProgressBar from '@/components/ProgressBar';
import { componentRadius } from '@/constants/radius';
import { spacing } from '@/constants/spacing';
import { strings } from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import { ORDERING_RACE_DURATION_MS } from '@/features/games/orderingRaceEngine';
import { useGameCountdown } from '@/features/games/useGameCountdown';
import { formatString } from '@/lib/formatString';
import { useTheme } from '@/lib/useTheme';

type OrderingRaceTimerProps = {
  deadlineAt: number;
  onElapsed: () => void;
};

export default function OrderingRaceTimer({ deadlineAt, onElapsed }: OrderingRaceTimerProps) {
  const { theme } = useTheme();
  const remaining = useGameCountdown(deadlineAt, onElapsed);
  const seconds = Math.max(0, Math.ceil(remaining / 1000));
  const label = formatString(strings.a11y.orderingRaceTimer, { seconds });

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: theme.surface, borderColor: theme.borderControl },
      ]}
    >
      <View accessible accessibilityLabel={label} style={styles.labelRow}>
        <Ionicons
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          name="timer-outline"
          size={spacing.xl}
          color={seconds <= 10 ? theme.error : theme.primary}
        />
        <Text
          style={[
            textStyles.h3,
            { color: seconds <= 10 ? theme.error : theme.textPrimary },
          ]}
        >
          {seconds}
        </Text>
      </View>
      <ProgressBar
        accessibilityLabel={label}
        current={remaining}
        total={ORDERING_RACE_DURATION_MS}
        variant={seconds <= 10 ? 'primary' : 'secondary'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 2,
    borderRadius: componentRadius.card,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
});
