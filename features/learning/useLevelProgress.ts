import { useProgressStore } from '@/features/progress/store';

import type { LevelId, LevelProgress } from '@/types';

/**
 * İlerleme kayıtlarının ekrana ulaştığı tek kapı — "dikiş yeri".
 *
 * Faz 2.4'te gövdesi store'a bağlandı ve `mockProgress.ts` silindi.
 * **Harita bileşenlerinin hiçbirine dokunulmadı** — kancanın düz bir fonksiyon
 * yerine kanca olarak yazılmasının bütün sebebi buydu.
 *
 * ⚠️ Seçici doğrudan `s.levels` veriyor; `unlock.ts` değişiklik olmadığında
 * AYNI referansı döndürdüğü için gereksiz yeniden çizim olmuyor.
 */
export function useLevelProgress(): Record<LevelId, LevelProgress> {
  return useProgressStore((state) => state.levels);
}
