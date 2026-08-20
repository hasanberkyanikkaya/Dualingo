import { StyleSheet, View } from 'react-native';

import OptionCard from '@/components/OptionCard';
import { layout } from '@/constants/spacing';
import { warnOnDuplicateIds } from '@/features/learning/questionValidation';

import type { Choice, QuestionId } from '@/types';

type ChoiceListProps = {
  options: readonly Choice[];
  selectedId: string | null;
  onSelect: (optionId: string) => void;
  /** Yalnızca uyarı metninde geçer */
  questionId: QuestionId;
  disabled?: boolean;
};

/**
 * Tek seçimli şık listesi. `multiple_choice` ve `audio_choice` aynı şeyi
 * çiziyor; ikisinde de aynı erişilebilirlik yapısı olsun diye tek yerde.
 *
 * Grup etiketi bilerek verilmedi — üstteki soru bloğu ne yapılacağını zaten
 * söylüyor ve Android'de grup etiketi her çocukta yeniden okunuyor.
 */
export default function ChoiceList({
  options,
  selectedId,
  onSelect,
  questionId,
  disabled = false,
}: ChoiceListProps) {
  warnOnDuplicateIds(options, `"${questionId}" şıkları`);

  return (
    <View accessibilityRole="radiogroup" style={styles.list}>
      {options.map((option) => (
        <OptionCard
          key={option.id}
          label={option.text}
          selected={option.id === selectedId}
          disabled={disabled}
          // Seçili şıkka tekrar basmak seçimi KALDIRMAZ — kullanıcı
          // yanlışlıkla cevapsız kalmasın.
          onPress={() => onSelect(option.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: layout.listGap,
  },
});
