import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Pattern,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import { quranTheme } from '@/constants/quranTheme';

type QuranNightBackgroundProps = {
  children: ReactNode;
};

/** Referanstaki gece atmosferini ağ veya bitmap gerektirmeden çizen vektör zemin. */
export default function QuranNightBackground({ children }: QuranNightBackgroundProps) {
  return (
    <View style={styles.root}>
      <Svg
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        pointerEvents="none"
        preserveAspectRatio="xMidYMid slice"
        style={StyleSheet.absoluteFillObject}
        viewBox="0 0 400 900"
      >
        <Defs>
          <LinearGradient id="night" x1="0" y1="0" x2="0.85" y2="1">
            <Stop offset="0" stopColor={quranTheme.backgroundTop} />
            <Stop offset="1" stopColor={quranTheme.backgroundBottom} />
          </LinearGradient>
          <RadialGradient id="glow" cx="18%" cy="12%" rx="80%" ry="65%">
            <Stop offset="0" stopColor={quranTheme.backgroundGlow} stopOpacity={0.62} />
            <Stop offset="1" stopColor={quranTheme.backgroundGlow} stopOpacity={0} />
          </RadialGradient>
          <Pattern id="stars" width="72" height="72" patternUnits="userSpaceOnUse">
            <Circle cx="12" cy="18" r="1.2" fill={quranTheme.pattern} opacity={0.24} />
            <Circle cx="54" cy="58" r="0.8" fill={quranTheme.pattern} opacity={0.2} />
            <Path
              d="M46 13l1.8 4.2L52 19l-4.2 1.8L46 25l-1.8-4.2L40 19l4.2-1.8z"
              fill={quranTheme.pattern}
              opacity={0.14}
            />
            <Path
              d="M18 49l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1z"
              fill={quranTheme.pattern}
              opacity={0.18}
            />
          </Pattern>
        </Defs>
        <Rect width="400" height="900" fill="url(#night)" />
        <Rect width="400" height="900" fill="url(#glow)" />
        <Rect width="400" height="900" fill="url(#stars)" />
      </Svg>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: quranTheme.backgroundBottom,
  },
});

