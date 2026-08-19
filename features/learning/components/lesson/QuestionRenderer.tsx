import type { ReactNode } from 'react';

import AudioChoiceQuestion from '@/features/learning/components/question/AudioChoiceQuestion';
import FillBlankQuestion from '@/features/learning/components/question/FillBlankQuestion';
import ImageMatchQuestion from '@/features/learning/components/question/ImageMatchQuestion';
import MultipleChoiceQuestion from '@/features/learning/components/question/MultipleChoiceQuestion';
import OrderingQuestion from '@/features/learning/components/question/OrderingQuestion';
import TrueFalseQuestion from '@/features/learning/components/question/TrueFalseQuestion';

import type { Question, QuestionAnswer } from '@/types';

type QuestionRendererProps = {
  question: Question;
  isAnswered: boolean;
  /** Cevap sonrası alt bölüm — geri bildirim paneli */
  footer: ReactNode;
  onAnswer: (answer: QuestionAnswer) => void;
};

/**
 * Soru tipine göre doğru bileşeni çizer.
 *
 * ⚠️ **Birleşik `Question` tipinin daraltıldığı TEK yer.** Oturum 2.2a bu
 * daraltmayı bilerek buraya ertelemişti: altı bileşenin her biri kendi
 * `QuestionOfType<'…'>` tipini alıyor, böylece hiçbiri içeride daraltma yapıp
 * erişilemez bir `throw` yazmak zorunda kalmıyor. Ayrık birleşimin bütün
 * faydası bu tek `switch`te toplanıyor.
 *
 * ⚠️ **`key={question.id}` burada.** Ders ekranı soruyu sabit bir yuvada
 * çiziyor; anahtar olmasa React aynı örneği yeniden kullanır ve sıradaki soru
 * önceki cevabı seçili açılırdı. Soru bileşenleri kendi içlerinde de
 * korunuyor (`useQuestionState`) ama iki taraflı emniyet bilinçli.
 *
 * `switch` bütün tipleri kapsıyor; `default` yok ki içeriğe yeni bir tip
 * eklendiğinde derleyici burayı hata olarak göstersin.
 */
export default function QuestionRenderer({
  question,
  isAnswered,
  footer,
  onAnswer,
}: QuestionRendererProps) {
  switch (question.type) {
    case 'multiple_choice':
      return (
        <MultipleChoiceQuestion
          key={question.id}
          question={question}
          isAnswered={isAnswered}
          footer={footer}
          onAnswer={onAnswer}
        />
      );

    case 'true_false':
      return (
        <TrueFalseQuestion
          key={question.id}
          question={question}
          isAnswered={isAnswered}
          footer={footer}
          onAnswer={onAnswer}
        />
      );

    case 'ordering':
      return (
        <OrderingQuestion
          key={question.id}
          question={question}
          isAnswered={isAnswered}
          footer={footer}
          onAnswer={onAnswer}
        />
      );

    case 'fill_blank':
      return (
        <FillBlankQuestion
          key={question.id}
          question={question}
          isAnswered={isAnswered}
          footer={footer}
          onAnswer={onAnswer}
        />
      );

    case 'image_match':
      return (
        <ImageMatchQuestion
          key={question.id}
          question={question}
          isAnswered={isAnswered}
          footer={footer}
          onAnswer={onAnswer}
        />
      );

    case 'audio_choice':
      return (
        <AudioChoiceQuestion
          key={question.id}
          question={question}
          isAnswered={isAnswered}
          footer={footer}
          onAnswer={onAnswer}
        />
      );
  }
}
