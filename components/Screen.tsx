import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import TopBar from '@/components/TopBar';
import { layout } from '@/constants/spacing';
import { useTheme } from '@/lib/useTheme';

type ScreenProps = {
  children: ReactNode;
};

/**
 * Tüm sekme ekranlarının ortak kabuğu.
 *
 * Ekran üç şeritten oluşuyor: üstte renkli tavan (`TopBar`), ortada beyaz
 * içerik alanı, altta sekme çubuğu. Ortadaki alan zemin rengini temadan alır;
 * açık temada bu saf beyazdır.
 *
 * Güvenli alan payları bölünmüş durumda: ÜST payı `TopBar` kendi içinde
 * yutuyor (şerit durum çubuğunun arkasına kadar uzasın diye), ALT payı sekme
 * çubuğu üstleniyor. Buraya yalnızca yatay paylar kalıyor — yatay moddaki
 * çentik içeriği kesmesin diye.
 */
export default function Screen({ children }: ScreenProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <TopBar />

      <SafeAreaView edges={['left', 'right']} style={styles.body}>
        <View style={styles.content}>{children}</View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: layout.screenPaddingVertical,
  },
});
