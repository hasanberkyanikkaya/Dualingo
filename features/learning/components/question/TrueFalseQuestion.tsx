import type { ReactNode } from 'react';

import { StyleSheet, View } from 'react-native';

import { layout } from '@/constants/spacing';
import strings from '@/constants/strings';

import OptionCard from './OptionCard';
import QuestionShell from './QuestionShell';
import { useQuestionState } from './useQuestionState';

import type { AnswerOfType, QuestionOfType } from '@/types';

type TrueFalseQuestionProps = {
  question: QuestionOfType<'true_false'>;
  onAnswer: (answer: AnswerOfType<'true_false'>) => void;
  /** Cevap verildi mi — kontroller kilitlenir, alt bölümü `footer` devralır */
  isAnswered?: boolean;
  footer?: ReactNode;
};

/**
 * Doğru/Yanlış sorusu. Yapısı çoktan seçmelinin aynısı ama şıklar içerikten
 * gelmiyor — iki sabit etiket (`strings.question.trueLabel` / `falseLabel`).
 * Bu yüzden `ChoiceList` kullanılmıyor: o `Choice[]` bekliyor ve buradaki iki
 * seçeneğin kimliği yok, değeri var.
 *
 * `question.correctAnswer` okunmuyor.
 */
export default function TrueFalseQuestion({
  question,
  onAnswer,
  isAnswered = false,
  footer,
}: TrueFalseQuestionProps) {
  const [value, setValue] = useQuestionState<boolean | null>(question.id, null);

  function handleSubmit() {
    if (value === null) {
      return;
    }

    onAnswer({ questionId: question.id, type: 'true_false', value });
  }

  return (
    <QuestionShell
      instruction={strings.question.trueFalse}
      prompt={question.prompt}
      hint={question.hint}
      canSubmit={value !== null}
      onSubmit={handleSubmit}
      isAnswered={isAnswered}
      footer={footer}
    >
      <View accessibilityRole="radiogroup" style={styles.list}>
        {/*
          ⚠️ `selected={value === true}` / `value === false` — `!!value` DEĞİL.
          Durum üç değerli (`true` / `false` / henüz seçilmedi) ve `!!value`
          "Yanlış" seçiliyken kartı seçilmemiş gösterirdi.
        */}
        <OptionCard
          label={strings.question.trueLabel}
          selected={value === true}
          disabled={isAnswered}
          onPress={() => setValue(true)}
        />
        <OptionCard
          label={strings.question.falseLabel}
          selected={value === false}
          disabled={isAnswered}
          onPress={() => setValue(false)}
        />
      </View>
    </QuestionShell>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: layout.listGap,
  },
});
