import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

import { sequence, timing } from '@/constants/motion';
import { spacing } from '@/constants/spacing';
import { useTheme } from '@/lib/useTheme';

import type { StarCount } from '@/types';

/** Bir seviyeden kazanılabilecek en çok yıldız. `StarCount` ile aynı üst sınır. */
export const MAX_STARS = 3;

const STAR_SIZE = spacing.lg; // 16

/** Belirmeye başladığı ölçek. Küçükten büyür, `Easing.back` sonunda hafif taşar. */
const POP_FROM_SCALE = 0.4;

type LevelStarsProps = {
  /** Kazanılan yıldız. Boş yuvalar da çizilir — "3 üzerinden kaç" okunsun diye. */
  earned: StarCount;
  /** Yıldız boyutu. Haritada varsayılan 16; ders sonu ekranı büyütüyor. */
  size?: number;
  /**
   * Kazanılan yıldızlar sırayla belirsin mi (ders sonu kutlaması).
   *
   * ⚠️ Varsayılan `false` — haritadaki `LevelNode` davranışsal olarak hiç
   * değişmiyor. Harita kaydırıldıkça düğümler yeniden çizilir ve her çizimde
   * patlayan yıldızlar liste boyunca gürültü olurdu.
   */
  animateIn?: boolean;
};

/**
 * Tamamlanmış seviyenin altındaki yıldız satırı.
 *
 * Dekoratif: ekran okuyucudan gizli, çünkü aynı bilgi düğümün kendi
 * erişilebilirlik etiketinde zaten geçiyor. Ayrı okunsa seviye başına üç
 * fazladan durak oluşurdu.
 *
 * Renkler:
 * - Dolu yıldız `secondaryStrong`. Maskotun sarısı (`secondary`) beyaz zemine
 *   karşı 1.58:1 kalıyor; yıldız sayısı kazanılan puanı anlattığı için, yani
 *   BİLGİ taşıdığı için WCAG 1.4.11'in 3:1 eşiği geçerli. `secondaryStrong`
 *   3.69:1 (açık) / 11.63:1 (koyu) veriyor. ProgressBar'daki gerekçenin aynısı.
 * - Boş yıldız `textDisabled`. `textMuted` (5.30:1) denendi ve elendi: kazanılan
 *   yıldızdan (3.69:1) daha gür çıkıyor, hiyerarşi ters dönüyordu.
 */
export default function LevelStars({
  earned,
  size = STAR_SIZE,
  animateIn = false,
}: LevelStarsProps) {
  const { theme } = useTheme();

  return (
    <View
      style={styles.row}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {Array.from({ length: MAX_STARS }, (_, index) => {
        const isEarned = index < earned;
        return (
          <Star
            key={index}
            index={index}
            size={size}
            // Boş yıldız hiçbir zaman animasyonlanmaz: kazanılmayan bir şeyin
            // belirmesi kutlama değil, yanlış vaat olurdu.
            animateIn={animateIn && isEarned}
            name={isEarned ? 'star' : 'star-outline'}
            color={isEarned ? theme.secondaryStrong : theme.textDisabled}
          />
        );
      })}
    </View>
  );
}

type StarProps = {
  index: number;
  size: number;
  animateIn: boolean;
  name: 'star' | 'star-outline';
  color: string;
};

/**
 * Tek yıldız.
 *
 * ⚠️ **Ayrı bir bileşen olmasının sebebi kanca kuralı**: her yıldızın kendi
 * paylaşılan değeri var ve kancalar `.map` içinde çağrılamaz.
 *
 * ⚠️ **Düzen kaymaz.** Dolu ve boş ikon aynı ölçüyü kaplıyor; animasyon sırasında
 * yuva boş görünür ama yerini korur, satır kıpırdamaz. (`Button`ın "yükleniyorken
 * etiket sökülmez, `opacity: 0` ile durur" kararının aynı sınıfı.)
 */
function Star({ index, size, animateIn, name, color }: StarProps) {
  const reduceMotion = useReducedMotion();
  // Animasyon istenmiyorsa paylaşılan değer doğrudan son hâlinde başlar —
  // ilk kare bile ara bir durum göstermez.
  const shouldAnimate = animateIn && !reduceMotion;

  const progress = useSharedValue(shouldAnimate ? 0 : 1);

  useEffect(() => {
    if (!shouldAnimate) {
      progress.value = 1;
      return;
    }
    progress.value = withDelay(index * sequence.starStagger, withTiming(1, timing.celebrate));
  }, [shouldAnimate, index, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: POP_FROM_SCALE + (1 - POP_FROM_SCALE) * progress.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons name={name} size={size} color={color} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
});
