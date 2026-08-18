import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { layout, spacing } from '@/constants/spacing';
import { useTheme } from '@/lib/useTheme';

type TopBarProps = {
  /**
   * Çubuğun içine gelecek öğeler — logo, arama, profil düğmesi.
   * Şimdilik boş; tavan yalnızca renk şeridi olarak duruyor.
   */
  children?: ReactNode;
};

/**
 * Uygulamanın üst çubuğu — "tavan".
 *
 * Ekranın en üstünde tam genişlikte renkli şerit. Durum çubuğunun (saat, pil)
 * arkasını da BOYAR: güvenli alan payı dolgu olarak ekleniyor, zemin ise
 * ekranın tepesine kadar uzanıyor. Böylece çentikli cihazda tepede beyaz bir
 * bant kalmıyor.
 *
 * Yatay dolgu ekranın kenar boşluğuyla aynı (`screenPaddingHorizontal`) ki
 * içine konacak ikonlar aşağıdaki içerikle aynı hizada başlasın.
 */
export default function TopBar({ children }: TopBarProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: theme.appBar,
          paddingTop: insets.top,
          // `height` değil `minHeight`: içerik büyürse (OS yazı boyutu) çubuk
          // büyür, içindekiler kırpılmaz.
          minHeight: layout.topBarHeight + insets.top,
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPaddingHorizontal,
    gap: spacing.md,
  },
});
