import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import ProgressBar from '@/components/ProgressBar';
import { componentRadius } from '@/constants/radius';
import { layout, spacing } from '@/constants/spacing';
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
 * Ünitenin siyah konturlu kâğıt çıkartması. İlerlemeyi ortak `ProgressBar`
 * anlatır; sarı yol bu nedenle yalnız dekoratif kalır.
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
    <View
      style={[
        styles.container,
        theme.elevation.card,
        { backgroundColor: theme.surface, borderColor: theme.textPrimary },
      ]}
      accessibilityRole="header"
    >
      <View style={styles.titleRow}>
        <View style={[styles.icon, { backgroundColor: theme.secondary }]}>
          <Ionicons name={resolveIcon(iconName)} size={ICON_SIZE} color={theme.onSecondary} />
        </View>
        <View style={styles.copy}>
          <Text style={[textStyles.h4, styles.title, { color: theme.textPrimary }]}>{title}</Text>
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
        </View>
      </View>

      <View style={styles.progress}>
        <ProgressBar
          current={completedCount}
          total={totalCount}
          variant={isCompleted ? 'success' : 'secondary'}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 2,
    borderRadius: componentRadius.card,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  icon: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: componentRadius.chip,
  },
  copy: { flex: 1, gap: spacing.xs },
  title: {
    flexShrink: 1,
  },
  // Çubuk tam genişliğe yayılmasın; başlık bloğuyla aynı ölçüde dursun.
  progress: {
    alignSelf: 'stretch',
  },
});
