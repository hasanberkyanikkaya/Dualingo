import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
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
import { spacing } from '@/constants/spacing';
import { textStyles } from '@/constants/typography';
import { resolveImage } from '@/features/learning/imageRegistry';
import { useTheme } from '@/lib/useTheme';

import type { ImageRef } from '@/types';

const PRESS_SCALE = 0.98;
const PLACEHOLDER_ICON_SIZE = spacing.xxl; // 32

type ImageTileProps = {
  image: ImageRef;
  selected: boolean;
  onPress: () => void;
  /** Eşleşme numarası — eşleşmemişse verilmez */
  badge?: number;
  disabled?: boolean;
};

/**
 * Görsel eşleştirmenin kare kutusu. Görsel varsa onu, yoksa `ImageRef.alt`
 * açıklamasını gösterir.
 *
 * ⚠️ Yer tutucu bir uzlaşma DEĞİL: `alt`, ekran okuyucu kullanan birinin zaten
 * aldığı tek kanal — tipte zorunlu olmasının sebebi bu. Görsel gelene kadar
 * herkes o kanalı görüyor. "Görseli metinle eşleştir" görevinin metin-metin
 * eşleştirmeye dönmesi bir kod sorunu değil, `alt`'ın betimleyici yazılması
 * gereken bir içerik sorunu.
 *
 * ⚠️ Yer tutucu **şeffaf dolgulu**, gri değil. Ölçüm: `borderControl`'ün
 * `surfaceAlt` üzerindeki oranı 3.30 açık / **2.85 koyu** — koyu temada 3:1'in
 * altında. Dolgu konmayınca kenarlığın komşusu sayfa zemini oluyor
 * (3.64 / 3.46 ✓) ve kenar durumu tartışılmadan ortadan kalkıyor.
 * Genel kural: `surfaceAlt` bu palette dekoratif bir dolgudur, hiçbir zaman
 * bir dokunma göstergesi taşıyamaz.
 */
export default function ImageTile({
  image,
  selected,
  onPress,
  badge,
  disabled = false,
}: ImageTileProps) {
  const { theme } = useTheme();
  const reduceMotion = useReducedMotion();

  const source = resolveImage(image.key);
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
      accessibilityRole="button"
      accessibilityLabel={image.alt}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.pressable}
    >
      <Animated.View
        style={[
          styles.tile,
          { borderColor: selected || badge !== undefined ? theme.primary : theme.borderControl },
          animatedStyle,
        ]}
      >
        {source !== null ? (
          <Image source={source} style={styles.image} contentFit="cover" alt={image.alt} />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="image-outline" size={PLACEHOLDER_ICON_SIZE} color={theme.textMuted} />
            <Text
              style={[textStyles.bodySmall, styles.placeholderText, { color: theme.textSecondary }]}
            >
              {image.alt}
            </Text>
          </View>
        )}

        {badge !== undefined ? (
          <View
            // Numara etikette de geçiyor; ayrıca okunursa anons ikiye katlanır.
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[styles.badge, { backgroundColor: theme.primary }]}
          >
            <Text style={[textStyles.labelSmall, { color: theme.onPrimary }]}>{badge}</Text>
          </View>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Yüzde genişlik — `onLayout` ölçümü yok (pathLayout'un emsali).
  pressable: {
    flexBasis: '48%',
    flexGrow: 0,
  },
  tile: {
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    borderWidth: 2,
    borderRadius: componentRadius.card,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  placeholderText: {
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    minWidth: spacing.xl,
    height: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: componentRadius.chip,
  },
});
