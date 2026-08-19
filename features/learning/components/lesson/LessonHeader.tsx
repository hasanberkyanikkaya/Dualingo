import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import ProgressBar from '@/components/ProgressBar';
import { spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { useTheme } from '@/lib/useTheme';

const CLOSE_ICON_SIZE = spacing.xl; // 24
const HIT_SLOP = spacing.md; // 12 → 24 + 24 = 48 etkin

type LessonHeaderProps = {
  /** Cevaplanan soru sayısı — bkz. aşağıdaki not */
  answered: number;
  total: number;
  onClose: () => void;
};

/**
 * Ders başlığı: solda kapat, sağında ilerleme çubuğu.
 *
 * Kapat solda çünkü referans ürün de öyle yapıyor ve yıkıcı olan kontrol
 * başparmağın dinlenme yayından uzakta duruyor.
 *
 * ⚠️ **Çubuğun payı `answered`, `index + 1` DEĞİL.** Sıra numarası kullanılsaydı
 * çubuk soruya varır varmaz ilerlerdi; oysa ilerleme cevap verildiğinde oluyor.
 * Ayrıca `answered` ile çubuk tamamlama ekranı belirdiği anda tam %100 oluyor.
 *
 * Sayısal gösterge yok: brief "ilerleme çubuğu ve kapat butonu" diyor ve
 * çubukla çelişebilecek bir sayı, hiç sayı olmamasından kötü.
 * (`strings.lesson.progressLabel` bu yüzden kullanılmadan kalıyor.)
 */
export default function LessonHeader({ answered, total, onClose }: LessonHeaderProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={strings.a11y.closeButton}
        hitSlop={HIT_SLOP}
        onPress={onClose}
      >
        {/* `textMuted` zemine 5.30 / 6.02 — grafik için gereken 3:1'in çok üstü.
            `textSecondary` bir kapatma düğmesi için fazla ağır, soruyla yarışır. */}
        <Ionicons name="close" size={CLOSE_ICON_SIZE} color={theme.textMuted} />
      </Pressable>

      {/* ProgressBar satır içindeyken genişliğini ebeveynden almak zorunda. */}
      <View style={styles.bar}>
        <ProgressBar current={answered} total={total} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  bar: {
    flex: 1,
  },
});
