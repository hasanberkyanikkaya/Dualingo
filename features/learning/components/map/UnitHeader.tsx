import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import ProgressBar from '@/components/ProgressBar';
import { spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import { formatString } from '@/lib/formatString';
import { useTheme } from '@/lib/useTheme';

type IoniconName = keyof typeof Ionicons.glyphMap;

const ICON_SIZE = spacing.xl; // 24

/** İçerikteki ikon adı tanınmıyorsa buna düşülür. */
const FALLBACK_ICON: IoniconName = 'ellipse-outline';

/**
 * `Unit.icon` içerikten geliyor ve tipi düz `string`. Elle yazılan JSON'da er
 * geç bir yazım hatası olacak; tanınmayan ad Ionicons'ta boş kare çizdirir.
 * Bu yüzden daraltma çalışma anında yapılıyor.
 */
function resolveIcon(name: string | undefined): IoniconName {
  if (name !== undefined && name in Ionicons.glyphMap) {
    return name as IoniconName;
  }
  return FALLBACK_ICON;
}

type UnitHeaderProps = {
  /** Yoldaki sıra, 1'den başlar. */
  unitNumber: number;
  title: string;
  iconName?: string;
  completedCount: number;
  totalCount: number;
};

/**
 * Üniteler arasındaki başlık ayracı.
 *
 * Ayraç ÇİZGİSİ yok. Denendi ve elendi: `border` rengindeki 1px çizgi beyaz
 * zemine karşı 1.27:1, yani görünmüyor; görünür bir renge çıkarmak da "orta
 * alan saf beyaz" kararını bozuyordu. Üniteleri boşluk ve tipografi ayırıyor.
 *
 * Kart da yok — Card bileşeni henüz yazılmadı (Faz 1.2c) ve burada gerekmiyor.
 * Başlığa gövde veren şey `ProgressBar`: var olan bileşeni yeniden kullanıyor
 * (mimari kural 3) ve ünitenin ilerlemesini sayıyla anlattığı için şeridin
 * dekoratif kalabilmesini sağlayan da bu.
 */
export default function UnitHeader({
  unitNumber,
  title,
  iconName,
  completedCount,
  totalCount,
}: UnitHeaderProps) {
  const { theme } = useTheme();

  const isCompleted = totalCount > 0 && completedCount >= totalCount;

  return (
    <View style={styles.container} accessibilityRole="header">
      <View style={styles.titleRow}>
        <Ionicons name={resolveIcon(iconName)} size={ICON_SIZE} color={theme.primary} />
        <Text style={[textStyles.h4, styles.title, { color: theme.textPrimary }]}>{title}</Text>
      </View>

      {/*
        ⚠️ `textTransform: 'uppercase'` kullanılmıyor: Türkçe i→İ dönüşümünü
        her platform doğru yapmıyor ("Ünite" sorunsuz ama kural burada dursun).
        `labelSmall` zaten harf aralığı taşıyor.
      */}
      <Text
        style={[
          textStyles.labelSmall,
          { color: isCompleted ? theme.success : theme.textMuted },
        ]}
      >
        {isCompleted
          ? strings.learn.unitCompleted
          : formatString(strings.learn.unitLabel, { number: unitNumber })}
      </Text>

      <View style={styles.progress}>
        <ProgressBar
          current={completedCount}
          total={totalCount}
          variant={isCompleted ? 'success' : 'primary'}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    textAlign: 'center',
  },
  // Çubuk tam genişliğe yayılmasın; başlık bloğuyla aynı ölçüde dursun.
  progress: {
    alignSelf: 'stretch',
    marginTop: spacing.xs,
  },
});
