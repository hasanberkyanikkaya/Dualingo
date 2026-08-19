import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/constants/spacing';
import { useTheme } from '@/lib/useTheme';

import type { StarCount } from '@/types';

/** Bir seviyeden kazanılabilecek en çok yıldız. `StarCount` ile aynı üst sınır. */
export const MAX_STARS = 3;

const STAR_SIZE = spacing.lg; // 16

type LevelStarsProps = {
  /** Kazanılan yıldız. Boş yuvalar da çizilir — "3 üzerinden kaç" okunsun diye. */
  earned: StarCount;
  /** Yıldız boyutu. Haritada varsayılan 16; ders sonu ekranı büyütüyor. */
  size?: number;
};

/**
 * Tamamlanmış seviyenin altındaki yıldız satırı.
 *
 * Dekoratif: ekran okuyucudan gizli, çünkü aynı bilgi düğümün kendi
 * erişilebilirlik etiketinde zaten geçiyor. Ayrı okunsa seviye başına üç
 * fazladan durak oluşurdu.
 *
 * Renkler:
 * - Dolu yıldız `secondaryStrong`. Maskotun sarısı (`secondary`) beyaz zemine
 *   karşı 1.58:1 kalıyor; yıldız sayısı kazanılan puanı anlattığı için, yani
 *   BİLGİ taşıdığı için WCAG 1.4.11'in 3:1 eşiği geçerli. `secondaryStrong`
 *   3.69:1 (açık) / 11.63:1 (koyu) veriyor. ProgressBar'daki gerekçenin aynısı.
 * - Boş yıldız `textDisabled`. `textMuted` (5.30:1) denendi ve elendi: kazanılan
 *   yıldızdan (3.69:1) daha gür çıkıyor, hiyerarşi ters dönüyordu.
 */
export default function LevelStars({ earned, size = STAR_SIZE }: LevelStarsProps) {
  const { theme } = useTheme();

  return (
    <View
      style={styles.row}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {Array.from({ length: MAX_STARS }, (_, index) => {
        const isEarned = index < earned;
        return (
          <Ionicons
            key={index}
            name={isEarned ? 'star' : 'star-outline'}
            size={size}
            color={isEarned ? theme.secondaryStrong : theme.textDisabled}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
});
