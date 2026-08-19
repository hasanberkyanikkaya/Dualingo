import type { ReactNode } from 'react';

import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';

import { layout, spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import { warnOnDuplicateIds } from '@/features/learning/questionValidation';
import { formatString } from '@/lib/formatString';
import { shuffleSeeded } from '@/lib/shuffle';
import { useTheme } from '@/lib/useTheme';

import Chip from './Chip';
import QuestionShell from './QuestionShell';
import { useQuestionState } from './useQuestionState';

import type { AnswerOfType, QuestionOfType } from '@/types';

/** Boş cevap bölgesinin ayırdığı yükseklik — bir çip satırı kadar. */
const ANSWER_MIN_HEIGHT = layout.minTouchTarget;

type OrderingQuestionProps = {
  question: QuestionOfType<'ordering'>;
  onAnswer: (answer: AnswerOfType<'ordering'>) => void;
  /** Cevap verildi mi — kontroller kilitlenir, alt bölümü `footer` devralır */
  isAnswered?: boolean;
  footer?: ReactNode;
};

/**
 * Sıralama sorusu: üstte kullanıcının kurduğu sıra, altta karıştırılmış havuz.
 * Havuzdaki öğeye dokunmak sona ekler, sıradakine dokunmak havuza geri gönderir.
 *
 * Sürükle-bırak bilerek elendi: `react-native-gesture-handler` + yerleşim
 * animasyonu gerektiriyor ve ekran okuyucuyla neredeyse kullanılamıyor.
 * Duolingo'nun kendisi de dokunarak dizdiriyor.
 *
 * ⚠️ **Havuz karıştırılıyor.** Örnek içerikte bir sorunun `correctOrder`'ı
 * kimlik permutasyonu (`i1..i5`) — havuz içerik sırasında çizilseydi sırayla
 * dokunmak doğru cevap olurdu. Karıştırma tohumlu, yani her çizimde aynı.
 *
 * `question.correctOrder` okunmuyor.
 */
export default function OrderingQuestion({
  question,
  onAnswer,
  isAnswered = false,
  footer,
}: OrderingQuestionProps) {
  const { theme } = useTheme();
  const [placedIds, setPlacedIds] = useQuestionState<string[]>(question.id, []);

  const items = Array.isArray(question.items) ? question.items : [];
  warnOnDuplicateIds(items, `"${question.id}" öğeleri`);

  const shuffled = shuffleSeeded(items, question.id);

  // Havuz, karıştırılmış diziden yerleştirilenleri düşerek türetiliyor. Böylece
  // geri gönderilen öğe KENDİ eski yerine dönüyor — ayrı bir havuz durumu
  // tutmaya ve ölçüm yapmaya gerek kalmıyor.
  const pool = shuffled.filter((item) => !placedIds.includes(item.id));
  const placed = placedIds
    .map((id) => items.find((item) => item.id === id))
    .filter((item): item is (typeof items)[number] => item !== undefined);

  /**
   * Dokunulan çip listeden kalkıyor, yani ekran okuyucunun odaklandığı öğe yok
   * oluyor; odak rastgele bir yere kayıp orayı okuyor. Duyuru olmadan kullanıcı
   * ne olduğunu anlamıyor. Ekran okuyucu kapalıyken etkisiz — kontrol gerekmez.
   */
  function announce(message: string) {
    AccessibilityInfo.announceForAccessibility(message);
  }

  function handleAdd(itemId: string, text: string) {
    setPlacedIds((current) => [...current, itemId]);
    announce(
      formatString(strings.a11y.orderingItemAdded, {
        text,
        position: placedIds.length + 1,
      }),
    );
  }

  function handleRemove(itemId: string, text: string) {
    setPlacedIds((current) => current.filter((id) => id !== itemId));
    announce(formatString(strings.a11y.orderingItemRemoved, { text }));
  }

  function handleSubmit() {
    if (placedIds.length !== items.length || items.length === 0) {
      return;
    }
    onAnswer({ questionId: question.id, type: 'ordering', order: placedIds });
  }

  return (
    <QuestionShell
      instruction={strings.question.ordering}
      prompt={question.prompt}
      hint={question.hint}
      canSubmit={items.length > 0 && placedIds.length === items.length}
      onSubmit={handleSubmit}
      submitHint={strings.question.orderAllHint}
      isAnswered={isAnswered}
      footer={footer}
    >
      <View style={styles.zone}>
        {/*
          Bölge başlıkları GÖRÜNÜR metin, kapsayıcıya `accessibilityLabel`
          değil: grup etiketi Android'de her çocukta yeniden okunuyor, görünür
          başlık ise herkese yarıyor.
        */}
        <Text style={[textStyles.labelSmall, { color: theme.textMuted }]}>
          {strings.question.orderingYourOrder}
        </Text>

        {/*
          ⚠️ Boş bölge KUTU DEĞİL. Ölçüldü: `surfaceAlt` 1.10, `border` 1.27,
          `borderStrong` 1.52, `disabledBackground` 1.18 — hiçbiri görünmüyor.
          Görünen tek jeton `borderControl` ama o "dokunulabilir bir öğenin
          sınırı" olarak tanımlandı; cevap bölgesi dokunulabilir değil ve
          jetonu sulandırmak sistemi çürütür. Bölgeyi başlığı ve bu yer tutucu
          satırı taşıyor. `minHeight` ilk çip düşünce zıplamayı engelliyor.
        */}
        <View style={styles.row}>
          {placed.length === 0 ? (
            <Text style={[textStyles.bodySmall, { color: theme.textMuted }]}>
              {strings.question.orderingEmpty}
            </Text>
          ) : (
            placed.map((item, index) => (
              <Chip
                key={item.id}
                label={item.text}
                badge={index + 1}
                selected
                accessibilityLabel={formatString(strings.a11y.orderingPositionLabel, {
                  position: index + 1,
                  text: item.text,
                })}
                accessibilityHint={strings.a11y.orderingRemoveHint}
                disabled={isAnswered}
                onPress={() => handleRemove(item.id, item.text)}
              />
            ))
          )}
        </View>
      </View>

      <View style={styles.zone}>
        <Text style={[textStyles.labelSmall, { color: theme.textMuted }]}>
          {strings.question.orderingPool}
        </Text>

        <View style={styles.row}>
          {pool.map((item) => (
            <Chip
              key={item.id}
              label={item.text}
              selected={false}
              disabled={isAnswered}
              onPress={() => handleAdd(item.id, item.text)}
            />
          ))}
        </View>
      </View>
    </QuestionShell>
  );
}

const styles = StyleSheet.create({
  zone: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: spacing.sm,
    rowGap: spacing.sm,
    minHeight: ANSWER_MIN_HEIGHT,
  },
});
