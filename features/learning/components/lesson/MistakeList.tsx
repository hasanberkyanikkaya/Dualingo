import { StyleSheet, Text, View } from 'react-native';

import { spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import { describeCorrectAnswer } from '@/features/learning/answerEngine';
import type { QuestionResult } from '@/features/learning/lessonSession';
import { formatString } from '@/lib/formatString';
import { useTheme } from '@/lib/useTheme';

import type { Question } from '@/types';

type MistakeListProps = {
  mistakes: QuestionResult[];
  /** Oturumun soruları — sonuçlar yalnız kimlik taşıyor. */
  questions: Question[];
};

/**
 * "Hataların nerede" özeti. Ders bittikten sonra yanlış cevaplanan soruları
 * ve doğru cevaplarını listeler.
 *
 * ⚠️ Soru bileşenleri **yeniden çizilmiyor**, düz metin. Her biri Reanimated
 * paylaşılan değerleri kuruyor, tohumlu karıştırma çalıştırıyor, ses kancası
 * çağırıyor; salt okunur bir soru zaten anlamsız ve bir kez kaydırılıp geçilen
 * liste için pahalı.
 *
 * Kullanıcının verdiği cevap **gösterilmiyor** (ürün kararı): öğreten şey doğru
 * cevap, yanlışı tekrar okutmak değil.
 *
 * Satırlar arasında ayraç çizgisi yok — `borderControl` "dokunulabilir öğenin
 * sınırı" olarak tanımlı ve bu satırlar dokunulabilir değil (2.2c'deki sıralama
 * bölgesiyle aynı gerekçe). Ayrımı boşluk ve tipografi taşıyor.
 */
export default function MistakeList({ mistakes, questions }: MistakeListProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.list}>
      <Text style={[textStyles.labelSmall, { color: theme.textMuted }]}>
        {strings.result.reviewMistakes}
      </Text>

      {mistakes.map((mistake) => {
        const question = questions.find((candidate) => candidate.id === mistake.questionId);
        if (question === undefined) {
          return null;
        }

        const indexLabel = formatString(strings.result.questionIndex, {
          index: mistake.index + 1,
        });
        const correctLine = formatString(strings.lesson.correctAnswerIs, {
          answer: describeCorrectAnswer(question).join(' → '),
        });

        return (
          // Satır başına TEK odak durağı — üç ayrı metin dört durak yapardı ve
          // üç hatalı bir derste ekran okuyucu turu yorucu olurdu.
          <View
            key={mistake.questionId}
            accessible
            accessibilityLabel={`${indexLabel}. ${question.prompt}. ${correctLine}`}
            style={styles.row}
          >
            <Text style={[textStyles.labelSmall, { color: theme.textMuted }]}>{indexLabel}</Text>
            <Text
              numberOfLines={2}
              style={[textStyles.bodyStrong, { color: theme.textPrimary }]}
            >
              {question.prompt}
            </Text>
            <Text style={[textStyles.bodySmall, { color: theme.textSecondary }]}>
              {correctLine}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.lg,
  },
  row: {
    gap: spacing.xs,
  },
});
