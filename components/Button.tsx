import { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import type { ColorTheme } from '@/constants/colors';
import { timing } from '@/constants/motion';
import { componentRadius } from '@/constants/radius';
import { layout, spacing } from '@/constants/spacing';
import { textStyles, type TextStyleToken } from '@/constants/typography';
import { useTheme } from '@/lib/useTheme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'small' | 'medium' | 'large';

/**
 * Şeffaflık bir renk jetonu değil, dolgunun yokluğudur — bu yüzden
 * `colors.ts` içinde karşılığı yok ve burada düz değer olarak duruyor.
 */
const TRANSPARENT = 'transparent';

/** Basılınca inilen ölçek. Boyuttan bağımsız — etki bilerek hafif. */
const PRESS_SCALE = 0.96;

/** Bir varyantın tüm durumlarındaki renkleri. */
type VariantColors = {
  background: string;
  pressedBackground: string;
  disabledBackground: string;
  content: string;
  pressedContent: string;
};

/**
 * Varyant renk tablosu.
 *
 * Ghost'un `colors.ts` içinde kendi jetonu YOK — birincil jetonlardan
 * besteleniyor. Basılınca hem zemin hem metin değişiyor: açık temada
 * `primary` (#C9306F) üzerine `primarySoft` (#FFE1EC) kontrastı 4.17:1'de
 * kalıp AA sınırının (4.5:1) altına düşüyor. `primaryPressed` iki temada da
 * `primarySoft`'tan UZAKLAŞTIĞI için (açıkta koyulaşır, koyuda açılır)
 * basılı hâli 5.63:1 / 8.44:1'e çıkarıyor.
 */
function getVariantColors(theme: ColorTheme, variant: ButtonVariant): VariantColors {
  const table: Record<ButtonVariant, VariantColors> = {
    primary: {
      background: theme.primary,
      pressedBackground: theme.primaryPressed,
      disabledBackground: theme.disabledBackground,
      content: theme.onPrimary,
      pressedContent: theme.onPrimary,
    },
    secondary: {
      background: theme.secondary,
      pressedBackground: theme.secondaryPressed,
      disabledBackground: theme.disabledBackground,
      content: theme.onSecondary,
      pressedContent: theme.onSecondary,
    },
    ghost: {
      background: TRANSPARENT,
      pressedBackground: theme.primarySoft,
      // Pasif ghost da dolgusuz kalır; gri hap dolgu onu bozuk bir birincil
      // buton gibi gösterirdi.
      disabledBackground: TRANSPARENT,
      content: theme.primary,
      pressedContent: theme.primaryPressed,
    },
  };

  return table[variant];
}

/** Bir boyutun ölçüleri. */
type SizeSpec = {
  minHeight: number;
  paddingHorizontal: number;
  /** Dokunma alanını erişilebilirlik tabanına tamamlayan dikey pay */
  hitSlopVertical: number;
  textStyle: TextStyleToken;
};

/**
 * Boyut tablosu.
 *
 * Yükseklikler `layout.minTouchTarget` (48) etrafında yazıldı — hem ölçek
 * dışı sabit kalmasın hem de her boyutun erişilebilirlik tabanına göre yeri
 * okunsun diye.
 *
 * `small` görsel olarak 40px; eksik 8px `hitSlop` ile kapanıyor (4 + 4).
 * 48'e zorlansaydı `medium` ile aynı görünür, prop anlamsız kalırdı.
 *
 * `small` metni `labelLarge`: tek `textStyles.button` jetonunun satır
 * yüksekliği 24 ve 40px hapta nefes payı bırakmıyor.
 */
const sizeSpecs: Record<ButtonSize, SizeSpec> = {
  small: {
    minHeight: layout.minTouchTarget - spacing.sm,
    paddingHorizontal: spacing.md,
    hitSlopVertical: spacing.xs,
    textStyle: textStyles.labelLarge,
  },
  medium: {
    minHeight: layout.minTouchTarget,
    paddingHorizontal: spacing.lg,
    hitSlopVertical: spacing.none,
    textStyle: textStyles.button,
  },
  large: {
    minHeight: layout.minTouchTarget + spacing.sm,
    paddingHorizontal: spacing.xl,
    hitSlopVertical: spacing.none,
    textStyle: textStyles.button,
  },
};

type ButtonProps = {
  label: string;
  onPress: () => void;
  /** Görsel ağırlık — varsayılan birincil eylem */
  variant?: ButtonVariant;
  /** Ölçü — varsayılan orta */
  size?: ButtonSize;
  /** Pasif: hem basılamaz hem soluk görünür */
  disabled?: boolean;
  /** Yükleniyor: basılamaz ama kendi rengini korur, genişliği değişmez */
  loading?: boolean;
  /** Satırı tamamen doldurur. Sütun düzeni içindir; satır düzeninde dikey esner. */
  fullWidth?: boolean;
  /** Ekran okuyucu etiketi — verilmezse görünen metin kullanılır */
  accessibilityLabel?: string;
};

/**
 * Uygulamanın tek buton bileşeni.
 *
 * Dokunma geri bildirimi iki katmanlı: renk anında değişir (Pressable'ın
 * `pressed` durumu), ölçek Reanimated ile yumuşak iner. Hareket azaltma
 * açıkken ölçek hiç oynamaz, geri bildirimi renk tek başına taşır.
 *
 * Dokunulabilir alan (dıştaki Pressable) ölçeklenmez — küçülseydi basılıyken
 * hedef daralır, kenardan basan parmak istemsizce bırakmış sayılırdı.
 */
export default function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  accessibilityLabel,
}: ButtonProps) {
  const { theme } = useTheme();

  // Sistem ayarını uygulama açılışında okur, değiştiğinde yeniden çizmez.
  const reduceMotion = useReducedMotion();

  // Yükleniyorken de basılamaz — ders akışında çift gönderimi engeller.
  // Soluk GÖRÜNÜM ise sadece `disabled`'a bağlı: kısa bir bekleme sırasında
  // butonun grileşmesi "bozuldu" gibi okunuyor.
  const isBlocked = disabled || loading;

  const sizeSpec = sizeSpecs[size];
  const variantColors = getVariantColors(theme, variant);

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Parmak basılıyken buton dışarıdan pasifleşirse Pressable `onPressOut`'u
  // ulaştıramıyor ve ölçek 0.96'da takılı kalıyor. Normal dokunuşta sıra
  // zaten onPressOut → onPress olduğu için bu yol yalnızca dış kaynaklı
  // (zamanlayıcı, üst bileşen) durum değişimlerinde çalışır.
  useEffect(() => {
    if (isBlocked) {
      scale.value = withTiming(1, timing.pressOut);
    }
  }, [isBlocked, scale]);

  function handlePressIn() {
    // Hareket azaltma açıkken hiç oynatma. Reanimated'ın kendi
    // `ReduceMotion.System` davranışı animasyonu kaldırıyor ama değeri
    // anında 0.96'ya SIÇRATIYOR — bu, animasyondan daha rahatsız edici.
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

  function resolveBackgroundColor(pressed: boolean): string {
    if (disabled) {
      return variantColors.disabledBackground;
    }

    return pressed ? variantColors.pressedBackground : variantColors.background;
  }

  function resolveContentColor(pressed: boolean): string {
    if (disabled) {
      return theme.disabledText;
    }

    return pressed ? variantColors.pressedContent : variantColors.content;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      // `busy` ve `disabled` işletim sisteminin kendi (yerelleştirilmiş)
      // anonsuna çevrilir; buraya ayrıca metin eklemek anonsu ikiye katlar.
      accessibilityState={{ disabled: isBlocked, busy: loading }}
      disabled={isBlocked}
      hitSlop={{ top: sizeSpec.hitSlopVertical, bottom: sizeSpec.hitSlopVertical }}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={fullWidth ? styles.stretched : styles.hugged}
    >
      {({ pressed }) => {
        const contentColor = resolveContentColor(pressed);

        return (
          <Animated.View
            style={[
              styles.surface,
              {
                minHeight: sizeSpec.minHeight,
                paddingHorizontal: sizeSpec.paddingHorizontal,
              },
              animatedStyle,
              { backgroundColor: resolveBackgroundColor(pressed) },
            ]}
          >
            <Text
              style={[
                sizeSpec.textStyle,
                styles.label,
                loading ? styles.labelHidden : null,
                { color: contentColor },
              ]}
            >
              {label}
            </Text>

            {loading ? (
              <View
                // Gösterge süsleme; durum `accessibilityState.busy` ile duyuruluyor.
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={styles.spinnerOverlay}
              >
                <ActivityIndicator size="small" color={contentColor} />
              </View>
            ) : null}
          </Animated.View>
        );
      }}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Sütun düzeninde View varsayılan olarak esner; `flex-start` olmasaydı
  // her buton tam genişlik olur, `fullWidth` prop'u anlamsız kalırdı.
  hugged: {
    alignSelf: 'flex-start',
  },
  stretched: {
    alignSelf: 'stretch',
  },
  surface: {
    // Satır + gap: ileride ikon eklenirse yerleşim hazır.
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: componentRadius.button,
  },
  label: {
    textAlign: 'center',
  },
  // Metin sökülmez, saydamlaştırılır: genişliği ölçmeye devam ettiği için
  // yükleme sırasında buton zıplamaz, ekran okuyucu da hangi butonun meşgul
  // olduğunu okumaya devam eder.
  labelHidden: {
    opacity: 0,
  },
  // Yayılabilen düz nesne olan `absoluteFillObject` kullanılıyor.
  // `absoluteFill` bu sürümde kayıtlı stil (çalışma anında bir sayı); spread
  // edilirse sessizce boş nesne verir ve gösterge mutlak konumunu kaybeder.
  spinnerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
