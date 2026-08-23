import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { timing } from '@/constants/motion';
import { quranTheme } from '@/constants/quranTheme';
import { componentRadius } from '@/constants/radius';
import { spacing } from '@/constants/spacing';

type QuranProgressBarProps = {
  ratio: number;
  accessibilityLabel: string;
};

function clamp(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return value >= 1 ? 1 : value;
}

export default function QuranProgressBar({ ratio, accessibilityLabel }: QuranProgressBarProps) {
  const safeRatio = clamp(ratio);
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(safeRatio);

  useEffect(() => {
    progress.value = reduceMotion ? safeRatio : withTiming(safeRatio, timing.progress);
  }, [progress, reduceMotion, safeRatio]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(safeRatio * 100) }}
      style={styles.track}
    >
      <Animated.View style={[styles.fill, fillStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: spacing.md,
    overflow: 'hidden',
    borderRadius: componentRadius.progressBar,
    backgroundColor: quranTheme.glassBorder,
  },
  fill: {
    height: '100%',
    borderRadius: componentRadius.progressBar,
    backgroundColor: quranTheme.accent,
  },
});
