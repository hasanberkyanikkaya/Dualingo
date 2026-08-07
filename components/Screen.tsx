import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { layout } from '@/constants/spacing';
import { useTheme } from '@/lib/useTheme';

type ScreenProps = {
  children: ReactNode;
};

/**
 * Tüm sekme ekranlarının ortak kabuğu: tema zemini, üst güvenli alan ve
 * ekran kenar boşlukları.
 *
 * Alt güvenli alan bilerek dışarıda bırakıldı — onu sekme çubuğu üstleniyor.
 */
export default function Screen({ children }: ScreenProps) {
  const { theme } = useTheme();

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.root, { backgroundColor: theme.background }]}
    >
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: layout.screenPaddingVertical,
  },
});
