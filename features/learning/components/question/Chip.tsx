import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { timing } from '@/constants/motion';
import { componentRadius } from '@/constants/radius';
import { layout, spacing } from '@/constants/spacing';
import { textStyles } from '@/constants/typography';
import { useTheme } from '@/lib/useTheme';

/** OptionCard ile aynı — çip de tam genişlik olmasa da aynı ailenin parçası. */
const PRESS_SCALE = 0.98;

/**
 * Görünen yükseklik 40, `hitSlop` ile etkin 48'e tamamlanıyor.
 * Button'ın `small` boyutundaki aritmetiğin aynısı: gerçek 48px'lik çipler
 * sarmalı bir satırda çok iri duruyor.
 */
const CHIP_HEIGHT = layout.minTouchTarget - spacing.sm; // 40
const HIT_SLOP = spacing.xs; // 4

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  /**
   * Sıra numarası (sıralama sorusu) ya da eşleşme numarası (görsel eşleştirme).
   * Verilmezse çizilmez.
   */
  badge?: number;
  disabled?: boolean;
  /** Ekran okuyucu etiketi — verilmezse `label` okunur */
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

/**
 * Küçük, dokunulabilir hap. Üç yerde kullanılıyor: sıralama çipleri, kelime
 * havuzu çipleri, görsel eşleştirmenin metin listesi.
 *
 * `OptionCard`'ın kardeşi ve aynı renk kurallarını izliyor: sınırı
 * `borderControl` kenarlığı taşıyor (zemine 3.64 açık / 3.46 koyu), dolgu
 * taşımıyor — açık temada `surface` ile `background` aynı renk.
 *
 * ⚠️ `badge` süs değil. Sıralamada 5 öğe + büyük yazı boyutunda satır sarıyor ve
 * okuma sırası gözle belirsizleşiyor; eşleştirmede dört eşzamanlı eşleşmeyi
 * renk ayıramıyor (`primary`/`success` 1.10:1). İki durumda da bilgiyi taşıyan
 * şey numaranın kendisi.
 */
export default function Chip({
  label,
  selected,
  onPress,
  badge,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
}: ChipProps) {
  const { theme } = useTheme();
  const reduceMotion = useReducedMotion();

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    if (disabled) {
      scale.value = withTiming(1, timing.pressOut);
    }
  }, [disabled, scale]);

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
    <Pressable
      // `button`, `radio` değil: çipler arasında "işaretli" olan bir şey yok,
      // dokunmak öğeyi bir yerden bir yere taşıyor.
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={{ top: HIT_SLOP, bottom: HIT_SLOP }}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {({ pressed }) => (
        <Animated.View
          style={[
            styles.chip,
            {
              backgroundColor: selected || pressed ? theme.primarySoft : theme.surface,
              borderColor: selected ? theme.primary : theme.borderControl,
            },
            animatedStyle,
          ]}
        >
          {badge !== undefined ? (
            <View
              // Numara etikette zaten geçiyor; ayrıca okunursa anons ikiye katlanır.
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={[styles.badge, { borderColor: theme.primary }]}
            >
              <Text style={[textStyles.labelSmall, { color: theme.primary }]}>{badge}</Text>
            </View>
          ) : null}

          <Text style={[textStyles.bodyMedium, { color: theme.textPrimary }]}>{label}</Text>
        </Animated.View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    // `height` değil `minHeight`: OS yazı boyutu büyüyünce çip büyür.
    minHeight: CHIP_HEIGHT,
    borderRadius: componentRadius.chip,
    borderWidth: 2,
  },
  badge: {
    minWidth: spacing.xl,
    height: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: componentRadius.chip,
    borderWidth: 1,
  },
});
