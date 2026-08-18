import { mockLevelProgress } from '@/features/learning/mockProgress';

import type { LevelId, LevelProgress } from '@/types';

/**
 * İlerleme kayıtlarının ekrana ulaştığı tek kapı — "dikiş yeri".
 *
 * Bugün sahte veriyi döndürüyor. Faz 2.4'te gövdesi Zustand store'una bağlanacak
 * (`useProgressStore((s) => s.levels)`) ve `mockProgress.ts` silinecek.
 *
 * ⚠️ Bilerek **fonksiyon değil kanca**. Düz bir `getMockProgress()` yazsaydık
 * Faz 2.4'te fonksiyon çağrısı kanca çağrısına dönüşecek, yani her çağrı yeri
 * değişecekti. Kanca olarak yazıldığı için o gün sadece bu dosyanın gövdesi
 * değişir; harita bileşenlerine hiç dokunulmaz.
 */
export function useLevelProgress(): Record<LevelId, LevelProgress> {
  return mockLevelProgress;
}
