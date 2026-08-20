import { StyleSheet, Text, View } from 'react-native';

import { spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import BadgeCard from '@/features/progress/components/BadgeCard';
import { useBadges, useEarnedBadgeCount } from '@/features/progress/useBadges';
import { useTheme } from '@/lib/useTheme';

/**
 * Profildeki rozet koleksiyonu — kazanılmış ve kilitli rozetlerin tamamı.
 *
 * Kilitli rozetler de gösteriliyor: hedefi görmeyen kullanıcı için rozet
 * sistemi yalnızca sürpriz üretir. Ad ve açıklama bugün yer tutucu olduğu için
 * kartlar "ÖRNEK ROZET n" okuyacak — gerçek içerik geldiğinde kod değişmez.
 *
 * Katalog boşsa bölümün tamamı çizilmiyor: başlık altında hiçbir şey olmayan
 * bir bölüm, olmayan bir özelliği ima eder.
 */
export default function BadgeSection() {
  const { theme } = useTheme();
  const badges = useBadges();
  const earnedCount = useEarnedBadgeCount();

  if (badges.length === 0) {
    return null;
  }

  return (
    <View style={styles.root}>
      {/* `h3`: `ScreenHeader` `h2` çiziyor, ikinci bir `h2` hiyerarşiyi düzler. */}
      <Text accessibilityRole="header" style={[textStyles.h3, { color: theme.textPrimary }]}>
        {strings.progress.badges}
      </Text>

      {earnedCount === 0 ? (
        <Text style={[textStyles.bodyMedium, { color: theme.textSecondary }]}>
          {strings.progress.noBadgesYet}
        </Text>
      ) : null}

      <View style={styles.grid}>
        {badges.map((badge) => (
          <BadgeCard key={badge.id} name={badge.name} icon={badge.icon} earned={badge.earned} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
    alignSelf: 'stretch',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
});
