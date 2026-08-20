import { useProgressStore } from '@/features/progress/store';

import type { DailyGoal, Difficulty, PlacementResult } from '@/types';

/**
 * Tespit sonucunun ve günlük hedefin ekrana ulaştığı kapılar — **dikiş yerleri**.
 *
 * `useLevelProgress` / `useCompleteLevel` kalıbının aynısı: ekranlar store'u
 * doğrudan import etmiyor, bu ince seçicilerden okuyor. Store'un şekli
 * değişirse değişecek yer burası.
 */

/** Tespit sınavı sonucu. `null` ise karşılama akışı hiç tamamlanmamıştır. */
export function usePlacement(): PlacementResult | null {
  return useProgressStore((state) => state.placement);
}

export type SetPlacement = (declared: Difficulty, correct: number, total: number) => void;

/**
 * Sınav sonucunu yazar.
 *
 * ⚠️ Bir `useEffect`'ten TETİKLENMEMELİ — `useCompleteLevel`'daki gerekçenin
 * aynısı: `reactCompiler` açık, StrictMode etkileri iki kez çalıştırıyor ve
 * yerleştirme iki kez uygulanırdı.
 */
export function useSetPlacement(): SetPlacement {
  return useProgressStore((state) => state.setPlacement);
}

export function useDailyGoal(): DailyGoal | null {
  return useProgressStore((state) => state.dailyGoal);
}

export function useSetDailyGoal(): (goal: DailyGoal) => void {
  return useProgressStore((state) => state.setDailyGoal);
}
