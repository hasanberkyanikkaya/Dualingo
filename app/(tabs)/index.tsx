import Screen from '@/components/Screen';
import LevelMap from '@/features/learning/components/map/LevelMap';

import type { LevelId } from '@/types';

// Öğrenme yolu ekranı — seviye haritası (Faz 2.1).
export default function LearnScreen() {
  function handleSelectLevel(levelId: LevelId) {
    // TODO: Faz 2.3 — ders ekranı yazılınca `router.push('/lesson/' + levelId)`.
    // Şimdilik bilerek boş: `app/lesson/[id].tsx` henüz yok, var olmayan rotaya
    // gitmek uygulamayı hata ekranına düşürür.
    void levelId;
  }

  return (
    <Screen>
      <LevelMap onSelectLevel={handleSelectLevel} />
    </Screen>
  );
}
