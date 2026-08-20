import strings from '@/constants/strings';
import { normalizeTr } from '@/lib/turkishText';
import { buildSentence } from '@/features/learning/fillBlankLayout';
import { warnContent } from '@/features/learning/questionValidation';

import type { Question, QuestionAnswer } from '@/types';

/**
 * Cevap değerlendirme motoru — saf. React yok, tema yok, arayüz yok.
 *
 * Soru bileşenleri doğruyu bilmez ve bilmemeli (2.2 kararı); doğruluk kararı
 * yalnızca burada veriliyor. Hiçbir fonksiyon hata fırlatmaz — bozuk içerik
 * uygulamayı düşürmez, `false` ya da boş liste döner.
 */

/**
 * Türkçe duyarlı küçültme.
 *
 * ⚠️ Gövde Faz 4.1'de `lib/turkishText.ts`e TAŞINDI — namaz modülü de ona
 * ihtiyaç duyuyor ve oradan bu dosyayı import etmek cevap motorunun tamamını
 * namaz paketine sokardı. Buradaki yeniden dışa aktarım kasıtlı: motorun
 * kuralı (`answerEngine.normalizeTr`) hâlâ tek bir addır ve doğrulayıcı
 * (`contentValidation.ts`) ile testler değişmedi.
 */
export { normalizeTr };

/**
 * Soru gerçekten cevaplanabilir mi.
 *
 * ⚠️ Bunun olmaması kullanıcıyı KİLİTLİYOR: içerik bozuksa hiç şık çizilmiyor,
 * "Kontrol et" sonsuza dek pasif kalıyor ve ders bitmiyor. Ders oturumu bunu
 * başlangıçta bir kez uygulayıp cevaplanamayan soruları eliyor.
 */
export function isAnswerable(question: Question): boolean {
  switch (question.type) {
    case 'multiple_choice':
    case 'audio_choice':
      return (
        question.options.length >= 2 &&
        question.options.some((option) => option.id === question.correctOptionId)
      );

    case 'true_false':
      return typeof question.correctAnswer === 'boolean';

    case 'ordering':
      return (
        question.items.length >= 2 &&
        question.correctOrder.length === question.items.length &&
        question.correctOrder.every((id) => question.items.some((item) => item.id === id))
      );

    case 'fill_blank': {
      // `renderedBlankIds` tam bu iş için var (2.2d): gerçekten çizilecek
      // boşlukları veriyor, ham `blanks` dizisini değil.
      const { renderedBlankIds } = buildSentence(
        question.segments,
        question.blanks,
        `"${question.id}"`,
      );
      if (renderedBlankIds.length === 0) {
        return false;
      }
      return renderedBlankIds.every((blankId) => {
        const blank = question.blanks.find((candidate) => candidate.id === blankId);
        return (blank?.correctAnswers ?? []).some((answer) => answer.trim().length > 0);
      });
    }

    case 'image_match':
      return question.pairs.length >= 2;
  }
}

/**
 * Cevap doğru mu.
 *
 * Önce kimlik ve tip denetleniyor: yanlış soruya ait bir cevap sessizce doğru
 * sayılmasın.
 */
export function checkAnswer(question: Question, answer: QuestionAnswer): boolean {
  if (question.id !== answer.questionId || question.type !== answer.type) {
    return false;
  }

  switch (question.type) {
    case 'multiple_choice':
      return (
        answer.type === 'multiple_choice' && answer.selectedOptionId === question.correctOptionId
      );

    case 'audio_choice':
      return answer.type === 'audio_choice' && answer.selectedOptionId === question.correctOptionId;

    case 'true_false':
      return answer.type === 'true_false' && answer.value === question.correctAnswer;

    case 'ordering':
      return (
        answer.type === 'ordering' &&
        answer.order.length === question.correctOrder.length &&
        answer.order.every((id, index) => id === question.correctOrder[index])
      );

    case 'fill_blank': {
      if (answer.type !== 'fill_blank' || answer.entries.length === 0) {
        return false;
      }
      return answer.entries.every((entry) => {
        // ⚠️ Boşluk `blankId` ile aranır, indeksle DEĞİL: bileşen boşlukları
        // çizim sırasına göre gönderiyor ve bozuk içerikte o sıra ham diziyle
        // örtüşmeyebilir.
        const blank = question.blanks.find((candidate) => candidate.id === entry.blankId);
        if (blank === undefined) {
          return false;
        }
        const given = normalizeTr(entry.value);
        return blank.correctAnswers.some((accepted) => normalizeTr(accepted) === given);
      });
    }

    case 'image_match': {
      if (answer.type !== 'image_match') {
        return false;
      }
      // ⚠️ KÜME karşılaştırması, dizi değil — `matches` sırası kullanıcının
      // eşleştirme sırası. Doğru eşleşme çiftin kimliğinden okunuyor
      // (`pairs[i].image` ile `pairs[i].text` aynı `id`yi taşıyor).
      const seen = new Set<string>();
      for (const match of answer.matches) {
        if (match.imagePairId !== match.textPairId) {
          return false;
        }
        if (seen.has(match.imagePairId)) {
          return false;
        }
        seen.add(match.imagePairId);
      }
      return seen.size === question.pairs.length;
    }
  }
}

