import { useState, type Dispatch, type SetStateAction } from 'react';

import type { QuestionId } from '@/types';

/**
 * Soru değiştiğinde kendini sıfırlayan bileşen durumu.
 *
 * ⚠️ Neden gerekli: ders ekranı soruyu sabit bir yuvada çizecek. React aynı
 * bileşen örneğini yeniden kullanır ve sıradaki soru **önceki cevabı seçili,
 * "Kontrol et" etkin** açılır. Ders ekranı ayrıca `key={question.id}` vermeli
 * (o sözleşme CLAUDE.md'de) ama soru bileşenleri ona güvenmiyor.
 *
 * Kalıp React'in resmî "prop değişince state ayarla" çözümü: çizim sırasında
 * `setState`. Etki (`useEffect`) ile yapılsaydı arada bir kare eski seçimle
 * çizilirdi. `reactCompiler` açık ve bu kalıp onunla uyumlu.
 *
 * Birden çok durum yuvası olan bileşen bunu birden çok kez çağırır; her yuva
 * kendi `renderedQuestionId`'sini tutar.
 */
export function useQuestionState<T>(
  questionId: QuestionId,
  initial: T,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(initial);
  const [renderedQuestionId, setRenderedQuestionId] = useState(questionId);

  if (renderedQuestionId !== questionId) {
    setRenderedQuestionId(questionId);
    setValue(initial);
  }

  return [value, setValue];
}
