import { StyleSheet, Text, View } from 'react-native';

import { spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import PrayerStatusControl from '@/features/prayer/components/PrayerStatusControl';
import { PRAYER_LABELS } from '@/features/prayer/prayerLabels';
import { CHART_PRAYERS } from '@/features/prayer/prayerChart';
import { formatString } from '@/lib/formatString';
import { shortDateTr, weekdayShortTr } from '@/lib/turkishDate';
import { useTheme } from '@/lib/useTheme';

import type { ChartCell } from '@/features/prayer/prayerChart';
import type { IsoDate, PrayerName } from '@/types';

type PrayerWeekGridProps = {
  /** Her zaman 7 hücre — `prayerChart.buildWeek` garanti ediyor. */
  cells: readonly ChartCell[];
  onCycle: (date: IsoDate, prayer: PrayerName) => void;
};

/**
 * Sütun başlıkları — dar ızgarada tam ad sığmıyor.
 *
 * Kısaltmalar `strings`ten geliyor; bileşenin içine gömülmüş metin yok
 * (mimari kural 5).
 */
const SHORT_LABELS: Record<PrayerName, string> = {
  imsak: strings.prayer.shortImsak,
  gunes: strings.prayer.shortGunes,
  ogle: strings.prayer.shortOgle,
  ikindi: strings.prayer.shortIkindi,
  aksam: strings.prayer.shortAksam,
  yatsi: strings.prayer.shortYatsi,
};

/**
 * Haftalık ızgara — **günler satır, vakitler sütun**.
 *
 * ⚠️ Bu yön ölçülerek seçildi. 360 dp'lik bir ekranda tarih sütunu (72) çıkınca
 * beş vakte 288 dp kalıyor: sütun başına ~57 dp, yani `layout.minTouchTarget`in
 * (48) üstünde. Ters yön (yedi gün sütun) aynı ekranda sütun başına ~41 dp
 * verirdi — dokunma hedefi 48'in ALTINA düşerdi ve yatay kaydırma gerekirdi.
 * Haftanın tamamı tek bakışta görünsün diye kaydırma istenmiyor.
 *
 * ⚠️ Gelecek günlerin kontrolleri pasif ama GRİLEŞTİRİLMİYOR
 * (`PrayerStatusControl`in gerekçesi).
 */
export default function PrayerWeekGrid({ cells, onCycle }: PrayerWeekGridProps) {
  const { theme } = useTheme();

  return (
    <View>
      <View style={styles.headerRow}>
        <View style={styles.dateColumn} />
        {CHART_PRAYERS.map((prayer) => (
          <Text
            key={prayer}
            // Başlık ekran okuyucuya OKUNMUYOR: her hücrenin kendi etiketi
            // zaten vaktin tam adını taşıyor, başlık ikinci kez okunsaydı
            // ızgarada gezinmek iki katına çıkardı.
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[textStyles.labelSmall, styles.headerCell, { color: theme.textSecondary }]}
          >
            {SHORT_LABELS[prayer]}
          </Text>
        ))}
      </View>

      {cells.map((cell, index) => {
        if (cell === null) {
          // Bozuk bir tarih satırı kısaltmıyor, boş bırakıyor (haftanın 7 gün
          // olması bir arayüz sözleşmesi — `buildWeek`).
          return <View key={`empty-${index}`} style={styles.row} />;
        }

        const weekday = weekdayShortTr(cell.date);
        const short = shortDateTr(cell.date);

        return (
          <View
            key={cell.date}
            style={[
              styles.row,
              index > 0 ? { borderTopWidth: StyleSheet.hairlineWidth } : null,
              { borderTopColor: theme.border },
            ]}
          >
            <View style={styles.dateColumn}>
              <Text
                style={[
                  cell.isToday ? textStyles.labelLarge : textStyles.labelMedium,
                  { color: cell.isToday ? theme.textPrimary : theme.textSecondary },
                ]}
              >
                {weekday ?? ''}
              </Text>
              <Text style={[textStyles.caption, { color: theme.textMuted }]}>{short ?? ''}</Text>
            </View>

            {CHART_PRAYERS.map((prayer) => (
              <View key={prayer} style={styles.cell}>
                <PrayerStatusControl
                  status={cell.marks[prayer] ?? 'kilinmadi'}
                  disabled={!cell.editable}
                  accessibilityLabel={formatString(strings.a11y.prayerChartCell, {
                    tarih: short ?? cell.date,
                    vakit: PRAYER_LABELS[prayer],
                  })}
                  onPress={() => onCycle(cell.date, prayer)}
                />
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: spacing.xs,
  },
  headerCell: {
    flex: 1,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: spacing.xxl,
    paddingVertical: spacing.sm,
  },
  dateColumn: {
    width: spacing.xxxl + spacing.xl,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
  },
});
