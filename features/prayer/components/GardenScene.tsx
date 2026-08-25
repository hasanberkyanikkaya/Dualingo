import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Polygon, Rect } from 'react-native-svg';

import { componentRadius } from '@/constants/radius';
import { spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { useTheme } from '@/lib/useTheme';

import type { GardenProgress } from '@/features/prayer/prayerGarden';

type GardenSceneProps = {
  progress: GardenProgress;
};

const SPROUTS = [
  { x: 105, y: 171, scale: 0.8 },
  { x: 150, y: 196, scale: 1 },
  { x: 208, y: 184, scale: 0.9 },
  { x: 250, y: 162, scale: 0.75 },
  { x: 122, y: 222, scale: 0.9 },
  { x: 194, y: 228, scale: 1 },
  { x: 270, y: 204, scale: 0.85 },
] as const;

const FLOWERS = [
  { x: 92, y: 184 },
  { x: 119, y: 198 },
  { x: 154, y: 214 },
  { x: 185, y: 192 },
  { x: 218, y: 210 },
  { x: 252, y: 188 },
  { x: 278, y: 174 },
  { x: 110, y: 232 },
  { x: 143, y: 242 },
  { x: 213, y: 240 },
  { x: 246, y: 226 },
  { x: 288, y: 207 },
] as const;

const TREES = [
  { x: 116, y: 148, scale: 0.82 },
  { x: 180, y: 126, scale: 1 },
  { x: 248, y: 148, scale: 0.82 },
] as const;

/** Kayıtlarla değişen, katmanlı izometrik bahçe sahnesi. */
export default function GardenScene({ progress }: GardenSceneProps) {
  const { theme } = useTheme();
  const gardenTop = progress.stageIndex === 0 ? theme.gardenSoil : theme.gardenGround;
  const gardenInset = progress.stageIndex === 0 ? theme.secondarySoft : theme.successSoft;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={strings.prayer.gardenSceneA11y}
      style={[
        styles.frame,
        { backgroundColor: theme.gardenSky, borderColor: theme.borderStrong },
      ]}
    >
      <Svg width="100%" height="100%" viewBox="0 0 360 320">
        <Rect x="0" y="0" width="360" height="320" fill={theme.gardenSky} />
        <Circle cx="304" cy="46" r="25" fill={theme.secondarySoft} />

        <G fill={theme.surface} opacity={0.72}>
          <Ellipse cx="62" cy="58" rx="34" ry="12" />
          <Circle cx="48" cy="53" r="12" />
          <Circle cx="70" cy="49" r="16" />
          <Ellipse cx="266" cy="88" rx="25" ry="9" />
          <Circle cx="255" cy="84" r="10" />
          <Circle cx="274" cy="81" r="13" />
        </G>

        <Ellipse cx="180" cy="283" rx="139" ry="22" fill={theme.overlay} opacity={0.28} />

        <Path
          d="M24 159 L180 250 L336 159 L336 194 L180 286 L24 194 Z"
          fill={theme.gardenSoil}
        />
        <Path d="M24 159 L180 250 L180 286 L24 194 Z" fill={theme.gardenTrunk} opacity={0.72} />
        <Polygon
          points="180,66 336,159 180,250 24,159"
          fill={gardenTop}
          stroke={progress.stageIndex === 0 ? theme.gardenTrunk : theme.success}
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <Polygon
          points="180,82 314,159 180,235 46,159"
          fill={gardenInset}
          opacity={0.34}
        />

        {progress.stageIndex >= 2 ? (
          <Path
            d="M179 244 C143 215 232 196 190 172 C155 151 205 132 181 88"
            fill="none"
            stroke={theme.secondarySoft}
            strokeWidth="17"
            strokeLinecap="round"
          />
        ) : null}

        {progress.stageIndex >= 4 ? (
          <G>
            <Ellipse
              cx="259"
              cy="176"
              rx="31"
              ry="17"
              fill={theme.gardenSky}
              stroke={theme.surface}
              strokeWidth="4"
            />
            <Ellipse cx="251" cy="170" rx="10" ry="4" fill={theme.surface} opacity={0.7} />
          </G>
        ) : null}

        {TREES.slice(0, progress.treeCount).map(({ x, y, scale }) => (
          <G key={`${x}-${y}`} transform={`translate(${x} ${y}) scale(${scale})`}>
            <Ellipse cx="0" cy="11" rx="25" ry="8" fill={theme.overlay} opacity={0.2} />
            <Rect x="-5" y="-37" width="10" height="50" rx="5" fill={theme.gardenTrunk} />
            <Circle cx="0" cy="-49" r="28" fill={theme.success} />
            <Circle cx="-19" cy="-39" r="19" fill={theme.gardenGround} />
            <Circle cx="20" cy="-39" r="20" fill={theme.gardenGround} />
            <Circle cx="-7" cy="-62" r="17" fill={theme.gardenGround} />
            <Circle cx="-13" cy="-58" r="6" fill={theme.successSoft} opacity={0.55} />
          </G>
        ))}

        {SPROUTS.slice(0, progress.plantCount).map(({ x, y, scale }) => (
          <G key={`${x}-${y}`} transform={`translate(${x} ${y}) scale(${scale})`}>
            <Ellipse cx="0" cy="7" rx="12" ry="4" fill={theme.overlay} opacity={0.18} />
            <Path
              d="M0 7 C-1 -1 1 -11 0 -20"
              fill="none"
              stroke={theme.success}
              strokeWidth="4"
              strokeLinecap="round"
            />
            <Ellipse cx="-7" cy="-10" rx="8" ry="4" fill={theme.gardenGround} transform="rotate(28 -7 -10)" />
            <Ellipse cx="7" cy="-17" rx="8" ry="4" fill={theme.gardenGround} transform="rotate(-28 7 -17)" />
          </G>
        ))}

        {FLOWERS.slice(0, progress.flowerCount).map(({ x, y }, index) => (
          <G key={`${x}-${y}`}>
            <Path
              d={`M${x} ${y + 10} L${x} ${y - 2}`}
              stroke={theme.success}
              strokeWidth="2"
              strokeLinecap="round"
            />
            {[0, 1, 2, 3].map((petal) => {
              const offset = [
                { dx: 0, dy: -5 },
                { dx: 5, dy: 0 },
                { dx: 0, dy: 5 },
                { dx: -5, dy: 0 },
              ][petal];
              return (
                <Circle
                  key={petal}
                  cx={x + offset.dx}
                  cy={y + offset.dy}
                  r="4"
                  fill={index % 2 === 0 ? theme.gardenFlower : theme.secondary}
                />
              );
            })}
            <Circle cx={x} cy={y} r="3" fill={theme.secondaryStrong} />
          </G>
        ))}

        {progress.totalPrayers === 0 ? (
          <G>
            <Ellipse cx="180" cy="199" rx="20" ry="8" fill={theme.gardenSoil} />
            <Circle cx="180" cy="194" r="5" fill={theme.gardenTrunk} />
          </G>
        ) : null}

        {progress.stageIndex >= 4 ? (
          <G fill={theme.gardenFlower}>
            <Path d="M86 120 C77 111 73 122 82 127 C73 132 80 141 88 132 C95 141 102 132 94 127 C102 119 95 111 86 120 Z" />
            <Path d="M285 132 C278 124 272 134 280 139 C272 144 279 152 286 144 C293 152 300 144 292 139 C300 131 293 124 285 132 Z" />
          </G>
        ) : null}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    height: spacing.huge * 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: componentRadius.modal,
  },
});
