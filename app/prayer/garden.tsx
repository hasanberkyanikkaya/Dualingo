import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ProgressBar from '@/components/ProgressBar';
import { componentRadius } from '@/constants/radius';
import { layout, spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import GardenScene from '@/features/prayer/components/GardenScene';
import GardenStageRail from '@/features/prayer/components/GardenStageRail';
import GardenStatCard from '@/features/prayer/components/GardenStatCard';
import { calculateGardenProgress } from '@/features/prayer/prayerGarden';
import { readPrayerGardenStats } from '@/features/prayer/prayerGardenDb';
import { formatString } from '@/lib/formatString';
import { useTheme } from '@/lib/useTheme';

import type { GardenStage } from '@/features/prayer/prayerGarden';

const STAGE_LABELS: Record<GardenStage, string> = {
  start: strings.prayer.gardenStageStart,
  sprout: strings.prayer.gardenStageSprout,
  growing: strings.prayer.gardenStageGrowing,
  blooming: strings.prayer.gardenStageBlooming,
  flourishing: strings.prayer.gardenStageFlourishing,
};

export default function PrayerGardenScreen() {
  const { theme } = useTheme();
  const [stats, setStats] = useState(() => readPrayerGardenStats());

  useFocusEffect(
    useCallback(() => {
      setStats(readPrayerGardenStats());
    }, []),
  );

  const progress = calculateGardenProgress(stats.totalPrayers, stats.activeDays);
  const current = progress.growthPoints - progress.currentThreshold;
  const total =
    progress.nextThreshold === null ? 1 : progress.nextThreshold - progress.currentThreshold;

  return (
    <SafeAreaView
      edges={['top', 'bottom', 'left', 'right']}
      style={[styles.root, { backgroundColor: theme.successSoft }]}
    >
      <Stack.Screen options={{ title: strings.prayer.gardenTitle }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={strings.a11y.closeButton}
            hitSlop={spacing.md}
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.close,
              { backgroundColor: pressed ? theme.secondarySoft : theme.surface },
            ]}
          >
            <Ionicons name="close" size={spacing.xl} color={theme.textPrimary} />
          </Pressable>
          <View style={styles.titleCopy}>
            <Text accessibilityRole="header" style={[textStyles.h2, { color: theme.textPrimary }]}>
              {strings.prayer.gardenTitle}
            </Text>
            <Text style={[textStyles.bodySmall, { color: theme.textSecondary }]}>
              {STAGE_LABELS[progress.stage]}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.hero,
            theme.elevation.raised,
            { backgroundColor: theme.surface, borderColor: theme.borderStrong },
          ]}
        >
          <GardenScene progress={progress} />
          <GardenStageRail stage={progress.stage} stageIndex={progress.stageIndex} />
        </View>

        <View
          style={[
            styles.progressCard,
            theme.elevation.card,
            { backgroundColor: theme.surface, borderColor: theme.borderStrong },
          ]}
        >
          <View style={styles.progressHeading}>
            <View style={[styles.progressIcon, { backgroundColor: theme.secondarySoft }]}>
              <Ionicons name="leaf" size={spacing.xl} color={theme.success} />
            </View>
            <View style={styles.progressCopy}>
              <Text style={[textStyles.labelLarge, { color: theme.textPrimary }]}>
                {strings.prayer.gardenProgress}
              </Text>
              <Text style={[textStyles.labelMedium, { color: theme.textSecondary }]}>
                %{progress.progressPercent}
              </Text>
            </View>
          </View>
          <ProgressBar
            current={progress.nextThreshold === null ? 1 : current}
            total={total}
            variant="success"
            accessibilityLabel={strings.prayer.gardenProgress}
          />
          <Text style={[textStyles.bodySmall, { color: theme.textSecondary }]}> 
            {progress.nextThreshold === null
              ? strings.prayer.gardenFinalStage
              : formatString(strings.prayer.gardenNextStage, {
                  sayi: progress.nextThreshold - progress.growthPoints,
                })}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <GardenStatCard
            icon="checkmark-circle"
            value={progress.totalPrayers}
            label={strings.prayer.gardenPrayerCount}
          />
          <GardenStatCard
            icon="calendar"
            value={progress.activeDays}
            label={strings.prayer.gardenDayCount}
          />
        </View>

        <View
          style={[
            styles.info,
            { backgroundColor: theme.secondarySoft, borderColor: theme.secondaryStrong },
          ]}
        >
          <View style={[styles.infoIcon, { backgroundColor: theme.surface }]}>
            <Ionicons name="sparkles" size={spacing.xl} color={theme.secondaryStrong} />
          </View>
          <Text style={[textStyles.bodyMedium, styles.infoText, { color: theme.textPrimary }]}> 
            {strings.prayer.gardenBody}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    gap: spacing.lg,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: layout.screenPaddingVertical,
    paddingBottom: layout.sectionGap,
  },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  close: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: componentRadius.button,
  },
  titleCopy: { flex: 1, gap: spacing.xs },
  hero: {
    gap: spacing.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderRadius: componentRadius.modal,
  },
  progressCard: {
    gap: spacing.md,
    padding: layout.cardPadding,
    borderWidth: 1,
    borderRadius: componentRadius.card,
  },
  progressHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  progressIcon: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: componentRadius.button,
  },
  progressCopy: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statsRow: { flexDirection: 'row', gap: spacing.md },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: layout.cardPadding,
    borderWidth: 1,
    borderRadius: componentRadius.card,
  },
  infoIcon: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: componentRadius.button,
  },
  infoText: { flex: 1 },
});
