import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { spacing } from '@/constants/spacing';
import { textStyles } from '@/constants/typography';
import { PRAYER_LABELS } from '@/features/prayer/components/NextPrayerCard';
import { orderedPrayers } from '@/features/prayer/prayerSchedule';
import { useTheme } from '@/lib/useTheme';

import type { PrayerName, PrayerTimes } from '@/types';

type PrayerTimesTableProps = {
  times: PrayerTimes;
  /** Sıradaki vakit — bugüne aitse işaretlenir. */
  highlighted: PrayerName | null;
};

/**
 * Günün altı vakti.
 *
 * ⚠️ **"Sıradaki" durumu RENKLE taşınmıyor.** `primary` ile `success` arasında
 * 1.10:1, `primary` ile `error` arasında 1.06:1 var (2.1 ve 2.3 ölçümleri);
 * bu palette bir satırı renklendirmek onu ayırt edilebilir yapmıyor. Durumu
 * taşıyan şey **ikonun BİÇİMİ** (dolu ok ↔ boş halka) ve etiketin kalınlığı.
 * WCAG 1.4.1'in bu projedeki altıncı uygulaması.
 *
 * ⚠️ Satır ayraçları `border` ile çiziliyor ve bu **dekoratif**: bilgi
 * taşımadığı için 1.4.11 kapsamında değil. 2.1'de ölçülmüştü — `border` zemine
 * 1.27, yani 1px çizgi neredeyse görünmez; burada da amacı zaten göze
 * çarpmamak, yalnızca satırları hizada tutmak.
 */
export default function PrayerTimesTable({ times, highlighted }: PrayerTimesTableProps) {
  const { theme } = useTheme();
  const rows = orderedPrayers(times);

  return (
    <View>
      {rows.map(({ name, time }, index) => {
        const isNext = name === highlighted;

        return (
          <View
            key={name}
            accessible
            accessibilityLabel={`${PRAYER_LABELS[name]}, ${time}`}
            style={[
              styles.row,
              index > 0 ? { borderTopWidth: StyleSheet.hairlineWidth } : null,
              { borderTopColor: theme.border },
            ]}
          >
            <Ionicons
              name={isNext ? 'arrow-forward-circle' : 'ellipse-outline'}
              size={spacing.xl}
              color={isNext ? theme.primary : theme.textMuted}
            />

            <Text
              style={[
                isNext ? textStyles.bodyStrong : textStyles.bodyMedium,
                styles.name,
                { color: theme.textPrimary },
              ]}
            >
              {PRAYER_LABELS[name]}
            </Text>

            <Text
              style={[
                isNext ? textStyles.bodyStrong : textStyles.bodyMedium,
                styles.time,
                { color: theme.textPrimary },
              ]}
            >
              {time}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  name: {
    flex: 1,
  },
  time: {
    fontVariant: ['tabular-nums'],
  },
});
