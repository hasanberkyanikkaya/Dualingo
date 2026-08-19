import strings from '@/constants/strings';

import ChoiceList from './ChoiceList';
import QuestionShell from './QuestionShell';
import { useQuestionState } from './useQuestionState';

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
 * yapılacak. Altı soru bileşeninin hepsi bu kalıbı izler.
 */
export default function MultipleChoiceQuestion({
  question,
  onAnswer,
}: MultipleChoiceQuestionProps) {
  const [selectedOptionId, setSelectedOptionId] = useQuestionState<string | null>(
    question.id,
    null,
  );

  // Bozuk içerik sessizce güvenli: şık yoksa hiçbir kart çizilmez ve
  // "Kontrol et" hiç etkinleşmez.
  const options = Array.isArray(question.options) ? question.options : [];

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
      <ChoiceList
        options={options}
        selectedId={selectedOptionId}
        onSelect={setSelectedOptionId}
        questionId={question.id}
      />
    </QuestionShell>
  );
}
