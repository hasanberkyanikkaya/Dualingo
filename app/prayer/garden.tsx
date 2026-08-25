import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ProgressBar from '@/components/ProgressBar';
import ScreenHeader from '@/components/ScreenHeader';
import { componentRadius } from '@/constants/radius';
import { layout, spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import GardenScene from '@/features/prayer/components/GardenScene';
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
      style={[styles.root, { backgroundColor: theme.background }]}
    >
      <Stack.Screen options={{ title: strings.prayer.gardenTitle }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={strings.a11y.closeButton}
          hitSlop={spacing.md}
          onPress={() => router.back()}
          style={styles.close}
        >
          <Ionicons name="close" size={spacing.xl} color={theme.textMuted} />
        </Pressable>

        <ScreenHeader title={strings.prayer.gardenTitle} subtitle={STAGE_LABELS[progress.stage]} />
        <GardenScene progress={progress} />

        <View style={styles.progressBlock}>
          <View style={styles.progressHeading}>
            <Text style={[textStyles.labelLarge, { color: theme.textPrimary }]}> 
              {STAGE_LABELS[progress.stage]}
            </Text>
            <Text style={[textStyles.labelMedium, { color: theme.textSecondary }]}> 
              %{progress.progressPercent}
            </Text>
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
          <StatCard value={progress.totalPrayers} label={strings.prayer.gardenPrayerCount} />
          <StatCard value={progress.activeDays} label={strings.prayer.gardenDayCount} />
        </View>

        <View style={[styles.info, { backgroundColor: theme.successSoft }]}> 
          <Ionicons name="leaf-outline" size={spacing.xl} color={theme.success} />
          <Text style={[textStyles.bodyMedium, styles.infoText, { color: theme.textPrimary }]}> 
            {strings.prayer.gardenBody}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ value, label }: { value: number; label: string }) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.statCard,
        { backgroundColor: theme.surface, borderColor: theme.borderControl },
      ]}
    >
      <Text style={[textStyles.h2, { color: theme.textPrimary }]}>{value}</Text>
      <Text style={[textStyles.bodySmall, styles.statLabel, { color: theme.textSecondary }]}> 
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    gap: layout.listGap,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: layout.screenPaddingVertical,
    paddingBottom: layout.sectionGap,
  },
  close: { alignSelf: 'flex-start' },
  progressBlock: { gap: spacing.sm },
  progressHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statsRow: { flexDirection: 'row', gap: spacing.md },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    padding: layout.cardPadding,
    borderWidth: 1,
    borderRadius: componentRadius.card,
  },
  statLabel: { textAlign: 'center' },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: layout.cardPadding,
    borderRadius: componentRadius.card,
  },
  infoText: { flex: 1 },
});
