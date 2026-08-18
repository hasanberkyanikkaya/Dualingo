import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { layout } from '@/constants/spacing';
import strings from '@/constants/strings';

import OptionCard from './OptionCard';
import QuestionShell from './QuestionShell';

import type { AnswerOfType, QuestionOfType } from '@/types';

type MultipleChoiceQuestionProps = {
  question: QuestionOfType<'multiple_choice'>;
  onAnswer: (answer: AnswerOfType<'multiple_choice'>) => void;
};

/**
 * Çoktan seçmeli soru: şıklar dikey kart listesi, tek seçim, altta "Kontrol et".
 *
 * **Doğru/yanlış GÖSTERMEZ.** `question.correctOptionId` bu bileşende hiç
 * okunmuyor; değerlendirme, geri bildirim ve açıklama Faz 2.3'ün ders akışına
 * ait. Bileşenin bildiği tek şey kullanıcının ne seçtiği.
 *
 * ⚠️ Prop tipi birleşik `Question` değil, `QuestionOfType<'multiple_choice'>`.
 * Birleşik tipi almak bileşeni içeride daraltmaya ve erişilemez bir `throw`
 * yazmaya zorlardı; Oturum 0.4'ün kurduğu ayrık birleşimin bütün faydası orada
 * harcanırdı. Daraltma ders ekranında `switch (question.type)` ile bir kez
 * yapılacak. `QuestionOfType` / `AnswerOfType` yardımcıları tam bu iş için
 * yazılmıştı; altı soru bileşeninin hepsi bunları kullanır.
 */
export default function MultipleChoiceQuestion({
  question,
  onAnswer,
}: MultipleChoiceQuestionProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  /**
   * ⚠️ Soru değişince seçim sıfırlanmalı.
   *
   * Ders ekranı soruyu sabit bir yuvada çizecek; React aynı bileşen örneğini
   * yeniden kullanır ve sıradaki soru ŞIKKI SEÇİLİ, "Kontrol et" ETKİN açılır.
   * Ders ekranı ayrıca `key={question.id}` vermeli (o sözleşme CLAUDE.md'de),
   * ama bileşen ona güvenmiyor — kendi içinde de koruyor.
   */
  const [renderedQuestionId, setRenderedQuestionId] = useState(question.id);
  if (renderedQuestionId !== question.id) {
    setRenderedQuestionId(question.id);
    setSelectedOptionId(null);
  }

  // Bozuk içerik sessizce güvenli (ProgressBar doktrini): şık yoksa hiçbir kart
  // çizilmez ve "Kontrol et" hiç etkinleşmez.
  const options = Array.isArray(question.options) ? question.options : [];

  if (__DEV__) {
    const seen = new Set<string>();
    for (const option of options) {
      if (seen.has(option.id)) {
        console.warn(
          `[MultipleChoiceQuestion] "${question.id}" sorusunda şık kimliği "${option.id}" yineleniyor — iki kart birlikte seçili görünür.`,
        );
      }
      seen.add(option.id);
    }
  }

  function handleSubmit() {
    if (selectedOptionId === null) {
      return;
    }

    onAnswer({
      questionId: question.id,
      type: 'multiple_choice',
      selectedOptionId,
    });
  }

  return (
    <QuestionShell
      instruction={strings.question.multipleChoice}
      prompt={question.prompt}
      hint={question.hint}
      canSubmit={selectedOptionId !== null}
      onSubmit={handleSubmit}
    >
      {/*
        Şıklar `View` + `gap` ile diziliyor. `FlatList` hem gereksiz (dört beş
        şık) hem zararlı: kabuğun ScrollView'u içinde iç içe kaydırma çıkarır.

        Grup etiketi bilerek verilmedi — üstteki soru bloğu zaten ne yapılacağını
        söylüyor ve Android'de grup etiketi her çocukta yeniden okunuyor.
      */}
      <View accessibilityRole="radiogroup" style={styles.options}>
        {options.map((option) => (
          <OptionCard
            key={option.id}
            label={option.text}
            selected={option.id === selectedOptionId}
            // Seçili şıkka tekrar basmak seçimi KALDIRMAZ — kullanıcı
            // yanlışlıkla cevapsız kalmasın.
            onPress={() => setSelectedOptionId(option.id)}
          />
        ))}
      </View>
    </QuestionShell>
  );
}

const styles = StyleSheet.create({
  options: {
    gap: layout.listGap,
  },
});
