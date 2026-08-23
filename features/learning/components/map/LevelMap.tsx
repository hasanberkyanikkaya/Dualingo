import { useMemo, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ScreenHeader from '@/components/ScreenHeader';
import { layout, spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import { getLearningPath } from '@/features/learning/contentLoader';
import { findCurrentLevelId } from '@/features/learning/levelStatus';
import { buildMapLayout } from '@/features/learning/pathLayout';
import { useLevelProgress } from '@/features/learning/useLevelProgress';
import { useTheme } from '@/lib/useTheme';

import UnitSection from './UnitSection';

import type { LevelId } from '@/types';

type LevelMapProps = {
  onSelectLevel: (levelId: LevelId) => void;
  topContent?: ReactNode;
};

/**
 * Duolingo tarzı seviye haritası — Öğren sekmesinin gövdesi.
 *
 * Veriyi kendi alıyor (`getLearningPath` + `useLevelProgress`), ekran dosyası
 * ince kalsın diye (mimari kural 2). Bunun ikinci kazancı: Faz 2.4'te sahte
 * ilerleme gerçek store'la değiştiğinde `/app` altında hiçbir şey değişmiyor.
 */
export default function LevelMap({ onSelectLevel, topContent }: LevelMapProps) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const path = getLearningPath();
  const progress = useLevelProgress();

  // ⚠️ Pencere genişliği yatay güvenli alan payını BİLMEZ. `Screen` içeriği
  // `edges={['left','right']}` ile sarıyor, yani çentikli bir cihazda yatay
  // modda o pay içeriden düşüyor. Çıkarılmazsa harita ~40–90px fazla geniş
  // hesaplanır ve düğümler kenardan taşar.
  const mapWidth =
    width - insets.left - insets.right - layout.screenPaddingHorizontal * 2;

  const mapLayout = useMemo(() => buildMapLayout(path.units, mapWidth), [path.units, mapWidth]);

  const currentLevelId = findCurrentLevelId(path.units, progress);

  // "İçerik yok" ile "henüz çizilecek genişlik yok" ayrı şeyler. Ölçü
  // anlamsızsa (0 ya da negatif) harita çizilmiyor ama kullanıcıya içerik
  // yokmuş gibi de söylenmiyor — yanlış mesaj sessizlikten kötü.
  const hasContent = path.units.length > 0;
  const canDraw = mapLayout.units.length > 0;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      <ScreenHeader title={strings.learn.title} subtitle={strings.learn.pathSubtitle} />

      {topContent}

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
  );
}

const styles = StyleSheet.create({
  content: {
    // Son ünitenin altındaki nefes payı — sekme çubuğuna yapışmasın.
    paddingBottom: spacing.xxxl,
  },
  empty: {
    marginTop: spacing.xl,
  },
});
