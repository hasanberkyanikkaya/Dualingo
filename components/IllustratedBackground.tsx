import { Image, type ImageProps } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/lib/useTheme';

type IllustratedBackgroundProps = {
  source: ImageProps['source'];
};

/** Tam görseli kırpmadan ekrana sığdıran ortak illüstrasyon zemini. */
export default function IllustratedBackground({ source }: IllustratedBackgroundProps) {
  const { isDark, theme } = useTheme();

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.background }]}
    >
      <Image
        contentFit="contain"
        source={source}
        style={[styles.image, isDark ? styles.darkImage : undefined]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', height: '100%' },
  darkImage: { opacity: 0.14 },
});
