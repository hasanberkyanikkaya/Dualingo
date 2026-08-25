import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { componentRadius } from '@/constants/radius';
import { layout, spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import CountdownLabel from '@/features/prayer/components/CountdownLabel';
import { PRAYER_LABELS } from '@/features/prayer/prayerLabels';
import { splitRemaining } from '@/features/prayer/useCountdown';
import { formatString } from '@/lib/formatString';
import { useTheme } from '@/lib/useTheme';

import type { NextPrayer } from '@/types';

type NextPrayerCardProps = {
  next: NextPrayer;
  onElapsed: () => void;
};

/**
 * Sıradaki vakit, saat ve geri sayım tek kompakt satırda gösterilir.
 * Ekran okuyucu etiketi saniyede değişmez; yaklaşık kalan süreyi dakika
 * hassasiyetinde tek parça olarak taşır.
 */
export default function NextPrayerCard({ next, onElapsed }: NextPrayerCardProps) {
  const { theme } = useTheme();

  const name = PRAYER_LABELS[next.name];

  // Etiket monte anındaki kalan süreden kuruluyor ve saniyede bir
  // TAZELENMİYOR — kasıtlı. Ekran okuyucu kullanıcısı için "yaklaşık ne kadar
  // kaldı" bilgisi yeterli; kesin an zaten vakit saatinde yazılı.
  const { hours, minutes } = splitRemaining(next.at - Date.now());
  const a11yLabel =
    hours > 0
      ? formatString(strings.a11y.prayerRemaining, { vakit: name, saat: hours, dakika: minutes })
      : formatString(strings.a11y.prayerRemainingSoon, { vakit: name, dakika: minutes });

  return (
    <View
      accessible
      accessibilityLabel={`${formatString(strings.a11y.prayerNext, {
        vakit: name,
        saat: next.time,
      })}. ${a11yLabel}`}
      style={[
        styles.card,
        theme.elevation.card,
        { backgroundColor: theme.surfaceGlass, borderColor: theme.secondaryStrong },
      ]}
    >
      <View style={[styles.icon, { backgroundColor: theme.secondary }]}>
        <Ionicons name="time" size={spacing.xl} color={theme.onSecondary} />
      </View>

      <View style={styles.copy}>
        <Text style={[textStyles.labelSmall, { color: theme.textSecondary }]}>
          {strings.prayer.nextPrayerLabel}
        </Text>
        <Text style={[textStyles.h4, { color: theme.textPrimary }]}>{name}</Text>
      </View>

      <View style={styles.timeBlock}>
        <Text style={[textStyles.h3, styles.clock, { color: theme.textPrimary }]}>{next.time}</Text>
        <CountdownLabel compact target={next.at} onElapsed={onElapsed} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: layout.minTouchTarget + spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: layout.cardPadding,
    paddingVertical: spacing.md,
    borderWidth: 2,
    borderRadius: componentRadius.card,
  },
  icon: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: componentRadius.button,
  },
  copy: { flex: 1, gap: spacing.xs },
  timeBlock: { alignItems: 'flex-end', gap: spacing.xs },
  clock: {
    // Saniyeler değişirken rakam genişliği sabit kalsın; sola sağa oynayan bir
    // saat okunurluğu bozar (`PrayerTimesTable` ile aynı tercih).
    fontVariant: ['tabular-nums'],
  },
});
