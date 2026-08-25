import { StyleSheet, Text, View } from 'react-native';

import { componentRadius } from '@/constants/radius';
import { layout, spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import PrayerStatusControl from '@/features/prayer/components/PrayerStatusControl';
import { TRACKABLE_PRAYERS } from '@/features/prayer/prayerDay';
import { PRAYER_LABELS } from '@/features/prayer/prayerLabels';
import { useTheme } from '@/lib/useTheme';

import type { PrayerMarkMap, PrayerName } from '@/types';

type PrayerTodayTrackerProps = {
  marks: PrayerMarkMap;
  onCycle: (prayer: PrayerName) => void;
};

/** Vakit tablosu yokken de bugünün namaz kaydını erişilebilir tutar. */
export default function PrayerTodayTracker({ marks, onCycle }: PrayerTodayTrackerProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <Text style={[textStyles.h4, { color: theme.textPrimary }]}> 
          {strings.prayer.todayTrackerTitle}
        </Text>
        <Text style={[textStyles.bodySmall, { color: theme.textSecondary }]}> 
          {strings.prayer.todayTrackerBody}
        </Text>
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: theme.surface, borderColor: theme.borderControl },
        ]}
      >
        {TRACKABLE_PRAYERS.map((prayer, index) => (
          <View
            key={prayer}
            style={[
              styles.row,
              index > 0 ? { borderTopWidth: StyleSheet.hairlineWidth } : null,
              { borderTopColor: theme.border },
            ]}
          >
            <Text style={[textStyles.bodyStrong, styles.name, { color: theme.textPrimary }]}> 
              {PRAYER_LABELS[prayer]}
            </Text>
            <PrayerStatusControl
              status={marks[prayer] ?? 'kilinmadi'}
              showLabel
              accessibilityLabel={PRAYER_LABELS[prayer]}
              onPress={() => onCycle(prayer)}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  heading: { gap: spacing.xs },
  card: {
    paddingHorizontal: layout.cardPadding,
    borderWidth: 1,
    borderRadius: componentRadius.card,
  },
  row: {
    minHeight: layout.minTouchTarget + spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  name: { flex: 1 },
});
