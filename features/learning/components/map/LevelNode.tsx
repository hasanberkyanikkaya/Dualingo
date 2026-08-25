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
 * Durumu yalnız daire rengi taşımaz. Ayırt edici şey ikonun BİÇİMİ: tik / dolu üçgen / boş üçgen /
 * asma kilit. Dolu-boş ayrımı `available` ile `skipped`'i renkten bağımsız
 * ayırır; tamamlanmışlarda ayrıca yıldız, geçerli seviyede bayrak vardır.
 *
 * `skipped` dolgusu opaktır; şeffaf bırakılsaydı ince yol ikonun içinden geçerdi.
 * Kilit de görünür `textMuted` tonu ve ayrı kilit biçimiyle gösterilir.
 */
function getAppearance(theme: ColorTheme, status: LevelStatus): NodeAppearance {
  const table: Record<LevelStatus, NodeAppearance> = {
    completed: {
      background: theme.secondary,
      border: theme.textPrimary,
      borderWidth: 2,
      icon: 'checkmark',
      iconColor: theme.textPrimary,
    },
    available: {
      background: theme.primaryBright,
      border: theme.textPrimary,
      borderWidth: 3,
      icon: 'play',
      iconColor: theme.textPrimary,
    },
    skipped: {
      background: theme.surface,
      border: theme.textPrimary,
      borderWidth: 2,
      icon: 'play-outline',
      iconColor: theme.textPrimary,
    },
    locked: {
      background: theme.disabledBackground,
      border: theme.textMuted,
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
          style={[styles.sticker, animatedStyle]}
        >
          <View style={[styles.shadowPlate, { backgroundColor: theme.textPrimary }]} />
          <View
            style={[
              styles.disc,
              {
                backgroundColor: appearance.background,
                borderColor: appearance.border,
                borderWidth: appearance.borderWidth,
              },
            ]}
          >
            <Ionicons name={appearance.icon} size={ICON_SIZE} color={appearance.iconColor} />
          </View>

          {isCurrent ? (
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              pointerEvents="none"
              style={[
                styles.flag,
                { backgroundColor: theme.secondary, borderColor: theme.textPrimary },
              ]}
            >
              <Ionicons name="flag" size={spacing.lg} color={theme.textPrimary} />
            </View>
          ) : null}
        </Animated.View>
      </Pressable>

      <View style={styles.caption}>
        {status === 'completed' ? <LevelStars earned={stars} /> : null}

        {isCurrent ? (
          <Text
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[textStyles.labelSmall, { color: theme.textPrimary }]}
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
  sticker: {
    width: NODE_SIZE,
    height: NODE_SIZE,
  },
  shadowPlate: {
    position: 'absolute',
    top: spacing.xs,
    left: 0,
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: componentRadius.levelNode,
  },
  disc: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: componentRadius.levelNode,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flag: {
    position: 'absolute',
    top: -spacing.sm,
    right: -spacing.sm,
    width: spacing.xxl,
    height: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: componentRadius.chip,
  },
  caption: {
    alignItems: 'center',
    marginTop: spacing.xs,
  },
});
