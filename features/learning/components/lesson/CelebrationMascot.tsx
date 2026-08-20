import { Image } from 'expo-image';
import LottieView from 'lottie-react-native';
import { useEffect, type ComponentProps } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { timing } from '@/constants/motion';

const MASCOT_SIZE = 160;

/** Belirmeye başladığı ölçek. Yıldızlardan yumuşak — maskot patlamıyor, geliyor. */
const ENTER_FROM_SCALE = 0.85;

/**
 * Kutlama animasyonunun kaynağı.
 *
 * ⚠️ **BUGÜN BİLEREK `null`.** Lottie dosyası henüz yok ve var olmayan bir yola
 * `require` yazmak çalışma anı `null`'ı DEĞİL, **Metro derleme hatası** verir —
 * `imageRegistry.ts`'i boş bırakan mayının aynısı.
 *
 * Dosya geldiği gün yapılacak TEK değişiklik burası:
 *
 *     const CELEBRATION_SOURCE = require('@/assets/animations/celebration.json');
 *
 * Çağrı yeri (`LessonCompleteScreen`) değişmez, yedeğe düşen dal kendiliğinden
 * devre dışı kalır.
 *
 * `lottie-react-native` Expo Go'nun paketli yerel modüllerinden
 * (`expo/bundledNativeModules.json`), dev build gerektirmiyor.
 */
const CELEBRATION_SOURCE: ComponentProps<typeof LottieView>['source'] | null = null;

type CelebrationMascotProps = {
  /**
   * Sahne oynasın mı. `false` ise öğe son hâlinde, hareketsiz çizilir —
   * kaldırılmaz: ekran düzeni kutlamalı ve kutlamasız koşuda aynı kalmalı.
   */
  animate: boolean;
};

/**
 * Ders sonu kutlama slotu — maskot ya da (dosya geldiğinde) Lottie sahnesi.
 *
 * Tamamen dekoratif: ekran okuyucuya "Ders tamamlandı" başlığı, yıldız sayısı ve
 * XP zaten söyleniyor. Süs bir öğe için dördüncü bir durak açmak, kutlamayı
 * ekran okuyucu kullanıcısı için yavaşlatmak olurdu. (`WelcomeStep`teki maskot
 * ve `LevelStars` aynı kararı veriyor.)
 */
export default function CelebrationMascot({ animate }: CelebrationMascotProps) {
  const reduceMotion = useReducedMotion();
  const shouldAnimate = animate && !reduceMotion;

  const progress = useSharedValue(shouldAnimate ? 0 : 1);

  useEffect(() => {
    if (!shouldAnimate) {
      progress.value = 1;
      return;
    }
    progress.value = withTiming(1, timing.celebrate);
  }, [shouldAnimate, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: ENTER_FROM_SCALE + (1 - ENTER_FROM_SCALE) * progress.value }],
  }));

  return (
    <Animated.View
      style={[styles.slot, animatedStyle]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {CELEBRATION_SOURCE === null ? (
        <Image
          source={require('@/assets/images/mascot.png')}
          style={styles.media}
          contentFit="contain"
        />
      ) : (
        // ⚠️ `loop={false}`: kutlama biter ve ekran durulur. Dönüp duran bir
        // animasyon, altındaki hata listesini okumaya çalışan gözü rahatsız eder.
        // ⚠️ Oynatılmadığı durumda `progress={1}` ile SON kare gösteriliyor,
        // sahne başlatılmıyor: ilk kare çoğu Lottie dosyasında boştur ve slot
        // sessizce bomboş kalırdı.
        <LottieView
          source={CELEBRATION_SOURCE}
          style={styles.media}
          autoPlay={shouldAnimate}
          progress={shouldAnimate ? undefined : 1}
          loop={false}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  slot: {
    alignSelf: 'center',
  },
  media: {
    width: MASCOT_SIZE,
    height: MASCOT_SIZE,
  },
});
