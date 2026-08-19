import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { componentRadius } from '@/constants/radius';
import { layout, spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import { formatString } from '@/lib/formatString';
import { useTheme } from '@/lib/useTheme';

/**
 * Görünen yükseklik 40 + `hitSlop` 4/4 → etkin 48.
 * Button'ın `small` aritmetiğinin aynısı. Satır içinde gerçek 48px'lik bir kutu,
 * 28px satır yüksekliğindeki metnin arasında çok iri durur.
 */
const SLOT_HEIGHT = layout.minTouchTarget - spacing.sm; // 40
const HIT_SLOP = spacing.xs; // 4

/** Boş yuvanın en az genişliği — "buraya bir şey gelecek" alanı görünsün diye. */
const SLOT_MIN_WIDTH = spacing.huge; // 64

/** Yazı alanının genişliği. Sabit: otomatik büyüme cümleyi her tuşta yeniden dizerdi. */
const INPUT_MIN_WIDTH = 112;

type BlankSlotProps = {
  /** Kaçıncı boşluk (1'den başlar) — ekran okuyucu etiketinde geçer */
  index: number;
  value: string | null;
  /** Kelime havuzu kipinde: sıradaki kelime buraya gelecek */
  focused: boolean;
  /** Kelime havuzu kipi — dolu yuvaya dokunmak boşaltır */
  onPress?: () => void;
  /** Klavye kipi — yuva yerine yazı alanı çizilir */
  editable: boolean;
  onChangeText?: (text: string) => void;
};

/**
 * Cümlenin içindeki tek bir boşluk.
 *
 * İki kipi var ve kip soru başına seçiliyor (`fillBlankLayout.usesWordBank`):
 * kelime havuzunda dokunulabilir bir yuva, klavye kipinde bir `TextInput`.
 *
 * Boş yuvanın "buraya bir şey gelecek" demesini **yalnızca kontur** sağlıyor:
 * `borderControl` 2px (zemine 3.64 / 3.46) + görünür bir alan (`minWidth` 64).
 * 2.1'in dersi: 1.5:1'de 32px'lik bant görünüyor ama aynı orandaki çizgi
 * görünmüyor — algıda alan önemli. Alttan çizgi de aynı oranı veriyordu ama
 * dokunulabilir görünmüyor ve klavye kipinde zaten bir yazı alanı barındırması
 * gerekiyor (`componentRadius.input` tam bunun için var).
 * ⚠️ `borderStyle: 'dashed'` denenmedi ve denenmeyecek: Android'de
 * `borderRadius` ile birlikte uzun süredir bozuk.
 */
export default function BlankSlot({
  index,
  value,
  focused,
  onPress,
  editable,
  onChangeText,
}: BlankSlotProps) {
  const { theme } = useTheme();

  const label =
    value === null || value.length === 0
      ? formatString(strings.a11y.blankEmpty, { index })
      : formatString(strings.a11y.blankFilled, { index, value });

  if (editable) {
    return (
      <TextInput
        accessibilityLabel={formatString(strings.a11y.blankEmpty, { index })}
        value={value ?? ''}
        onChangeText={onChangeText}
        // Türkçe içerikte otomatik düzeltme ve büyük harfe çevirme cevabı bozar.
        autoCorrect={false}
        autoCapitalize="none"
        spellCheck={false}
        submitBehavior="blurAndSubmit"
        style={[
          textStyles.bodyMedium,
          styles.slot,
          styles.input,
          { borderColor: theme.borderControl, color: theme.textPrimary },
        ]}
      />
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={value !== null ? strings.a11y.blankClearHint : undefined}
      hitSlop={{ top: HIT_SLOP, bottom: HIT_SLOP }}
      onPress={onPress}
      disabled={value === null}
    >
      <View
        style={[
          styles.slot,
          styles.tappable,
          { borderColor: focused ? theme.primary : theme.borderControl },
        ]}
      >
        {value !== null ? (
          <Text style={[textStyles.bodyMedium, { color: theme.textPrimary }]}>{value}</Text>
        ) : null}

        {/*
          Odaklı yuvanın imleci. Kenarlık rengi tek başına yetmiyor:
          `primary` ile `borderControl` arasında yalnızca 1.40:1 var, yani
          "sıradaki kelime buraya gelecek" bilgisi sadece hüeyle verilmiş olurdu
          (WCAG 1.4.1). İmleç bunu biçimle taşıyor ve açıklama gerektirmiyor.
        */}
        {focused && value === null ? (
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[styles.caret, { backgroundColor: theme.primary }]}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  slot: {
    minWidth: SLOT_MIN_WIDTH,
    minHeight: SLOT_HEIGHT,
    paddingHorizontal: spacing.sm,
    borderWidth: 2,
    borderRadius: componentRadius.input,
  },
  tappable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    minWidth: INPUT_MIN_WIDTH,
    // Android'de TextInput'un kendi dikey dolgusu var; sıfırlanmazsa yuva
    // komşu kelimelerden yüksek durur.
    paddingVertical: 0,
    textAlign: 'center',
  },
  caret: {
    width: 2,
    height: 18,
  },
});
