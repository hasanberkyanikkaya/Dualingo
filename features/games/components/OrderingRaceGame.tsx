import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import Button from '@/components/Button';
import { componentRadius } from '@/constants/radius';
import { layout, spacing } from '@/constants/spacing';
import { strings } from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import OrderingRaceBoard from '@/features/games/components/OrderingRaceBoard';
import OrderingRaceFinish from '@/features/games/components/OrderingRaceFinish';
import OrderingRaceIntro from '@/features/games/components/OrderingRaceIntro';
import OrderingRaceTimer from '@/features/games/components/OrderingRaceTimer';
import { useOrderingRace } from '@/features/games/useOrderingRace';
import { formatString } from '@/lib/formatString';
import { useTheme } from '@/lib/useTheme';

type OrderingRaceGameProps = {
  onClose: () => void;
};

export default function OrderingRaceGame({ onClose }: OrderingRaceGameProps) {
  const { theme } = useTheme();
  const game = useOrderingRace();
  const hasContent = game.content.puzzles.length > 0;
  const playing = game.session.status === 'playing';

  return (
    <View style={styles.root}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Pressable
          accessibilityLabel={strings.common.close}
          accessibilityRole="button"
          hitSlop={spacing.md}
          onPress={onClose}
          style={({ pressed }) => [
            styles.close,
            { backgroundColor: pressed ? theme.primarySoft : theme.surface },
          ]}
        >
          <Ionicons name="close" size={spacing.xl} color={theme.textPrimary} />
        </Pressable>
        <Text numberOfLines={1} style={[textStyles.h4, styles.headerTitle, { color: theme.textPrimary }]}>
          {strings.games.orderingRaceTitle}
        </Text>
        {playing ? (
          <View
            accessible
            accessibilityLabel={formatString(strings.a11y.orderingRaceScore, {
              score: game.session.score,
            })}
            style={[styles.scorePill, { backgroundColor: theme.secondarySoft }]}
          >
            <Ionicons name="trophy" size={spacing.lg} color={theme.secondaryStrong} />
            <Text style={[textStyles.labelLarge, { color: theme.textPrimary }]}>
              {game.session.score}
            </Text>
          </View>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {!hasContent ? (
          <View style={styles.empty}>
            <Ionicons name="alert-circle-outline" size={spacing.xxxl} color={theme.error} />
            <Text style={[textStyles.bodyMedium, { color: theme.textSecondary }]}>
              {strings.games.orderingRaceNoContent}
            </Text>
            <Button
              fullWidth
              label={strings.games.orderingRaceBackToLearn}
              onPress={onClose}
              size="large"
            />
          </View>
        ) : game.session.status === 'ready' ? (
          <OrderingRaceIntro
            description={game.content.description}
            onStart={game.start}
            title={game.content.title}
          />
        ) : game.session.status === 'finished' ? (
          <OrderingRaceFinish
            onBack={onClose}
            onRestart={game.start}
            puzzleCount={game.content.puzzles.length}
            session={game.session}
          />
        ) : game.currentPuzzle === null || game.session.deadlineAt === null ? (
          <Text style={[textStyles.bodyMedium, { color: theme.error }]}>
            {strings.games.orderingRaceNoContent}
          </Text>
        ) : (
          <View style={styles.playing}>
            <OrderingRaceTimer deadlineAt={game.session.deadlineAt} onElapsed={game.expire} />
            <Text style={[textStyles.labelMedium, styles.progress, { color: theme.textSecondary }]}>
              {formatString(strings.games.orderingRacePuzzleProgress, {
                current: game.session.puzzleIndex + 1,
                total: game.content.puzzles.length,
              })}
            </Text>
            <OrderingRaceBoard
              onSubmit={game.submit}
              onToggle={game.toggleItem}
              placedIds={game.session.placedIds}
              puzzle={game.currentPuzzle}
              result={game.session.lastResult}
              sessionSeed={game.session.startedAt ?? 0}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    minHeight: layout.minTouchTarget + spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: layout.screenPaddingHorizontal,
    borderBottomWidth: 1,
  },
  close: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: componentRadius.button,
  },
  headerTitle: { flex: 1, textAlign: 'center' },
  headerSpacer: { width: layout.minTouchTarget },
  scorePill: {
    minWidth: layout.minTouchTarget,
    minHeight: layout.minTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: componentRadius.button,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: layout.screenPaddingVertical,
    paddingBottom: layout.sectionGap,
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xl },
  playing: { gap: spacing.lg },
  progress: { textAlign: 'center' },
});
