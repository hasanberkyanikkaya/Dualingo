import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';

import { timing } from '@/constants/motion';
import { layout, spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { formatString } from '@/lib/formatString';
import { useTheme } from '@/lib/useTheme';

import type { SharedValue } from 'react-native-reanimated';

/** Kadranın ekranda kaplayabileceği en büyük ölçü. Tablette dev bir daire olmasın diye. */
const MAX_SIZE = 320;
/** Çentikler 30°'de bir: on iki çentik saat kadranı gibi okunuyor, kalabalık yapmıyor. */
const TICK_STEP = 30;

type QiblaDialProps = {
  /** Kıble azimutu (derece). Koordinat geldiğinde sabitlenir, bir daha değişmez. */
  bearing: number;
  /** Biriken pusula açısı. ⚠️ Yüksek frekans — bu bileşenden başkası okumamalı. */
  rotation: SharedValue<number>;
  aligned: boolean;
};

/** Kuzeyden saat yönünde `angle` derecede, merkezden `distance` uzaklıkta nokta. */
function pointAt(center: number, distance: number, angle: number): { x: number; y: number } {
  const radians = (angle * Math.PI) / 180;
  return {
    x: center + distance * Math.sin(radians),
    y: center - distance * Math.cos(radians),
  };
}

/**
 * Dönen kıble kadranı.
 *
 * ⚠️ **SVG ÖZELLİĞİ ANİMASYONLANMIYOR** ve bu tasarım bunu YAPISAL olarak
 * imkânsız kılıyor. `PathTrail.tsx`in çivilediği kural: `createAnimatedComponent`
 * ile SVG özelliği (`d`, `rotation`, `strokeDashoffset`) animasyonu
 * RN 0.81 + Reanimated 4 + worklets 0.5 üçlüsünde pürüzlü. Çözüm katmanları
 * ayırmak: `bearing` bir kez sabitlendiği için içerideki `<Svg>` **tamamen
 * durağan**; dönen tek şey onu saran sıradan bir `Animated.View`.
 *
 * ⚠️ `<Svg>`ye SAYISAL `width`/`height` veriliyor, yüzde değil (aynı dosyanın
 * ikinci kuralı: yüzde ölçüsü Android'de güvenilir değil). Ölçü
 * `useWindowDimensions()`tan geliyor, `onLayout` YOK — ilk karede doğru çiziliyor
 * (2.1'in `pathLayout` disiplini).
 *
 * ⚠️ **Hizalanma RENKLE taşınmıyor**, işaretçi ikonunun BİÇİMİYLE
 * (`caret-down` → `checkmark-circle`). WCAG **1.4.1**'in bu projedeki
 * **onuncu** uygulaması; renk tek başına bırakılsaydı `primary` iki durumda da
 * aynı jeton olurdu ve fark yalnızca boyut/konumda kalırdı.
 *
 * ⚠️ Kâbe işareti BİLGİ taşıyor → WCAG 1.4.11 gereği 3:1 şart → `primary`.
 * `primaryBright` KULLANILMAZ: jetonun tanımı zaten "yalnızca grafik ve ikon,
 * bilgi taşımaz" ve 1.2b'de zemine karşı yetersiz ölçülmüştü.
 *
 * ⚠️ Halka ve çentikler DEKORATİF (`borderStrong`) — hangi yöne bakıldığını
 * anlatan şey Kâbe işareti ile işaretçinin ilişkisi, çentikler değil. 2.1'in
 * "algıda alan önemli" bulgusu gereği çentikler ince çizgi değil, kalın kısa
 * bantlar.
 */
export default function QiblaDial({ bearing, rotation, aligned }: QiblaDialProps) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();

  const size = Math.min(width - layout.screenPaddingHorizontal * 2, MAX_SIZE);
  const center = size / 2;
  const radius = center - spacing.sm;
  const tickInner = radius - spacing.md;
  const letterRadius = radius - spacing.xxl;
  const markerRadius = radius - spacing.lg;

  /*
   * ⚠️ Yumuşatma BURADA, kancada değil: `rotation` ham ölçümü taşıyor ve saf
   * kalmalı. `useDerivedValue` + `withTiming` her yeni ölçümü küçük bir geçişle
   * kovalıyor; sensör gürültüsü bu sayede kadranı titretmiyor.
   *
   * ⚠️ **Hareket azaltma pusulayı DURDURMAZ**, yalnızca ara kareleri keser.
   * Yön bu ekranın tek bilgisi; kesilseydi ekran hiçbir işe yaramazdı.
   * (`ProgressBar`ın "değeri doğrudan ata" kalıbı, `Button`ın "hiç oynatma"sı
   * değil.)
   */
  const smoothed = useDerivedValue(() =>
    reduceMotion ? rotation.value : withTiming(rotation.value, timing.compass),
  );

  const dialStyle = useAnimatedStyle(() => ({
    // Kadran yönün TERSİNE döner: kullanıcı sağa dönünce kuzey solda kalır.
    transform: [{ rotate: `${-smoothed.value}deg` }],
  }));

  const marker = pointAt(center, markerRadius, bearing);

  const cardinals: { label: string; angle: number }[] = [
    { label: 'K', angle: 0 },
    { label: 'D', angle: 90 },
    { label: 'G', angle: 180 },
    { label: 'B', angle: 270 },
  ];

  const ticks: number[] = [];
  for (let angle = 0; angle < 360; angle += TICK_STEP) {
    ticks.push(angle);
  }

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={formatString(strings.a11y.qiblaDial, { derece: Math.round(bearing) })}
      style={[styles.root, { width: size, height: size }]}
    >
      <Animated.View style={dialStyle}>
        <Svg width={size} height={size}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={theme.borderStrong}
            strokeWidth={spacing.xs / 2}
            fill="none"
          />

          {ticks.map((angle) => {
            const outer = pointAt(center, radius, angle);
            const inner = pointAt(center, tickInner, angle);

            return (
              <Line
                key={angle}
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke={theme.borderStrong}
                strokeWidth={spacing.xs}
                strokeLinecap="round"
              />
            );
          })}

          {cardinals.map(({ label, angle }) => {
            const at = pointAt(center, letterRadius, angle);

            return (
              <SvgText
                key={label}
                x={at.x}
                y={at.y}
                fill={theme.textSecondary}
                fontSize={spacing.lg}
                textAnchor="middle"
                // SVG metni taban çizgisine oturur; harfi noktada ortalamak için kaydırılıyor.
                dy={spacing.sm / 2}
              >
                {label}
              </SvgText>
            );
          })}

          {/* Kâbe iğnesi: merkezden işarete uzanan çizgi + uçtaki dolu daire. */}
          <Line
            x1={center}
            y1={center}
            x2={marker.x}
            y2={marker.y}
            stroke={theme.primary}
            strokeWidth={spacing.xs}
            strokeLinecap="round"
          />
          <Circle cx={marker.x} cy={marker.y} r={spacing.md} fill={theme.primary} />
          <Circle cx={center} cy={center} r={spacing.xs} fill={theme.primary} />
        </Svg>
      </Animated.View>

      {/*
        Sabit işaretçi — kadranla birlikte DÖNMEZ. Telefonun burnunu temsil
        ediyor; Kâbe iğnesi buraya geldiğinde hizalanma olur.
        Ekran okuyucudan gizli: durumu zaten kabın etiketi ve `aligned`
        değişiminde yapılan tek seferlik anons taşıyor.
      */}
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.pointer}>
        <Ionicons
          name={aligned ? 'checkmark-circle' : 'caret-down'}
          size={spacing.xl}
          color={theme.primary}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Mutlak konumda `alignSelf` yerine iki kenardan gerilip ortalanıyor:
  // `alignSelf` mutlak çocukta platforma göre farklı davranabiliyor.
  pointer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
