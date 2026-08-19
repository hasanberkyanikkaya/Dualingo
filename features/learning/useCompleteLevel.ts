import { useProgressStore } from '@/features/progress/store';

import type { LessonSummary } from '@/features/learning/lessonSession';

export type CompleteLevel = (summary: LessonSummary) => void;

/**
 * Ders sonucunun kalıcı dünyaya ulaştığı tek kapı — **dikiş yeri**.
 *
 * Faz 2.4'te gövdesi store'a bağlandı; **hiçbir çağrı yeri değişmedi**,
 * özellikle `app/lesson/[id].tsx` (2.4'ün kendi kuralı "arayüze dokunma").
 *
 * ⚠️ Çağıran taraf bunu bir `useEffect`'ten TETİKLEMEMELİ. `reactCompiler` açık
 * ve StrictMode geliştirmede etkileri iki kez çalıştırıyor; artık gövde gerçekten
 * yazdığı için XP iki kez verilirdi. Tamamlanma sinyali "Devam et" işleyicisinden
 * gidiyor (2.3 kararı).
 */
export function useCompleteLevel(): CompleteLevel {
  return useProgressStore((state) => state.completeLevel);
}
