import { useCallback } from 'react';

import type { LessonSummary } from '@/features/learning/lessonSession';

export type CompleteLevel = (summary: LessonSummary) => void;

/**
 * Ders sonucunun kalıcı dünyaya ulaştığı tek kapı — **dikiş yeri**.
 *
 * Bugün hiçbir şey kaydetmiyor; Faz 2.3 hesaplayıp gösteriyor, kaydetme ve
 * kilit açma Faz 2.4'ün işi. O gün bu kancanın gövdesi
 * `useProgressStore((s) => s.completeLevel)` olacak ve **hiçbir çağrı yeri
 * değişmeyecek** — özellikle `app/lesson/[id].tsx`, ki 2.4'ün kendi kuralı
 * "UI'a dokunma" diyor.
 *
 * Projenin üçüncü kez kullandığı kalıp: `useLevelProgress` (2.1) ve
 * `useQuestionAudio` (2.2f) aynı sebeple var.
 *
 * ⚠️ Çağıran taraf bunu bir `useEffect`'ten TETİKLEMEMELİ. `reactCompiler`
 * açık ve StrictMode geliştirmede etkileri iki kez çalıştırıyor; 2.4 gövdeyi
 * doldurduğu anda XP iki kez verilirdi. Tamamlanma sinyali "Devam et"
 * işleyicisinden gider.
 */
export function useCompleteLevel(): CompleteLevel {
  return useCallback((summary: LessonSummary) => {
    if (__DEV__) {
      console.log(
        `[useCompleteLevel] "${summary.levelId}" bitti — ${summary.correct}/${summary.total}, ` +
          `${summary.stars} yıldız, +${summary.xpEarned} XP. Kayıt Faz 2.4'te.`,
      );
    }
  }, []);
}
