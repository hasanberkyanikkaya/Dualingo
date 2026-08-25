import { StyleSheet, View } from 'react-native';

import { layout, spacing } from '@/constants/spacing';
import { countCompleted, resolveLevelStatus, resolveStars } from '@/features/learning/levelStatus';
import { NODE_SIZE, type UnitLayout } from '@/features/learning/pathLayout';

import LevelNode from './LevelNode';
import LearningPathDecoration from './LearningPathDecoration';
import PathTrail from './PathTrail';
import UnitHeader from './UnitHeader';

import type { LevelId, LevelProgress, Unit } from '@/types';

/**
 * Düğüm sarmalayıcısının genişliği — çapın iki katı.
 *
 * Düğümün kendisi 72px ama altındaki yazı ("Şu an buradasın") ona sığmıyor ve
 * iki satıra kırılıyordu. Sarmalayıcı geniş, disk ortalanmış duruyor.
 */
const NODE_WRAPPER_WIDTH = NODE_SIZE * 2;
const DECORATIONS = ['book', 'bulb', 'pencil', 'star'] as const;

type UnitSectionProps = {
  unit: Unit;
  /**
   * Yoldaki sıra, 1'den başlar.
   *
   * `unit.order` DEĞİL: içerik elle yazıldığı için sıra numaralarında boşluk
   * olabilir (10, 20, 30 gibi). Kullanıcıya gösterilen numara, sıralanmış
   * listedeki konumdur.
   */
  unitNumber: number;
  layout: UnitLayout;
  progress: Record<LevelId, LevelProgress>;
  currentLevelId: LevelId | null;
  onSelectLevel: (levelId: LevelId) => void;
};

/**
 * Bir ünitenin tamamı: başlık, ardından düğümlerin ve şeridin yaşadığı sabit
 * yükseklikli blok.
 *
 * Şerit her ünitenin KENDİ bloğunda duruyor; tek parça olsaydı ünite
 * başlıklarının üstünden geçerdi.
 */
export default function UnitSection({
  unit,
  unitNumber,
  layout: unitLayout,
  progress,
  currentLevelId,
  onSelectLevel,
}: UnitSectionProps) {
  return (
    <View style={styles.section}>
      <UnitHeader
        unitNumber={unitNumber}
        title={unit.title}
        iconName={unit.icon}
        completedCount={countCompleted(unit, progress)}
        totalCount={unit.levels.length}
      />

      <View style={{ width: unitLayout.width, height: unitLayout.height }}>
        <PathTrail
          width={unitLayout.width}
          height={unitLayout.height}
          segments={unitLayout.trailSegments}
        />

        {unitLayout.nodes.map((placement, index) =>
          index % 2 === 1 ? (
            <LearningPathDecoration
              key={`decoration-${placement.levelId}`}
              variant={DECORATIONS[(unitNumber + index) % DECORATIONS.length]}
              style={{
                left:
                  placement.x > unitLayout.width / 2
                    ? spacing.sm
                    : unitLayout.width - layout.minTouchTarget - spacing.sm,
                top: placement.y + NODE_SIZE / 2 + spacing.sm,
              }}
            />
          ) : null,
        )}

        {unitLayout.nodes.map((placement, index) => (
          <View
            key={placement.levelId}
            // Sarmalayıcı düğümün kendisinden geniş (aşağıdaki nota bak), bu
            // yüzden komşularla yatayda örtüşebiliyor. `box-none` ile
            // sarmalayıcı dokunuşa hiç aday olmuyor; yalnızca içindeki
            // Pressable hedef oluyor, yani örtüşme dokunuşu çalmıyor.
            pointerEvents="box-none"
            // Yerleşim düğümün MERKEZİNİ veriyor; sol köşeye çevirmek için
            // sarmalayıcının yarısı, üst köşe için yarım çap çıkarılıyor.
            style={[
              styles.node,
              { left: placement.x - NODE_WRAPPER_WIDTH / 2, top: placement.y - NODE_SIZE / 2 },
            ]}
          >
            <LevelNode
              levelNumber={index + 1}
              status={resolveLevelStatus(placement.levelId, progress)}
              isCurrent={placement.levelId === currentLevelId}
              stars={resolveStars(placement.levelId, progress)}
              onPress={() => onSelectLevel(placement.levelId)}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: layout.sectionGap,
  },
  node: {
    position: 'absolute',
    width: NODE_WRAPPER_WIDTH,
    alignItems: 'center',
  },
});
