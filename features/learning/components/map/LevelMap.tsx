import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { layout, spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import LearningGamesModal from '@/features/games/components/LearningGamesModal';
import { getLearningPath } from '@/features/learning/contentLoader';
import { findCurrentLevelId } from '@/features/learning/levelStatus';
import { buildMapLayout } from '@/features/learning/pathLayout';
import { useLevelProgress } from '@/features/learning/useLevelProgress';
import { useProgressStore } from '@/features/progress/store';
import { useTheme } from '@/lib/useTheme';

import LearningHud from './LearningHud';
import UnitSection from './UnitSection';

import type { LevelId } from '@/types';

type LevelMapProps = {
  onSelectLevel: (levelId: LevelId) => void;
  onOpenOrderingRace: () => void;
};

type CurrentMapPosition = {
  unitNumber: number;
  levelNumber: number;
  totalLevels: number;
};

function resolveCurrentPosition(
  units: ReturnType<typeof getLearningPath>['units'],
  currentLevelId: LevelId | null,
): CurrentMapPosition | null {
  for (let unitIndex = 0; unitIndex < units.length; unitIndex += 1) {
    const levelIndex = units[unitIndex].levels.findIndex((level) => level.id === currentLevelId);
    if (levelIndex >= 0) {
      return {
        unitNumber: unitIndex + 1,
        levelNumber: levelIndex + 1,
        totalLevels: units[unitIndex].levels.length,
      };
    }
  }

  for (let unitIndex = units.length - 1; unitIndex >= 0; unitIndex -= 1) {
    const totalLevels = units[unitIndex].levels.length;
    if (totalLevels > 0) {
      return { unitNumber: unitIndex + 1, levelNumber: totalLevels, totalLevels };
    }
  }

  return null;
}

/**
 * Duolingo tarzı seviye haritası — Öğren sekmesinin gövdesi.
 *
 * Veriyi kendi alıyor (`getLearningPath` + `useLevelProgress`), ekran dosyası
 * ince kalsın diye (mimari kural 2). Bunun ikinci kazancı: Faz 2.4'te sahte
 * ilerleme gerçek store'la değiştiğinde `/app` altında hiçbir şey değişmiyor.
 */
export default function LevelMap({ onSelectLevel, onOpenOrderingRace }: LevelMapProps) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [gamesVisible, setGamesVisible] = useState(false);

  const path = getLearningPath();
  const progress = useLevelProgress();
  const streakDays = useProgressStore((state) => state.streak.currentDays);

  // ⚠️ Pencere genişliği yatay güvenli alan payını BİLMEZ. `Screen` içeriği
  // `edges={['left','right']}` ile sarıyor, yani çentikli bir cihazda yatay
  // modda o pay içeriden düşüyor. Çıkarılmazsa harita ~40–90px fazla geniş
  // hesaplanır ve düğümler kenardan taşar.
  const mapWidth =
    width - insets.left - insets.right - layout.screenPaddingHorizontal * 2;

  const mapLayout = useMemo(() => buildMapLayout(path.units, mapWidth), [path.units, mapWidth]);

  const currentLevelId = findCurrentLevelId(path.units, progress);
  const currentPosition = resolveCurrentPosition(path.units, currentLevelId);

  // "İçerik yok" ile "henüz çizilecek genişlik yok" ayrı şeyler. Ölçü
  // anlamsızsa (0 ya da negatif) harita çizilmiyor ama kullanıcıya içerik
  // yokmuş gibi de söylenmiyor — yanlış mesaj sessizlikten kötü.
  const hasContent = path.units.length > 0;
  const canDraw = mapLayout.units.length > 0;

  return (
    <View style={styles.root}>
      {currentPosition === null ? null : (
        <LearningHud
          streakDays={streakDays}
          onOpenGames={() => setGamesVisible(true)}
          {...currentPosition}
        />
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.heading}>
          <Text accessibilityRole="header" style={[textStyles.h1, { color: theme.textPrimary }]}>
            {strings.learn.title}
          </Text>
          <Text style={[textStyles.bodyMedium, { color: theme.textSecondary }]}>
            {strings.learn.pathSubtitle}
          </Text>
        </View>

        {!hasContent ? (
          <View style={styles.empty}>
            <Text style={[textStyles.bodyMedium, { color: theme.textSecondary }]}>
              {strings.learn.emptyPath}
            </Text>
          </View>
        ) : (
          canDraw &&
          mapLayout.units.map((unitLayout, index) => (
            <UnitSection
              key={unitLayout.unitId}
              unit={path.units[index]}
              unitNumber={index + 1}
              layout={unitLayout}
              progress={progress}
              currentLevelId={currentLevelId}
              onSelectLevel={onSelectLevel}
            />
          ))
        )}
      </ScrollView>

      <LearningGamesModal
        onClose={() => setGamesVisible(false)}
        onOpenOrderingRace={onOpenOrderingRace}
        visible={gamesVisible}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  heading: { gap: spacing.xs },
  empty: {
    marginTop: spacing.xl,
  },
});
