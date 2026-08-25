import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { componentRadius } from '@/constants/radius';
import { layout, spacing } from '@/constants/spacing';
import { useTheme } from '@/lib/useTheme';

type DecorationVariant = 'book' | 'bulb' | 'pencil' | 'star';

type LearningPathDecorationProps = {
  variant: DecorationVariant;
  style: StyleProp<ViewStyle>;
};

const ICONS: Record<DecorationVariant, keyof typeof Ionicons.glyphMap> = {
  book: 'book',
  bulb: 'bulb',
  pencil: 'pencil',
  star: 'star',
};

/** Yol boyunca içerikle kayan, bilgi taşımayan küçük kırtasiye çıkartması. */
export default function LearningPathDecoration({ variant, style }: LearningPathDecorationProps) {
  const { theme } = useTheme();
  const backgrounds: Record<DecorationVariant, string> = {
    book: theme.primarySoft,
    bulb: theme.secondarySoft,
    pencil: theme.surface,
    star: theme.secondary,
  };

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[
        styles.sticker,
        theme.elevation.card,
        { backgroundColor: backgrounds[variant], borderColor: theme.textPrimary },
        style,
      ]}
    >
      <Ionicons name={ICONS[variant]} size={spacing.xl} color={theme.textPrimary} />
    </View>
  );
}

const styles = StyleSheet.create({
  sticker: {
    position: 'absolute',
    width: layout.minTouchTarget + spacing.xs,
    height: layout.minTouchTarget + spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: componentRadius.card,
    transform: [{ rotate: '-7deg' }],
  },
});
