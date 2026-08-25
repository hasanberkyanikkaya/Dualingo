import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { componentRadius } from '@/constants/radius';
import { spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import { formatString } from '@/lib/formatString';
import { useTheme } from '@/lib/useTheme';

import type { GardenStage } from '@/features/prayer/prayerGarden';

type GardenStageRailProps = {
  stageIndex: number;
  stage: GardenStage;
};

const STAGE_LABELS: Record<GardenStage, string> = {
  start: strings.prayer.gardenStageStart,
  sprout: strings.prayer.gardenStageSprout,
  growing: strings.prayer.gardenStageGrowing,
  blooming: strings.prayer.gardenStageBlooming,
  flourishing: strings.prayer.gardenStageFlourishing,
};

const STAGES: readonly GardenStage[] = [
  'start',
  'sprout',
  'growing',
  'blooming',
  'flourishing',
];

/** Bahçenin beş aşamalı büyüme yolunu görünür kılar. */
export default function GardenStageRail({ stageIndex, stage }: GardenStageRailProps) {
  const { theme } = useTheme();
  const currentStep = Math.min(STAGES.length, Math.max(1, stageIndex + 1));

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={strings.prayer.gardenJourneyTitle}
      accessibilityValue={{ min: 1, max: STAGES.length, now: currentStep }}
      style={styles.root}
    >
      <View style={styles.heading}>
        <Text style={[textStyles.labelLarge, { color: theme.textPrimary }]}> 
          {strings.prayer.gardenJourneyTitle}
        </Text>
        <Text style={[textStyles.labelMedium, { color: theme.textSecondary }]}> 
          {formatString(strings.prayer.gardenStageProgress, {
            current: currentStep,
            total: STAGES.length,
          })}
        </Text>
      </View>

      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.track}
      >
        {STAGES.map((item, index) => {
          const completed = index < stageIndex;
          const current = index === stageIndex;
          return (
            <View
              key={item}
              style={[styles.step, index === STAGES.length - 1 ? styles.lastStep : undefined]}
            >
              <View
                style={[
                  styles.node,
                  {
                    backgroundColor: completed
                      ? theme.success
                      : current
                        ? theme.secondary
                        : theme.surfaceAlt,
                    borderColor: current ? theme.secondaryStrong : theme.borderControl,
                  },
                ]}
              >
                <Ionicons
                  name={completed ? 'checkmark' : current ? 'leaf' : 'ellipse-outline'}
                  size={spacing.lg}
                  color={completed ? theme.onSuccess : theme.textPrimary}
                />
              </View>
              {index === STAGES.length - 1 ? null : (
                <View
                  style={[
                    styles.line,
                    { backgroundColor: index < stageIndex ? theme.success : theme.borderStrong },
                  ]}
                />
              )}
            </View>
          );
        })}
      </View>

      <Text style={[textStyles.bodySmall, styles.stageLabel, { color: theme.textSecondary }]}> 
        {STAGE_LABELS[stage]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.sm },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  track: { flexDirection: 'row', alignItems: 'center' },
  step: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  lastStep: { flex: 0 },
  node: {
    width: spacing.xxl,
    height: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: componentRadius.button,
  },
  line: { flex: 1, height: spacing.xs },
  stageLabel: { textAlign: 'center' },
});
