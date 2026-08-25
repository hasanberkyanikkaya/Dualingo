import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { componentRadius } from '@/constants/radius';
import { spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { useTheme } from '@/lib/useTheme';

import type { GardenProgress } from '@/features/prayer/prayerGarden';

type GardenSceneProps = {
  progress: GardenProgress;
};

const PLANT_X = [42, 86, 132, 184, 232, 278, 322] as const;
const FLOWERS = [
  { x: 54, y: 198 },
  { x: 78, y: 216 },
  { x: 112, y: 192 },
  { x: 144, y: 218 },
  { x: 176, y: 196 },
  { x: 204, y: 214 },
  { x: 236, y: 190 },
  { x: 262, y: 216 },
  { x: 292, y: 194 },
  { x: 318, y: 214 },
  { x: 96, y: 228 },
  { x: 246, y: 230 },
] as const;
const TREES = [82, 180, 278] as const;

export default function GardenScene({ progress }: GardenSceneProps) {
  const { theme } = useTheme();

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={strings.prayer.gardenSceneA11y}
      style={[styles.frame, { backgroundColor: theme.gardenSky }]}
    >
      <Svg width="100%" height="100%" viewBox="0 0 360 260">
        <Rect x="0" y="0" width="360" height="260" fill={theme.gardenSky} />
        <Circle cx="308" cy="46" r="22" fill={theme.secondary} />

        <G fill={theme.surface} opacity={0.82}>
          <Ellipse cx="58" cy="48" rx="30" ry="13" />
          <Circle cx="42" cy="42" r="13" />
          <Circle cx="66" cy="38" r="17" />
          <Ellipse cx="182" cy="72" rx="27" ry="11" />
          <Circle cx="168" cy="67" r="12" />
          <Circle cx="188" cy="64" r="15" />
        </G>

        <Path
          d="M0 164 C64 136 112 166 174 148 C238 130 300 144 360 120 L360 260 L0 260 Z"
          fill={theme.gardenGround}
        />
        <Path
          d="M0 220 C72 198 126 226 192 208 C260 190 316 206 360 190 L360 260 L0 260 Z"
          fill={theme.gardenSoil}
        />

        {TREES.slice(0, progress.treeCount).map((x, index) => (
          <G key={x}>
            <Rect x={x - 5} y={118 - index * 5} width="10" height="82" rx="5" fill={theme.gardenTrunk} />
            <Circle cx={x} cy={108 - index * 5} r="31" fill={theme.success} />
            <Circle cx={x - 20} cy={119 - index * 5} r="21" fill={theme.success} />
            <Circle cx={x + 20} cy={119 - index * 5} r="21" fill={theme.success} />
          </G>
        ))}

        {PLANT_X.slice(0, progress.plantCount).map((x, index) => {
          const height = 20 + (index % 3) * 6;
          return (
            <G key={x}>
              <Path
                d={`M${x} 222 C${x - 2} ${222 - height / 2} ${x + 2} ${222 - height} ${x} ${222 - height}`}
                stroke={theme.success}
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
              <Ellipse cx={x - 7} cy={209 - index % 3} rx="8" ry="4" fill={theme.success} transform={`rotate(-28 ${x - 7} ${209 - index % 3})`} />
              <Ellipse cx={x + 7} cy={201 - index % 2} rx="8" ry="4" fill={theme.success} transform={`rotate(28 ${x + 7} ${201 - index % 2})`} />
            </G>
          );
        })}

        {FLOWERS.slice(0, progress.flowerCount).map(({ x, y }, index) => (
          <G key={`${x}-${y}`}>
            <Rect x={x - 1} y={y} width="2" height="18" fill={theme.success} />
            {[0, 1, 2, 3].map((petal) => {
              const offsets = [
                { dx: 0, dy: -6 },
                { dx: 6, dy: 0 },
                { dx: 0, dy: 6 },
                { dx: -6, dy: 0 },
              ] as const;
              const offset = offsets[petal];
              return (
                <Circle
                  key={petal}
                  cx={x + offset.dx}
                  cy={y + offset.dy}
                  r="5"
                  fill={index % 2 === 0 ? theme.gardenFlower : theme.secondary}
                />
              );
            })}
            <Circle cx={x} cy={y} r="4" fill={theme.secondaryStrong} />
          </G>
        ))}

        {progress.totalPrayers === 0 ? (
          <G>
            <Ellipse cx="180" cy="218" rx="11" ry="5" fill={theme.gardenTrunk} />
            <Circle cx="180" cy="214" r="4" fill={theme.secondaryStrong} />
          </G>
        ) : null}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    height: spacing.huge * 4,
    overflow: 'hidden',
    borderRadius: componentRadius.card,
  },
});
