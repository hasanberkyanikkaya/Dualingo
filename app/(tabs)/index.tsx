import { router } from 'expo-router';

import Screen from '@/components/Screen';
import LearningBackground from '@/features/learning/components/map/LearningBackground';
import LevelMap from '@/features/learning/components/map/LevelMap';

import type { LevelId } from '@/types';

// Öğrenme yolu ekranı — seviye haritası (Faz 2.1).
export default function LearnScreen() {
  function handleSelectLevel(levelId: LevelId) {
    // Nesne biçimi, dizge birleştirme değil: `app.json`'da `typedRoutes` açık ve
    // üretilen `Href` birleşimine dizge birleştirmesi kırılgan oturuyor.
    router.push({ pathname: '/lesson/[id]', params: { id: levelId } });
  }

  function openOrderingRace() {
    router.push('/games/ordering-race');
  }

  return (
    <Screen background={<LearningBackground />} tabPane>
      <LevelMap
        onOpenOrderingRace={openOrderingRace}
        onSelectLevel={handleSelectLevel}
      />
    </Screen>
  );
}
