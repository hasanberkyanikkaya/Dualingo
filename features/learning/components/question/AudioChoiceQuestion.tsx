import type { ReactNode } from 'react';

import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { componentRadius } from '@/constants/radius';
import { layout, spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import { useQuestionAudio } from '@/features/learning/useQuestionAudio';
import { useTheme } from '@/lib/useTheme';

import ChoiceList from './ChoiceList';
import QuestionShell from './QuestionShell';
import { useQuestionState } from './useQuestionState';

import type { AnswerOfType, QuestionOfType } from '@/types';

const PLAY_ICON_SIZE = spacing.xxl; // 32

type AudioChoiceQuestionProps = {
  question: QuestionOfType<'audio_choice'>;
  onAnswer: (answer: AnswerOfType<'audio_choice'>) => void;
  /** Cevap verildi mi — şıklar kilitlenir, alt bölümü `footer` devralır */
  isAnswered?: boolean;
  footer?: ReactNode;
};

/**
 * Dinle ve seç. Şık listesi çoktan seçmelinin aynısı; farkı üstteki ses uyaranı.
 *
 * ⚠️ **Ses yokken oynat butonu ÇİZİLMEZ**, pasif hâlde de durmaz.
 * `types/learning.ts` bu kararı zaten vermiş: *"Dosya yoksa ses butonu görünmez,
 * soru yazılı çalışır."* Pasif bir buton "ses var ama bozuk" der — bugün yanlış,
 * ve Faz 2.5'te ikinci kez geri alınacak bir karar olurdu.
 * (`strings.lesson.audioUnavailable` boşta değil; o, 2.5'in *geçici* hatası
 * için — dosya bekleniyor ama indirilemiyor. Farklı bir durum.)
 *
 * ⚠️ **`fallbackPrompt`, `question.prompt`'un yerine GEÇMEZ** — ses uyaranının
 * yerine geçer. Örnek veri bunu doğruluyor: `prompt` "ÖRNEK SORU 2",
 * `fallbackPrompt` "ÖRNEK YEDEK METİN — ses yokken bu görünür". Biri diğerinin
 * yerine konsaydı soru metni silinirdi. Soru kabukta kalıyor, yedek metin
 * oynat butonunun yerinde bir uyaran bloğu oluyor.
 *
 * `question.correctOptionId` okunmuyor.
 */
export default function AudioChoiceQuestion({
  question,
  onAnswer,
  isAnswered = false,
  footer,
}: AudioChoiceQuestionProps) {
  const { theme } = useTheme();
  const audio = useQuestionAudio(question.audio);

  const [selectedOptionId, setSelectedOptionId] = useQuestionState<string | null>(
    question.id,
    null,
  );

  const options = Array.isArray(question.options) ? question.options : [];

  function handleSubmit() {
    if (selectedOptionId === null) {
      return;
    }

    onAnswer({
      questionId: question.id,
      type: 'audio_choice',
      selectedOptionId,
      // Sabit yazılmıyor: bugün `true`, Faz 2.5'te ses çalışınca kendiliğinden
      // doğru değeri alacak.
      answeredWithFallback: !audio.available,
    });
  }

  return (
    <QuestionShell
      instruction={strings.question.audioChoice}
      prompt={question.prompt}
      hint={question.hint}
      canSubmit={selectedOptionId !== null}
      onSubmit={handleSubmit}
      isAnswered={isAnswered}
      footer={footer}
    >
      {audio.available ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            audio.isPlaying ? strings.lesson.replayAudio : strings.a11y.playAudioButton
          }
          onPress={audio.play}
          style={styles.playRow}
        >
          <View style={[styles.playButton, { backgroundColor: theme.primary }]}>
            <Ionicons
              name={audio.isPlaying ? 'volume-high' : 'play'}
              size={PLAY_ICON_SIZE}
              color={theme.onPrimary}
            />
          </View>
          <Text style={[textStyles.labelLarge, { color: theme.primary }]}>
            {strings.lesson.playAudio}
          </Text>
        </Pressable>
      ) : (
        <View style={[styles.fallback, { borderColor: theme.borderControl }]}>
          <Text style={[textStyles.bodyLarge, { color: theme.textPrimary }]}>
            {question.fallbackPrompt}
          </Text>
        </View>
      )}

      <ChoiceList
        options={options}
        selectedId={selectedOptionId}
        onSelect={setSelectedOptionId}
        questionId={question.id}
        disabled={isAnswered}
      />
    </QuestionShell>
  );
}

const styles = StyleSheet.create({
  playRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  playButton: {
    width: layout.minTouchTarget + spacing.sm,
    height: layout.minTouchTarget + spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: componentRadius.chip,
  },
  // Yedek metin bir uyaran, süs değil — kenarlıkla çerçevelenip soru
  // metninden ayrılıyor.
  fallback: {
    padding: layout.cardPadding,
    borderWidth: 2,
    borderRadius: componentRadius.card,
  },
});
