import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { spacing } from '@/constants/spacing';
import { TRAIL_WIDTH } from '@/features/learning/pathLayout';
import { useTheme } from '@/lib/useTheme';

type PathTrailProps = {
  /** Ünite bloğunun ölçüleri. Sayısal olmak ZORUNDA — aşağıdaki nota bak. */
  width: number;
  height: number;
  /** Düğüm aralığı başına bir SVG `d` dizgisi. */
  segments: string[];
};

/**
 * Seviye düğümlerinin arkasından akan kıvrımlı şerit.
 *
 * **Dekoratif.** İnce sarı çizgi, grafit kontur üzerinde akar; durum bilgisini
 * düğüm ikonları, yıldızlar ve ünite ilerleme çubuğu taşır. Yolun iki katmanlı
 * çizilmesi açık kâğıt dokusunda da koyu temada da kenarı kaybetmemesini sağlar.
 *
 * ⚠️ `<Svg>`'ye sayısal `width`/`height` veriliyor, yüzde değil: mutlak
 * konumlu bir görünüm içinde yüzde ölçüsü Android'de güvenilir değil.
 *
 * ⚠️ Bu bileşende Reanimated KULLANILMIYOR. `createAnimatedComponent(Path)` ile
 * `d`/`strokeDashoffset` animasyonu RN 0.81 + Reanimated 4 + worklets 0.5
 * üçlüsünde pürüzlü; şerit zaten durağan.
 */
export default function PathTrail({ width, height, segments }: PathTrailProps) {
  const { theme } = useTheme();

  return (
    <View
      // Şerit düğümlerin ALTINDA duruyor; dokunuşları yutmamalı.
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.layer}
    >
      <Svg width={width} height={height}>
        {segments.map((d, index) => (
          <Path
            key={`outline-${index}`}
            d={d}
            stroke={theme.textPrimary}
            strokeWidth={TRAIL_WIDTH + spacing.xs}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ))}
        {segments.map((d, index) => (
          <Path
            key={`path-${index}`}
            d={d}
            stroke={theme.secondary}
            strokeWidth={TRAIL_WIDTH}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  // Yayılabilen düz nesne. `absoluteFill` bu sürümde kayıtlı stil (bir sayı);
  // spread edilirse sessizce boş nesne verir ve katman konumunu kaybeder.
  layer: {
    ...StyleSheet.absoluteFillObject,
  },
});
