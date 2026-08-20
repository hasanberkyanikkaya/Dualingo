import { StyleSheet, Text, View } from 'react-native';

import { spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import BadgeCard from '@/features/progress/components/BadgeCard';
import { useProgressStore } from '@/features/progress/store';
import { useBadges } from '@/features/progress/useBadges';
import { useTheme } from '@/lib/useTheme';

/**
 * Ders sonunda kazanılan rozetler.
 *
 * ⚠️ Kaynağı `pendingBadges` kuyruğu — "rozet kazanıldı olayı" bu projede bir
 * emitter değil, store'da bekleyen bir liste. Sebebi bu ekranda görünüyor:
 * `completeLevel` cevap işleyicisinde çalışıyor, bu bileşen ise `phase`
 * `complete` olduktan SONRA monte oluyor. Bir emitter'ın mesajı o boşluğa
 * düşerdi.
 *
 * Kuyruk burada boşaltılmıyor — boşaltma "Yola dön" işleyicisinde
 * (`LessonCompleteScreen`), `useEffect`te değil: `reactCompiler` + StrictMode
 * etkileri iki kez çalıştırıyor ve kuyruk gözün önünde kaybolurdu.
 */
export default function BadgeEarnedSection() {
  const { theme } = useTheme();
  const pending = useProgressStore((state) => state.pendingBadges);
  const badges = useBadges();

  if (pending.length === 0) {
    return null;
  }

  const earned = badges.filter((badge) => pending.includes(badge.id));

  // Kuyrukta olup katalogda karşılığı olmayan kimlik (OTA ile geri alınmış
  // içerik) çizilecek bir şey bırakmıyor — bölüm de açılmıyor.
  if (earned.length === 0) {
    return null;
  }

  return (
    <View style={styles.root}>
      <Text accessibilityRole="header" style={[textStyles.h3, { color: theme.textPrimary }]}>
        {earned.length > 1 ? strings.progress.badgeEarnedPlural : strings.progress.badgeEarned}
      </Text>

      <View style={styles.row}>
        {earned.map((badge) => (
          <BadgeCard key={badge.id} name={badge.name} icon={badge.icon} earned />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
  },
});
