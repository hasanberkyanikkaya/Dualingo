import { Ionicons } from '@expo/vector-icons';
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

/**
 * Basılınca inilen ölçek.
 *
 * ⚠️ Button'ın 0.96'sı DEĞİL. Gözün okuduğu şey oran değil yer değiştirme, o da
 * genişlikle büyüyor: 72px'lik seviye düğümünde 0.96 kenar başına 1.4px, ama tam
 * genişlikte (~343px) bir kartta 6.9px — bütün sayfa sarsılıyor gibi duruyor.
 * 0.98'de 3.4px kalıyor ve kart yerinde duruyor.
 */
const PRESS_SCALE = 0.98;

/** Radyo göstergesinin boyutu. */
const INDICATOR_SIZE = spacing.xl; // 24

/** Kenarlık her durumda aynı kalınlıkta — bkz. aşağıdaki not. */
const BORDER_WIDTH = 2;

type OptionCardProps = {
  /** Şık metni — içerikten gelir; kırpılmaz, satıra sarar */
  label: string;
  /**
   * Etiketin altındaki açıklama satırı. Soru şıklarında YOK (şıkkın açıklaması
   * cevabı ele verirdi); tespit sınavının kademe seçiminde var.
   */
  body?: string;
  selected: boolean;
  onPress: () => void;
  /** Cevap kilitlendikten sonra basılamaz — RENGİ değişmez, metin okunur kalır */
  disabled?: boolean;
};

/**
 * Seçilebilir şık satırı.
 *
 * ⚠️ **`/features/learning` altındaydı, Faz 2.6'da `/components`a taşındı.**
 * Sebep mimari kural 3: tespit sınavının kademe seçimi tam olarak bu kontrolü
 * istiyordu (2px `borderControl`, radyo göstergesi, 0.98 basma ölçeği) ve
 * onboarding'in soru katmanından import etmesi bağımlılığı ters yöne çevirirdi.
 * Yeni bir kart bileşeni yazmak, ölçülmüş bütün renk kararlarını ikinci kez
 * vermek demekti.
 *
 * **Sınırı kenarlık taşır, dolgu DEĞİL.** Açık temada `surface` ile `background`
 * aynı renk (saf beyaz), yani kart zeminden dolgusuyla ayrılamıyor. Dolgu
 * yalnızca seçili durumda hafif bir renk tonu; kartın kart olduğunu söyleyen şey
 * `borderControl` kenarlığı (zemine 3.64 açık / 3.46 koyu).
 *
 * **Seçim bilgisini işaretin BİÇİMİ taşır, rengi değil.** Ölçüm: seçili kenarlık
 * (`primary`) ile seçilmemiş kenarlık (`borderControl`) arasında yalnızca
 * **1.40:1** var — aradaki fark neredeyse tamamen hüe. İki 2px çizgi bir liste
 * içinde bu farkla ayırt edilmiyor; bilgiyi sadece renkle vermek WCAG 1.4.1'e
 * takılıyor (Oturum 2.1'de `primary`/`success` 1.10:1 çıktığında öğrenilen ders).
 * Bu yüzden gösterge boş halkadan dolu radyoya dönüyor.
 *
 * ⚠️ Gösterge olarak `checkmark-circle` KULLANILMAZ: henüz kontrol edilmemiş bir
 * şıkta tik, doğruluğu önceden ima eder — bu bileşenin açıkça yapmaması gereken
 * tek şey. Tik dağarcığı Faz 2.3'ün gerçek doğru/yanlış işaretine ait.
 */
export default function OptionCard({
  label,
  body,
  selected,
  onPress,
  disabled = false,
}: OptionCardProps) {
  const { theme } = useTheme();
  const reduceMotion = useReducedMotion();

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Parmak basılıyken kart dışarıdan kilitlenirse `onPressOut` ulaşamıyor ve
  // ölçek küçük hâlde takılı kalıyor. (Button'daki aynı koruma.)
  useEffect(() => {
    if (disabled) {
      scale.value = withTiming(1, timing.pressOut);
    }
  }, [disabled, scale]);

  function handlePressIn() {
    // Hareket azaltma açıkken hiç oynatma — Reanimated'ın `ReduceMotion.System`
    // davranışı animasyonu kaldırıp değeri sıçratıyor, o daha rahatsız edici.
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
      accessibilityRole="radio"
      // Açıklama satırı ayrı bir odak durağı olmamalı; tek anonsta birleşiyor.
      accessibilityLabel={body === undefined ? label : `${label}. ${body}`}
      // `checked` ve `disabled` işletim sisteminin kendi yerelleştirilmiş
      // anonsuna çevriliyor; ayrıca "seçili" yazmak anonsu ikiye katlar.
      // ⚠️ Yanına `selected` EKLENMEZ: Android'de `setSelected`'a düşüyor ve
      // TalkBack "radio button, checked, selected" diyor.
      accessibilityState={{ checked: selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {({ pressed }) => {
        // Basılı dolgu her durumda `primarySoft`: seçilmemiş kartta olacak
        // seçimin önizlemesi gibi okunuyor. Seçili karta tekrar basmak zaten
        // işlevsiz olduğu için orada ölçek tek başına yeterli geri bildirim.
        const backgroundColor =
          selected || pressed ? theme.primarySoft : theme.surface;

        return (
          <Animated.View
            style={[
              styles.card,
              {
                backgroundColor,
                borderColor: selected ? theme.primary : theme.borderControl,
              },
              animatedStyle,
            ]}
          >
            <Ionicons
              // Gösterge süsleme; durumu `accessibilityState.checked` söylüyor.
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              name={selected ? 'radio-button-on' : 'radio-button-off'}
              size={INDICATOR_SIZE}
              color={selected ? theme.primary : theme.borderControl}
            />

            {/*
              Etiket iki durumda da `textPrimary`. Seçilince `primary`'ye
              çevirmek cazip ama `primary` üzerine `primarySoft` 4.17:1 —
              Oturum 1.2'de ghost butonu düzelten sayının aynısı, AA'nın altı.
            */}
            <View style={styles.text}>
              <Text style={[textStyles.bodyMedium, { color: theme.textPrimary }]}>{label}</Text>

              {body === undefined ? null : (
                // ⚠️ `textMuted` DEĞİL: seçili kartın dolgusu `primarySoft` ve
                // `textMuted` renkli yumuşak dolgu üzerinde AA'nın altına
                // düşüyor (Oturum 2.3'te geri bildirim panelinde ölçüldü).
                <Text style={[textStyles.bodySmall, { color: theme.textSecondary }]}>{body}</Text>
              )}
            </View>
          </Animated.View>
        );
      }}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: layout.cardPadding,
    // `height` değil `minHeight`: OS yazı boyutu büyüyünce kart büyür, uzun
    // Türkçe şık kırpılmaz.
    minHeight: layout.minTouchTarget,
    borderRadius: componentRadius.card,
    // ⚠️ Kalınlık her durumda aynı. 1'den 2'ye çıkarsaydı seçim değiştiğinde
    // etiket 1px kayar ve liste titrerdi.
    borderWidth: BORDER_WIDTH,
  },
  text: {
    // Kalan genişliği alsın ki uzun metin sarsın, göstergeyi itmesin.
    flex: 1,
    gap: spacing.xs,
  },
});
