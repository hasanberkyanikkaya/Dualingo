import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

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
 * **Dekoratif.** Baştan sona tek renk, hiçbir durum bilgisi taşımıyor:
 * ilerlemeyi düğüm ikonları ve ünite başlığındaki ilerleme çubuğu anlatıyor.
 * Bu yüzden WCAG 1.4.11'in 3:1 eşiği geçerli değil.
 *
 * Rengi `borderStrong`; beyaz zemine karşı 1.52:1 (koyu temada 1.69:1). Düşük
 * ve bilinçli. `border` (1.27:1) denendi ve elendi — 32px kalınlıkta bile
 * görünmüyor. Algıda ALAN çok şey değiştiriyor: 1.5:1'de 32px'lik bir bant
 * görünür bir pembelik, aynı orandaki 1px'lik çizgi hiçbir şey.
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
            key={index}
            d={d}
            stroke={theme.borderStrong}
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
