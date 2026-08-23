import { StyleSheet, Text, View } from 'react-native';

import Button from '@/components/Button';
import { componentRadius } from '@/constants/radius';
import { spacing } from '@/constants/spacing';
import { strings } from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import OrderingRaceTile from '@/features/games/components/OrderingRaceTile';
import { shuffleOrderingRaceItems } from '@/features/games/orderingRaceEngine';
import { useTheme } from '@/lib/useTheme';

import type { OrderingRaceAnswerResult, OrderingRacePuzzle } from '@/types';

type OrderingRaceBoardProps = {
  puzzle: OrderingRacePuzzle;
  placedIds: readonly string[];
  result: OrderingRaceAnswerResult;
  sessionSeed: number;
  onToggle: (itemId: string) => void;
  onSubmit: () => void;
};

export default function OrderingRaceBoard({
  puzzle,
  placedIds,
  result,
  sessionSeed,
  onToggle,
  onSubmit,
}: OrderingRaceBoardProps) {
  const { theme } = useTheme();
  const shuffled = shuffleOrderingRaceItems(puzzle, `${puzzle.id}:${sessionSeed}`);
  const placed = placedIds
    .map((id) => puzzle.items.find((item) => item.id === id))
    .filter((item): item is OrderingRacePuzzle['items'][number] => item !== undefined);
  const pool = shuffled.filter((item) => !placedIds.includes(item.id));

  return (
    <View style={styles.root}>
      <Text accessibilityRole="header" style={[textStyles.h3, { color: theme.textPrimary }]}>
        {puzzle.prompt}
      </Text>

      <View style={styles.section}>
        <Text style={[textStyles.labelMedium, { color: theme.textSecondary }]}>
          {strings.games.orderingRaceYourOrder}
        </Text>
        <View style={styles.list}>
          {placed.length === 0 ? (
            <Text style={[textStyles.bodySmall, { color: theme.textMuted }]}>
              {strings.games.orderingRaceEmpty}
            </Text>
          ) : (
            placed.map((item, index) => (
              <OrderingRaceTile
                key={item.id}
                disabled={false}
                onPress={() => onToggle(item.id)}
                position={index + 1}
                text={item.text}
              />
            ))
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[textStyles.labelMedium, { color: theme.textSecondary }]}>
          {strings.games.orderingRacePool}
        </Text>
        <View style={styles.list}>
          {pool.map((item) => (
            <OrderingRaceTile
              key={item.id}
              disabled={false}
              onPress={() => onToggle(item.id)}
              position={null}
              text={item.text}
            />
          ))}
        </View>
      </View>

      {result === null ? null : (
        <View
          accessibilityLiveRegion="polite"
          style={[
            styles.feedback,
            {
              backgroundColor: result === 'correct' ? theme.successSoft : theme.errorSoft,
              borderColor: result === 'correct' ? theme.success : theme.error,
            },
          ]}
        >
          <Text
            style={[
              textStyles.bodyStrong,
              { color: result === 'correct' ? theme.success : theme.error },
            ]}
          >
            {result === 'correct'
              ? strings.games.orderingRaceCorrect
              : strings.games.orderingRaceIncorrect}
          </Text>
        </View>
      )}

      <Button
        disabled={placedIds.length !== puzzle.items.length}
        fullWidth
        label={strings.games.orderingRaceCheck}
        onPress={onSubmit}
        size="large"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xl },
  section: { gap: spacing.sm },
  list: { gap: spacing.sm, minHeight: spacing.xxxl },
  feedback: {
    padding: spacing.md,
    borderWidth: 1,
    borderRadius: componentRadius.card,
  },
});