/**
 * Doğru cevabın okunabilir hâli.
 *
 * **Dizi döndürüyor, dizge değil.** Tek karar altı özel durumu siliyor:
 * sıralamada her konum, boşluk doldurmada her boşluk, eşleştirmede her çift
 * kendi satırını alıyor. Çağıran taraf tek parçaysa tek satır, değilse liste
 * çiziyor.
 */
export function describeCorrectAnswer(question: Question): string[] {
  switch (question.type) {
    case 'multiple_choice':
    case 'audio_choice': {
      const option = question.options.find((candidate) => candidate.id === question.correctOptionId);
      return option === undefined ? [] : [option.text];
    }

    case 'true_false':
      return [question.correctAnswer ? strings.question.trueLabel : strings.question.falseLabel];

    case 'ordering':
      return question.correctOrder
        .map((id) => question.items.find((item) => item.id === id)?.text)
        .filter((text): text is string => text !== undefined);

    case 'fill_blank':
      // İlk kabul edilen cevap "kanonik" yazım sayılıyor; dizinin geri kalanı
      // kabul edilen varyantlar, gösterim adayı değil.
      return question.blanks
        .map((blank) => blank.correctAnswers[0])
        .filter((value): value is string => value !== undefined);

    case 'image_match':
      // Yer tutucu `alt` metniyle bugün gürültü gibi duruyor ama boş dönmek,
      // yanlış yapan kullanıcıya hiçbir şey öğretmemek demek. Asıl çözüm
      // içerikte: açıklaması olmayan eşleştirme sorusu uyarılıyor.
      if (__DEV__ && (question.explanation ?? '').trim().length === 0) {
        warnContent(`"${question.id}"`, 'image_match sorusunun açıklaması yok — yanlış cevap öğretici olmuyor.');
      }
      return question.pairs.map((pair) => `${pair.image.alt} → ${pair.text}`);
  }
}

/** Kullanıcının verdiği cevabın okunabilir hâli. Aynı dizi biçimi. */
export function describeGivenAnswer(question: Question, answer: QuestionAnswer): string[] {
  if (question.id !== answer.questionId || question.type !== answer.type) {
    return [];
  }

  switch (question.type) {
    case 'multiple_choice':
    case 'audio_choice': {
      if (answer.type !== 'multiple_choice' && answer.type !== 'audio_choice') {
        return [];
      }
      const option = question.options.find((candidate) => candidate.id === answer.selectedOptionId);
      return option === undefined ? [] : [option.text];
    }

    case 'true_false':
      if (answer.type !== 'true_false') {
        return [];
      }
      return [answer.value ? strings.question.trueLabel : strings.question.falseLabel];

    case 'ordering':
      if (answer.type !== 'ordering') {
        return [];
      }
      return answer.order
        .map((id) => question.items.find((item) => item.id === id)?.text)
        .filter((text): text is string => text !== undefined);

    case 'fill_blank':
      if (answer.type !== 'fill_blank') {
        return [];
      }
      return answer.entries.map((entry) => entry.value);

    case 'image_match': {
      if (answer.type !== 'image_match') {
        return [];
      }
      return answer.matches
        .map((match) => {
          const image = question.pairs.find((pair) => pair.id === match.imagePairId);
          const text = question.pairs.find((pair) => pair.id === match.textPairId);
          if (image === undefined || text === undefined) {
            return undefined;
          }
          return `${image.image.alt} → ${text.text}`;
        })
        .filter((line): line is string => line !== undefined);
    }
  }
}
