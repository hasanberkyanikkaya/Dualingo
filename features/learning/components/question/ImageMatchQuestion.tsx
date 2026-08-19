import { StyleSheet, View } from 'react-native';

import { spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { warnContent, warnOnDuplicateIds } from '@/features/learning/questionValidation';
import { formatString } from '@/lib/formatString';
import { shuffleSeeded } from '@/lib/shuffle';

import Chip from './Chip';
import ImageTile from './ImageTile';
import QuestionShell from './QuestionShell';
import { useQuestionState } from './useQuestionState';

import type { AnswerOfType, QuestionOfType } from '@/types';

/** Kurulmuş bir eşleşme. */
type Match = { imagePairId: string; textPairId: string };

type ImageMatchQuestionProps = {
  question: QuestionOfType<'image_match'>;
  onAnswer: (answer: AnswerOfType<'image_match'>) => void;
};

/**
 * Görsel eşleştirme: üstte görsel ızgarası, altta metin çipleri. Bir görsele,
 * sonra bir metne (ya da tersi) dokunmak eşleşme kuruyor.
 *
 * ⚠️ **Metin listesi karıştırılıyor.** Eşleşme tipte yapısal olarak konumsal —
 * `pairs[i].image` ile `pairs[i].text` eşleşiyor — yani iki liste aynı sırada
 * çizilseydi *n*. satır *n*. satırla eşleşir, soru okumadan çözülürdü.
 * Görsel ızgarası içerik sırasında kalıyor; birini karıştırmak yeterli.
 *
 * ⚠️ **Yan yana iki sütun DEĞİL.** %50 genişlik uzun Türkçe metni büyük yazı
 * boyutunda taşımıyor, üstelik *n*. satırın *n*. satıra komşuluğu tam da yok
 * etmeye çalıştığımız konumsal ipucu.
 *
 * ⚠️ **Eşleşmeyi NUMARA taşıyor, renk değil.** Dört eşzamanlı eşleşme renkle
 * ayrılamaz: `primary`/`success` 1.10:1 ve dört ayrı hüe zaten WCAG 1.4.1'e
 * takılırdı.
 */
export default function ImageMatchQuestion({ question, onAnswer }: ImageMatchQuestionProps) {
  const pairs = Array.isArray(question.pairs) ? question.pairs : [];
  warnOnDuplicateIds(pairs, `"${question.id}" çiftleri`);

  if (pairs.length > 0 && pairs.length < 3) {
    // Kod hatası değil, içerik uyarısı: iki çiftte birini eşleştirmek diğerini
    // zorluyor, yani soru tek dokunuşla çözülüyor.
    warnContent(`"${question.id}"`, `yalnızca ${pairs.length} çift var; soru kendini ele veriyor.`);
  }

  const shuffledTexts = shuffleSeeded(pairs, `${question.id}:text`);

  const [matches, setMatches] = useQuestionState<Match[]>(question.id, []);
  const [pendingImageId, setPendingImageId] = useQuestionState<string | null>(question.id, null);
  const [pendingTextId, setPendingTextId] = useQuestionState<string | null>(question.id, null);

  function matchIndexOfImage(pairId: string): number {
    return matches.findIndex((match) => match.imagePairId === pairId);
  }

  function matchIndexOfText(pairId: string): number {
    return matches.findIndex((match) => match.textPairId === pairId);
  }

  function breakMatch(index: number) {
    setMatches((current) => current.filter((_, i) => i !== index));
  }

  function handleImagePress(pairId: string) {
    const existing = matchIndexOfImage(pairId);
    if (existing !== -1) {
      breakMatch(existing);
      return;
    }

    // Aynı kutuya tekrar dokunmak seçimi bırakır.
    if (pendingImageId === pairId) {
      setPendingImageId(null);
      return;
    }

    if (pendingTextId !== null) {
      setMatches((current) => [...current, { imagePairId: pairId, textPairId: pendingTextId }]);
      setPendingTextId(null);
      setPendingImageId(null);
      return;
    }

    setPendingImageId(pairId);
  }

  function handleTextPress(pairId: string) {
    const existing = matchIndexOfText(pairId);
    if (existing !== -1) {
      breakMatch(existing);
      return;
    }

    if (pendingTextId === pairId) {
      setPendingTextId(null);
      return;
    }

    if (pendingImageId !== null) {
      setMatches((current) => [...current, { imagePairId: pendingImageId, textPairId: pairId }]);
      setPendingImageId(null);
      setPendingTextId(null);
      return;
    }

    setPendingTextId(pairId);
  }

  function handleSubmit() {
    if (pairs.length === 0 || matches.length !== pairs.length) {
      return;
    }

    onAnswer({
      questionId: question.id,
      type: 'image_match',
      // ⚠️ Sıra KULLANICININ kurma sırası, içerik sırası değil. Faz 2.3
      // bunu KÜME olarak karşılaştırmalı; dizi karşılaştırması doğru cevabı
      // yanlış işaretler.
      matches,
    });
  }

  return (
    <QuestionShell
      instruction={strings.question.imageMatch}
      prompt={question.prompt}
      hint={question.hint}
      canSubmit={pairs.length > 0 && matches.length === pairs.length}
      onSubmit={handleSubmit}
      submitHint={strings.question.matchAllHint}
    >
      <View style={styles.grid}>
        {pairs.map((pair) => {
          const index = matchIndexOfImage(pair.id);
          return (
            <ImageTile
              key={pair.id}
              image={pair.image}
              selected={pendingImageId === pair.id}
              badge={index === -1 ? undefined : index + 1}
              onPress={() => handleImagePress(pair.id)}
            />
          );
        })}
      </View>

      <View style={styles.texts}>
        {shuffledTexts.map((pair) => {
          const index = matchIndexOfText(pair.id);
          const matched = index !== -1;
          return (
            <Chip
              key={pair.id}
              label={pair.text}
              selected={matched || pendingTextId === pair.id}
              badge={matched ? index + 1 : undefined}
              accessibilityLabel={
                matched
                  ? formatString(strings.a11y.matchedPair, { text: pair.text, number: index + 1 })
                  : pair.text
              }
              onPress={() => handleTextPress(pair.id)}
            />
          );
        })}
      </View>
    </QuestionShell>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: spacing.md,
    rowGap: spacing.md,
    justifyContent: 'space-between',
  },
  texts: {
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
});
