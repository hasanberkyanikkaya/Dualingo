import { StyleSheet, Text, View } from 'react-native';

import { spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import { buildSentence, usesWordBank } from '@/features/learning/fillBlankLayout';
import { shuffleSeeded } from '@/lib/shuffle';
import { useTheme } from '@/lib/useTheme';

import BlankSlot from './BlankSlot';
import Chip from './Chip';
import QuestionShell from './QuestionShell';
import { useQuestionState } from './useQuestionState';

import type { AnswerOfType, QuestionOfType } from '@/types';

/** Havuzdaki tek bir kelime. Kimlik sentetik — aynı kelime iki kez geçebilir. */
type BankChip = { id: string; text: string };

type FillBlankQuestionProps = {
  question: QuestionOfType<'fill_blank'>;
  onAnswer: (answer: AnswerOfType<'fill_blank'>) => void;
};

/**
 * Boşluk doldurma. İki kipi var, kip soru başına seçiliyor: boşluklarda
 * `choices` varsa **kelime havuzu**, yoksa **klavye**.
 *
 * ⚠️ **Havuz karıştırılıyor.** Örnek içerikte `choices` taşıyan beş boşluğun
 * beşinde de doğru cevap ilk sırada; karıştırma olmadan "ilk çipe dokun" her
 * seferinde doğru olurdu.
 *
 * ⚠️ **Odak saklanmıyor, TÜRETİLİYOR: odak her zaman soldan ilk boş yuva.**
 * Dolu yuvaya dokunmak onu boşaltıyor, yani odağı değiştirmek ile boşaltmak
 * aynı hareket. Ayrı bir odak durumu olsaydı "hangi yuvayı kastettim"
 * belirsizliği ve onu anlatacak ikinci bir görsel gösterge gerekirdi.
 *
 * `question.blanks[].correctAnswers` okunmuyor — yalnızca `choices`.
 */
export default function FillBlankQuestion({ question, onAnswer }: FillBlankQuestionProps) {
  const { theme } = useTheme();

  const context = `"${question.id}"`;
  const blanks = Array.isArray(question.blanks) ? question.blanks : [];
  const { tokens, renderedBlankIds } = buildSentence(question.segments, blanks, context);
  const wordBank = usesWordBank(blanks, context);

  // Yuva kimliği → değer. Klavye kipinde yazılan metin, havuz kipinde çipin metni.
  const [values, setValues] = useQuestionState<Record<string, string>>(question.id, {});
  // Havuz kipinde hangi çipin tüketildiği. Değer değil KİMLİK tutuluyor ki aynı
  // kelimeden iki tane varsa doğru olanı geri dönsün.
  const [usedChipIds, setUsedChipIds] = useQuestionState<Record<string, string>>(
    question.id,
    {},
  );

  // Havuz = tüm boşlukların choices'ının birleşimi, TEKİLLEŞTİRİLMEDEN.
  // Değere göre tekilleştirmek "iki boşluk aynı kelimeyi istiyor" durumunu bozardı.
  const bank: BankChip[] = wordBank
    ? blanks.flatMap((blank, blankIndex) =>
        (blank.choices ?? []).map((text, choiceIndex) => ({
          id: `${blankIndex}:${choiceIndex}`,
          text,
        })),
      )
    : [];
  const shuffledBank = shuffleSeeded(bank, `${question.id}:bank`);

  const consumedIds = new Set(Object.values(usedChipIds));
  const availableBank = shuffledBank.filter((chip) => !consumedIds.has(chip.id));

  const focusedBlankId = renderedBlankIds.find((id) => (values[id] ?? '').length === 0) ?? null;

  function handleChipPress(chip: BankChip) {
    if (focusedBlankId === null) {
      return;
    }
    setValues((current) => ({ ...current, [focusedBlankId]: chip.text }));
    setUsedChipIds((current) => ({ ...current, [focusedBlankId]: chip.id }));
  }

  function handleSlotPress(blankId: string) {
    setValues((current) => {
      const next = { ...current };
      delete next[blankId];
      return next;
    });
    setUsedChipIds((current) => {
      const next = { ...current };
      delete next[blankId];
      return next;
    });
  }

  function handleChangeText(blankId: string, text: string) {
    setValues((current) => ({ ...current, [blankId]: text }));
  }

  // ⚠️ Ham `question.blanks`'ten DEĞİL, gerçekten çizilen yuvalardan türetiliyor.
  // Bozuk bir soruda ham diziyi kullanmak ya sonsuza dek gönderilemez ya da
  // eksik cevapla gönderilebilir bir soru bırakırdı.
  const canSubmit =
    renderedBlankIds.length > 0 &&
    renderedBlankIds.every((id) => (values[id] ?? '').trim().length > 0);

  function handleSubmit() {
    if (!canSubmit) {
      return;
    }

    onAnswer({
      questionId: question.id,
      type: 'fill_blank',
      // ⚠️ Yalnızca `trim()`. Küçültme/normalleştirme YOK: Türkçe harf katlaması
      // yerele bağlı ('I'.toLowerCase() → 'i', 'ı' değil) ve naif bir dönüşüm
      // doğru cevabı yanlış işaretler. Karşılaştırma Faz 2.3'ün motorunda,
      // toLocaleLowerCase('tr') ile, tek yerde yapılacak.
      entries: renderedBlankIds.map((blankId) => ({
        blankId,
        value: (values[blankId] ?? '').trim(),
      })),
    });
  }

  return (
    <QuestionShell
      instruction={strings.question.fillBlank}
      prompt={question.prompt}
      hint={question.hint}
      canSubmit={canSubmit}
      onSubmit={handleSubmit}
      submitHint={strings.question.fillAllBlanksHint}
      keyboardAware={!wordBank}
    >
      {/*
        Cümle satır düzeninde ve sarıyor. Çocuklar KELİME kelime; segmentin
        tamamı tek çocuk olsaydı uzun bir cümle kırılamaz blok olup taşardı.
        ⚠️ `alignItems: 'center'`, 'baseline' DEĞİL — yuva bir `View` ve metin
        taban çizgisi yok, alta hizalanıp gözle sallanıyor.
      */}
      <View style={styles.sentence}>
        {tokens.map((token) =>
          token.kind === 'word' ? (
            <Text
              key={token.key}
              style={[textStyles.bodyLarge, { color: theme.textPrimary }]}
            >
              {token.text}
            </Text>
          ) : (
            <BlankSlot
              key={token.key}
              index={token.index}
              value={values[token.blankId] ?? null}
              focused={token.blankId === focusedBlankId}
              editable={!wordBank}
              onPress={() => handleSlotPress(token.blankId)}
              onChangeText={(text) => handleChangeText(token.blankId, text)}
            />
          ),
        )}
      </View>

      {wordBank ? (
        <View style={styles.bank}>
          <Text style={[textStyles.labelSmall, { color: theme.textMuted }]}>
            {strings.question.fillBlankBank}
          </Text>

          <View style={styles.bankRow}>
            {availableBank.map((chip) => (
              <Chip
                key={chip.id}
                label={chip.text}
                selected={false}
                // Bütün yuvalar doluyken havuz basılamaz — önce bir yuva boşaltılmalı.
                disabled={focusedBlankId === null}
                onPress={() => handleChipPress(chip)}
              />
            ))}
          </View>
        </View>
      ) : null}
    </QuestionShell>
  );
}

const styles = StyleSheet.create({
  sentence: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: spacing.sm,
    rowGap: spacing.sm,
  },
  bank: {
    gap: spacing.sm,
  },
  bankRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: spacing.sm,
    rowGap: spacing.sm,
  },
});
