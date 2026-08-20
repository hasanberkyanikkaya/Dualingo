import { useMemo } from 'react';

import { getBadgeDefinitions } from '@/features/learning/contentLoader';
import { useProgressStore } from '@/features/progress/store';

import type { BadgeDefinition, BadgeId, Timestamp } from '@/types';

/**
 * Rozet tanımlarını kazanımlarla birleştirir — arayüzün tek okuma noktası.
 *
 * `useLevelProgress` kalıbı: ekranlar store'un şeklini değil bu kancanın
 * sonucunu tanır. Katalog OTA ile değişebiliyor, kazanım tablosu değişmiyor;
 * ikisini birleştiren yer tek olmalı.
 *
 * ⚠️ **Tabloda olup katalogda olmayan kazanım sessizce ATLANIR.** İçerik geri
 * alınırsa (OTA) kayıt öksüz kalır ama silinmez — gösterilecek adı ve ikonu
 * olmadığı için çizilemez, o kadar.
 */
export type BadgeView = BadgeDefinition & {
  earned: boolean;
  /** Kazanılmamışsa `null`. */
  earnedAt: Timestamp | null;
};

export function useBadges(): readonly BadgeView[] {
  const badges = useProgressStore((state) => state.badges);

  return useMemo(() => {
    const earnedAt = new Map<BadgeId, Timestamp>(
      badges.map((unlock) => [unlock.badgeId, unlock.earnedAt]),
    );

    return getBadgeDefinitions().map((definition) => ({
      ...definition,
      earned: earnedAt.has(definition.id),
      earnedAt: earnedAt.get(definition.id) ?? null,
    }));
  }, [badges]);
}

/** Kazanılan rozetlerin sayısı — bölüm başlığı ve boş durum için. */
export function useEarnedBadgeCount(): number {
  return useProgressStore((state) => state.badges.length);
}
