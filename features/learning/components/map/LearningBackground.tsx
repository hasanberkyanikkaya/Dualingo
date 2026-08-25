import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/lib/useTheme';

const PAPER_BACKGROUND = require('@/assets/images/learning/learning-paper-background.png');

/** Kaydırılan yolun arkasında sabit kalan, metinsiz öğrenme illüstrasyonu. */
export default function LearningBackground() {
  const { isDark, theme } = useTheme();

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[styles.layer, { backgroundColor: theme.background }]}
    >
      <Image
        contentFit="cover"
        source={PAPER_BACKGROUND}
        style={[styles.image, isDark ? styles.darkImage : undefined]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  darkImage: {
    opacity: 0.12,
  },
});
