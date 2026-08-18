import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import type { ColorTheme } from '@/constants/colors';
import { timing } from '@/constants/motion';
import { componentRadius } from '@/constants/radius';
import { spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import { NODE_SIZE } from '@/features/learning/pathLayout';
import { formatString } from '@/lib/formatString';
import { useTheme } from '@/lib/useTheme';

import LevelStars, { MAX_STARS } from './LevelStars';

import type { LevelStatus, StarCount } from '@/types';

type IoniconName = keyof typeof Ionicons.glyphMap;

/** Basılınca inilen ölçek — Button ile aynı, geri bildirim tutarlı olsun diye. */
const PRESS_SCALE = 0.96;

/** Düğüm içindeki ikonun boyutu. Çapın yaklaşık üçte biri. */
const ICON_SIZE = spacing.xxl; // 32

/** "Şu an buradasın" halkasının kalınlığı ve düğümden ayrıldığı boşluk. */
const HALO_WIDTH = spacing.xs; // 4
const HALO_GAP = spacing.xs; // 4

/** Bir durumun görünüşü. */
type NodeAppearance = {
  background: string;
  border: string;
  borderWidth: number;
  icon: IoniconName;
  iconColor: string;
};

/**
 * Durum → görünüş tablosu.
 *
 * ⚠️ **Durumu daire RENGİ taşıyamaz.** Ölçüm: `primary` (#C9306F) ile `success`
 * (#12855C) arasında 1.10:1 var — yani "açık" pembe düğüm ile "tamamlandı"
 * yeşil düğüm neredeyse aynı parlaklıkta. Renk körü biri veya güneş altındaki
 * herkes ikisini ayırt edemez (WCAG 1.4.1).
 *
 * Bu yüzden ayırt edici şey ikonun BİÇİMİ: dolu tik / dolu üçgen / boş üçgen /
 * asma kilit. Dolu-boş ayrımı `available` ile `skipped`'i renkten bağımsız
 * ayırıyor; tamamlanmışlarda ayrıca yıldız var, ikinci renksiz ipucu.
 *
 * `skipped`'in dolgusu OPAK `background` — şeffaf bırakılamaz, çünkü 32px'lik
 * şerit düğümün altından geçiyor ve ikonun içinden akardı.
 *
 * Kilidin rengi `textMuted`, `disabledText` değil: `disabledText` kendi zemini
 * üzerinde 1.97:1 kalıyor ve asma kilit görünmüyor. WCAG pasif öğeleri muaf
 * tutsa da bu projede katı okuma tercih edildi.
 */
function getAppearance(theme: ColorTheme, status: LevelStatus): NodeAppearance {
  const table: Record<LevelStatus, NodeAppearance> = {
    completed: {
      background: theme.success,
      border: theme.success,
      borderWidth: 0,
      icon: 'checkmark',
      iconColor: theme.onSuccess,
    },
    available: {
      background: theme.primary,
      border: theme.primary,
      borderWidth: 0,
      icon: 'play',
      iconColor: theme.onPrimary,
    },
    skipped: {
      background: theme.background,
      border: theme.primary,
      borderWidth: 3,
      icon: 'play-outline',
      iconColor: theme.primary,
    },
    locked: {
      background: theme.disabledBackground,
      border: theme.borderStrong,
      borderWidth: 2,
      icon: 'lock-closed',
      iconColor: theme.textMuted,
    },
  };

  return table[status];
}

/** Ekran okuyucunun okuyacağı tek cümle: "Seviye 3, tamamlandı, 3 yıldızdan 2". */
function buildAccessibilityLabel(
  levelNumber: number,
  status: LevelStatus,
  isCurrent: boolean,
  stars: StarCount,
): string {
  const name = formatString(strings.learn.levelLabel, { number: levelNumber });

  const detail: Record<LevelStatus, string | null> = {
    completed: `${strings.learn.completedLevel}, ${formatString(strings.a11y.levelStars, {
      total: MAX_STARS,
      earned: stars,
    })}`,
    // Seviye tespitinden sonra birden çok seviye açık olabilir; "Şu an
    // buradasın" yalnızca yol sırasındaki İLKİNE ait.
    available: isCurrent ? strings.learn.currentLevel : strings.learn.startLevel,
    skipped: strings.learn.skippedLevel,
    // Kilitli olduğunu işletim sistemi `accessibilityState.disabled` üzerinden
    // kendi dilinde zaten söylüyor; buraya da yazmak anonsu ikiye katlar.
    locked: null,
  };

  const suffix = detail[status];
  return suffix === null ? name : `${name}, ${suffix}`;
}

type LevelNodeProps = {
  /** Ünite içindeki sıra, 1'den başlar. Ekran okuyucuya okunur. */
  levelNumber: number;
  status: LevelStatus;
  /** Yol sırasında açık olan İLK seviye mi. `LevelStatus` değil, türetilmiş bayrak. */
  isCurrent: boolean;
  stars: StarCount;
  onPress: () => void;
};

/**
 * Haritadaki tek bir seviye düğümü: daire buton, altında yıldızlar ya da
 * "Şu an buradasın".
 *
 * Basma animasyonu Button'daki kalıbın aynısı — dıştaki `Pressable` asla
 * ölçeklenmez (hedef daralmasın), içteki `Animated.View` ölçeklenir, hareket
 * azaltma JS tarafında kesilir. Çap 72 > 48 olduğu için `hitSlop` gerekmiyor.
 */
export default function LevelNode({ levelNumber, status, isCurrent, stars, onPress }: LevelNodeProps) {
  const { theme } = useTheme();
  const reduceMotion = useReducedMotion();

  const isLocked = status === 'locked';
  const appearance = getAppearance(theme, status);

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Parmak basılıyken düğüm dışarıdan kilitlenirse `onPressOut` ulaşamıyor ve
  // ölçek 0.96'da takılı kalıyor. (Button'daki aynı koruma.)
  useEffect(() => {
    if (isLocked) {
      scale.value = withTiming(1, timing.pressOut);
    }
  }, [isLocked, scale]);

  function handlePressIn() {
    if (reduceMotion) {
      return;
    }
    scale.value = withTiming(PRESS_SCALE, timing.pressIn);
  }

  function handlePressOut() {
    if (reduceMotion) {
      return;
    }
    scale.value = withTiming(1, timing.pressOut);
  }

  return (
    <View style={styles.column}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={buildAccessibilityLabel(levelNumber, status, isCurrent, stars)}
        accessibilityHint={isLocked ? strings.learn.lockedLevelHint : undefined}
        accessibilityState={{ disabled: isLocked }}
        disabled={isLocked}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View
          style={[
            styles.disc,
            {
              backgroundColor: appearance.background,
              borderColor: appearance.border,
              borderWidth: appearance.borderWidth,
            },
            animatedStyle,
          ]}
        >
          <Ionicons name={appearance.icon} size={ICON_SIZE} color={appearance.iconColor} />

          {/*
            Geçerli düğümün süs halkası. Palet notu `primaryBright`i "seviye
            düğümü" için ayırıyor ama DOLGUSU olacak demiyor: dolgu olsaydı
            üzerindeki ikon iki temanın birinde 3:1'in altına düşerdi.
            Halka olarak kullanmak notu da kontrast kuralını da koruyor.

            Zemin renginde boşlukla ayrılıyor: koyu temada `primaryBright` ile
            `primary` arasında 1.11:1 var, doğrudan bitişik olsalardı halka
            görünmezdi. Yine de halka YALNIZCA süs — bilgiyi aşağıdaki yazı
            taşıyor, o da renkten bağımsız çalışıyor.
          */}
          {isCurrent ? (
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              pointerEvents="none"
              style={[styles.halo, { borderColor: theme.primaryBright }]}
            />
          ) : null}
        </Animated.View>
      </Pressable>

      <View style={styles.caption}>
        {status === 'completed' ? <LevelStars earned={stars} /> : null}

        {isCurrent ? (
          <Text
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[textStyles.labelSmall, { color: theme.primary }]}
          >
            {strings.learn.currentLevel}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    alignItems: 'center',
  },
  disc: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: componentRadius.levelNode,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Diskten dışarı taşan halka. Negatif konum = kalınlık + boşluk.
  halo: {
    position: 'absolute',
    top: -(HALO_WIDTH + HALO_GAP),
    left: -(HALO_WIDTH + HALO_GAP),
    right: -(HALO_WIDTH + HALO_GAP),
    bottom: -(HALO_WIDTH + HALO_GAP),
    borderWidth: HALO_WIDTH,
    borderRadius: componentRadius.levelNode,
  },
  caption: {
    alignItems: 'center',
    marginTop: spacing.xs,
  },
});
