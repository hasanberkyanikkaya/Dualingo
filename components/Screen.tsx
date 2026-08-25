import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { radius } from '@/constants/radius';
import { layout, spacing } from '@/constants/spacing';
import { useTheme } from '@/lib/useTheme';

type ScreenProps = {
  children: ReactNode;
  background?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  tabPane?: boolean;
};

/**
 * Ortak ekran kabuğu. `tabPane` açıkken içerik, alt navigasyon zemininden
 * yuvarlak köşe, boşluk ve gölgeyle ayrılır. Bağımsız Stack ekranları aynı
 * bileşeni kullanır fakat altta sekme varmış gibi yapay bir boşluk bırakmaz.
 * Üst ve yatay güvenli alanlar burada, alt güvenli alan sekme çubuğunda yaşar.
 */
export default function Screen({ children, background, contentStyle, tabPane = false }: ScreenProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: tabPane ? theme.surfaceAlt : theme.background },
      ]}
    >
      <View
        style={[
          styles.paneShadow,
          tabPane ? styles.tabPaneShadow : undefined,
          tabPane ? theme.elevation.raised : undefined,
        ]}
      >
        <SafeAreaView
          edges={['top', 'left', 'right']}
          style={[
            styles.pane,
            tabPane ? styles.tabPane : undefined,
            { backgroundColor: theme.background },
          ]}
        >
          {background}
          <View style={[styles.content, contentStyle]}>{children}</View>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  paneShadow: {
    flex: 1,
  },
  tabPaneShadow: {
    marginBottom: spacing.md,
    borderBottomLeftRadius: radius.xxl,
    borderBottomRightRadius: radius.xxl,
  },
  pane: {
    flex: 1,
  },
  tabPane: {
    overflow: 'hidden',
    borderBottomLeftRadius: radius.xxl,
    borderBottomRightRadius: radius.xxl,
  },
  content: {
    flex: 1,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: layout.screenPaddingVertical,
  },
});
