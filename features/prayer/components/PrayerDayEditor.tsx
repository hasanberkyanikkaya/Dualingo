import { StyleSheet, Text, View } from 'react-native';

import { componentRadius } from '@/constants/radius';
import { layout, spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import { PRAYER_LABELS } from '@/features/prayer/prayerLabels';
import PrayerStatusControl from '@/features/prayer/components/PrayerStatusControl';
import { CHART_PRAYERS } from '@/features/prayer/prayerChart';
import { formatGregorianTr } from '@/lib/turkishDate';
import { useTheme } from '@/lib/useTheme';

import type { ChartDay } from '@/features/prayer/prayerChart';
import type { IsoDate, PrayerName } from '@/types';

type PrayerDayEditorProps = {
  day: ChartDay;
  onCycle: (date: IsoDate, prayer: PrayerName) => void;
};

/**
 * Tek bir günün düzenleme paneli — aylık görünümde seçilen günün altında açılır.
 *
 * Takvim hücresine beş dokunma hedefi sığmadığı için düzenleme buraya taşındı
 * (`PrayerMonthGrid`in gerekçesi). Kontroller tam boy: ızgaranın `compact`
 * hâlinden farklı olarak burada 48 dp'lik hedefin tamamı görünür durumda.
 *
 * ⚠️ **Panelin dolgusu `surfaceAlt`, kenarlığı YOK.** `borderControl` renkli ya
 * da ikincil dolgular üzerine çizilmiyor (2.2e ve 2.3 ölçümleri:
 * `borderControl`/`surfaceAlt` 3.30 açık / **2.85 koyu**). Paneli zeminden
 * ayıran şey dolgunun kendisi ve başlığı.
 */
export default function PrayerDayEditor({ day, onCycle }: PrayerDayEditorProps) {
  const { theme } = useTheme();

  const title = formatGregorianTr(day.date);

  return (
    <View style={[styles.panel, { backgroundColor: theme.surfaceAlt }]}>
      {title !== null ? (
        <Text style={[textStyles.labelLarge, { color: theme.textPrimary }]}>{title}</Text>
      ) : null}

      {CHART_PRAYERS.map((prayer) => (
        <View key={prayer} style={styles.row}>
          <Text style={[textStyles.bodyMedium, styles.name, { color: theme.textPrimary }]}>
            {PRAYER_LABELS[prayer]}
          </Text>

          <Text style={[textStyles.labelMedium, styles.status, { color: theme.textSecondary }]}>
            {/*
              ⚠️ Durum ADI yazıyla da yazılıyor. İkonun biçimi ayrımı taşıyor
              ama panelde yer var ve bir kontrolde "bu ikon neydi"
              sorusunu ekranda cevaplamak, kullanıcıyı ezberden kurtarıyor.
              ⚠️ `'kilinmadi'` burada da "Kayıt yok" diye yazar — "kılmadın"
              DEĞİL.
            */}
            {day.marks[prayer] === 'kilindi' ? strings.prayer.statusDone : strings.prayer.statusNone}
          </Text>

          <PrayerStatusControl
            status={day.marks[prayer] ?? 'kilinmadi'}
            disabled={!day.editable}
            accessibilityLabel={PRAYER_LABELS[prayer]}
            onPress={() => onCycle(day.date, prayer)}
          />
        </View>
      ))}

      {!day.editable ? (
        <Text style={[textStyles.caption, { color: theme.textSecondary }]}>
          {strings.prayer.chartFutureDay}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: spacing.sm,
    padding: layout.cardPadding,
    borderRadius: componentRadius.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: layout.minTouchTarget,
  },
  name: {
    flex: 1,
  },
  status: {
    textAlign: 'right',
  },
});
