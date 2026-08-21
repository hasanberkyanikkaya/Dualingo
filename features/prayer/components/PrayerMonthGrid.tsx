import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { componentRadius } from '@/constants/radius';
import { layout, spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import { CHART_PRAYERS } from '@/features/prayer/prayerChart';
import { formatString } from '@/lib/formatString';
import { WEEKDAY_HEADERS_TR, shortDateTr } from '@/lib/turkishDate';
import { useTheme } from '@/lib/useTheme';

import type { ChartCell, ChartDay } from '@/features/prayer/prayerChart';
import type { IsoDate } from '@/types';

type PrayerMonthGridProps = {
  /** Her zaman 42 hücre — `prayerChart.buildMonth` garanti ediyor. */
  cells: readonly ChartCell[];
  selectedDate: IsoDate | null;
  onSelect: (date: IsoDate) => void;
};

/** Hücrenin özet şeridi için sayım. */
function countMarks(day: ChartDay): { kilindi: number; kaza: number } {
  let kilindi = 0;
  let kaza = 0;

  for (const prayer of CHART_PRAYERS) {
    const status = day.marks[prayer];
    if (status === 'kilindi') {
      kilindi += 1;
    } else if (status === 'kaza') {
      kaza += 1;
    }
  }

  return { kilindi, kaza };
}

/**
 * Aylık takvim — 7 sütun, 42 hücre.
 *
 * ⚠️ **Takvim hücresinde vakitler DOĞRUDAN düzenlenmiyor** ve bu, oturumun
 * ikinci bilinçli tasarım sapması. Sebep aritmetik: 360 dp'lik bir ekranda
 * hücre genişliği ~51 dp; içine beş ayrı dokunma hedefi koymak her birini
 * ~10 dp'ye indirirdi, `layout.minTouchTarget`in (48) beşte biri. Hücre GÜN
 * seçiyor, düzenleme aşağıdaki panelde tam boy kontrollerle yapılıyor.
 *
 * ⚠️ **Şerit ikonları 8 dp ve bu boyutta biçim ayrımı ZAYIF.** Bilgiyi taşıyan
 * asıl şey hücrenin erişilebilirlik etiketi (sayılar sözle yazılıyor) ve
 * düzenleme paneli; şerit bir hatırlatma, bir kayıt değil. Renk tek başına
 * bırakılmadı — dolu/boş biçim farkı da var — ama bu ölçekte tek başına
 * yeterli sayılmıyor ve öyle de sunulmuyor.
 */
export default function PrayerMonthGrid({ cells, selectedDate, onSelect }: PrayerMonthGridProps) {
  const { theme } = useTheme();

  return (
    <View>
      <View style={styles.headerRow}>
        {WEEKDAY_HEADERS_TR.map((label) => (
          <Text
            key={label}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[textStyles.labelSmall, styles.headerCell, { color: theme.textSecondary }]}
          >
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((cell, index) => {
          if (cell === null) {
            // Ay dışı hücre: yeri korunuyor, içi boş. Komşu ayın günlerini
            // çizmek elendi (`prayerChart.buildMonth`).
            return <View key={`empty-${index}`} style={styles.cell} />;
          }

          const { kilindi, kaza } = countMarks(cell);
          const isSelected = cell.date === selectedDate;
          const short = shortDateTr(cell.date) ?? cell.date;

          return (
            <Pressable
              key={cell.date}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={formatString(strings.a11y.prayerChartDay, {
                tarih: short,
                kilinan: kilindi,
                kaza,
              })}
              // ⚠️ Gelecek gün de SEÇİLEBİLİR, düzenlenemez. Hücreyi
              // basılamaz yapmak sessiz bir duvar olurdu: kullanıcı dokunur,
              // hiçbir şey olmaz, sebebini öğrenemez. Seçilince panel açılıyor
              // ve "Bu gün henüz gelmedi" diyor; kontroller pasif
              // (`ChartDay.editable` → `PrayerDayEditor`).
              onPress={() => onSelect(cell.date)}
              style={[
                styles.cell,
                styles.day,
                isSelected ? { backgroundColor: theme.primarySoft } : null,
                cell.isToday
                  ? { borderWidth: 2, borderColor: theme.primary, borderRadius: componentRadius.card }
                  : null,
              ]}
            >
              <Text
                style={[
                  cell.isToday ? textStyles.labelLarge : textStyles.labelMedium,
                  {
                    // ⚠️ Gelecek gün `textMuted`e düşüyor, `opacity` ile
                    // SOLDURULMUYOR (4.2 kararı): opaklık kontrastı
                    // hesaplanamaz hale getirirdi. `textMuted` zemine karşı
                    // 5.30 açık / 5.96 koyu.
                    color: cell.editable ? theme.textPrimary : theme.textMuted,
                  },
                ]}
              >
                {cell.dayOfMonth}
              </Text>

              <View style={styles.strip}>
                {CHART_PRAYERS.map((prayer) => {
                  const status = cell.marks[prayer] ?? 'kilinmadi';
                  return (
                    <Ionicons
                      key={prayer}
                      name={
                        status === 'kilindi'
                          ? 'checkmark-circle'
                          : status === 'kaza'
                            ? 'refresh-circle'
                            : 'ellipse-outline'
                      }
                      // ⚠️ 8 dp: 320 dp genişliğinde bir ekranda hücre ~45 dp
                      // ve beş ikon 40 dp tutuyor. `spacing.md` (12) seçilseydi
                      // şerit 60 dp olur, dar telefonlarda hücreden taşardı.
                      size={spacing.sm}
                      color={
                        status === 'kilindi'
                          ? theme.primary
                          : status === 'kaza'
                            ? theme.secondaryStrong
                            : theme.border
                      }
                    />
                  );
                })}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    paddingBottom: spacing.xs,
  },
  headerCell: {
    // 7 sütun: yüzde ile bölünüyor ki hücrelerle birebir hizalansın.
    width: `${100 / 7}%`,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    // Hücrenin kendisi bir dokunma hedefi; 48'in altına inmiyor.
    minHeight: layout.minTouchTarget,
  },
  day: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    borderRadius: componentRadius.card,
  },
  strip: {
    flexDirection: 'row',
    // Taşma yerine kırpma: dar bir ekranda şerit hücreden çıkıp komşu güne
    // sarkmamalı.
    overflow: 'hidden',
  },
});
