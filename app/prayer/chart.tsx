import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/Button';
import ScreenHeader from '@/components/ScreenHeader';
import { layout, spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import PrayerDayEditor from '@/features/prayer/components/PrayerDayEditor';
import PrayerMonthGrid from '@/features/prayer/components/PrayerMonthGrid';
import PrayerWeekGrid from '@/features/prayer/components/PrayerWeekGrid';
import { monthOf, summarize, weekRange } from '@/features/prayer/prayerChart';
import { usePrayerChart } from '@/features/prayer/usePrayerChart';
import { formatString } from '@/lib/formatString';
import { monthTitleTr, shortDateTr } from '@/lib/turkishDate';
import { useTheme } from '@/lib/useTheme';

import type { ChartMode } from '@/features/prayer/usePrayerChart';

/**
 * Namaz çizelgesi ekranı (Faz 4.3).
 *
 * ⚠️ **Çizelge kendi ekranında yaşıyor**, namaz sekmesinin altında değil.
 * Sekmenin işi "şimdi ne zaman" sorusunu cevaplamak; çizelge geçmişe bakan bir
 * araç ve ikisi aynı ekranda olsaydı sıradaki vakit kartı her gün aşağı doğru
 * kaybolurdu.
 *
 * ⚠️ Ekran `Screen` kullanmıyor: odaklanmış bir bağlam, mercan şerit yok
 * (2.3'ün ders ekranı ve 4.1'in ilçe ekranıyla aynı karar). Bu yüzden güvenli
 * alan payını kendisi çiziyor ve DÖRT kenarı da alıyor.
 *
 * ⚠️ **Hiçbir metin yargı taşımıyor.** "Kaçırdın", "eksik", "kılmadın", "borç"
 * yok; payda da yok ("2 / 5" suçlayıcı bir kelime kullanmadan eksiklik
 * bildirir). Ekran sayar, hüküm vermez.
 */
export default function PrayerChartScreen() {
  const { theme } = useTheme();
  const { mode, changeMode, anchor, cells, selectedDate, setSelectedDate, cycle, shift, goToToday } =
    usePrayerChart();

  const summary = summarize(cells);
  const hasMarks = summary.kilindi > 0;

  const selectedDay =
    selectedDate === null
      ? null
      : (cells.find((cell) => cell !== null && cell.date === selectedDate) ?? null);

  return (
    <SafeAreaView
      edges={['top', 'bottom', 'left', 'right']}
      style={[styles.root, { backgroundColor: theme.background }]}
    >
      <Stack.Screen options={{ title: strings.prayer.chartTitle }} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/*
          ⚠️ Kapatma düğmesi ELLE çiziliyor: kök yerleşim `headerShown: false`
          veriyor, yani navigatörün geri düğmesi yok (4.1'in ilçe ekranındaki
          aynı gerekçe).
        */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={strings.a11y.closeButton}
          hitSlop={spacing.md}
          onPress={() => router.back()}
          style={styles.close}
        >
          <Ionicons name="close" size={spacing.xl} color={theme.textMuted} />
        </Pressable>

        <ScreenHeader title={strings.prayer.chartTitle} subtitle={periodTitle(mode, anchor)} />

        <View style={styles.modeRow}>
          <ModeButton
            label={strings.prayer.chartWeek}
            active={mode === 'week'}
            onPress={() => changeMode('week')}
          />
          <ModeButton
            label={strings.prayer.chartMonth}
            active={mode === 'month'}
            onPress={() => changeMode('month')}
          />
        </View>

        <View style={styles.navRow}>
          <Button label={strings.prayer.chartPrevious} variant="ghost" size="small" onPress={() => shift(-1)} />
          <Button label={strings.prayer.chartToday} variant="ghost" size="small" onPress={goToToday} />
          <Button label={strings.prayer.chartNext} variant="ghost" size="small" onPress={() => shift(1)} />
        </View>

        {mode === 'week' ? (
          <PrayerWeekGrid cells={cells} onCycle={cycle} />
        ) : (
          <View style={styles.monthBlock}>
            <PrayerMonthGrid cells={cells} selectedDate={selectedDate} onSelect={setSelectedDate} />

            {selectedDay !== null ? (
              <PrayerDayEditor day={selectedDay} onCycle={cycle} />
            ) : (
              <Text style={[textStyles.bodySmall, { color: theme.textSecondary }]}>
                {strings.prayer.chartSelectDay}
              </Text>
            )}
          </View>
        )}

        {/*
          ⚠️ Özet yalnızca en az bir işaret varken sayı gösteriyor; sıfırdayken
          davet edici tek bir cümle var. "0 vakit işaretledin" yazmak, hiçbir
          suçlayıcı kelime kullanmadan bir eksiklik bildirimi gibi okunur.
        */}
        <View style={styles.summaryBlock}>
          {hasMarks ? (
            <Text style={[textStyles.bodyMedium, { color: theme.textPrimary }]}>
              {formatString(strings.prayer.chartWeekSummary, { sayi: summary.kilindi })}
            </Text>
          ) : (
            <Text style={[textStyles.bodyMedium, { color: theme.textSecondary }]}>
              {strings.prayer.chartEmpty}
            </Text>
          )}

          <Text style={[textStyles.caption, { color: theme.textMuted }]}>
            {strings.prayer.chartHint}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Başlık altı satırı: haftada aralık, ayda ay adı.
 *
 * Tarih çözülemezse boş dizge — yer tutucu ("—", "bilinmiyor") YAZILMAZ
 * (4.2'nin tarih satırı kararı).
 */
function periodTitle(mode: ChartMode, anchor: string): string {
  if (mode === 'month') {
    const parts = monthOf(anchor);
    return parts === null ? '' : (monthTitleTr(parts.year, parts.month) ?? '');
  }

  const range = weekRange(anchor);
  if (range === null) {
    return '';
  }

  const from = shortDateTr(range.from);
  const to = shortDateTr(range.to);
  return from === null || to === null ? '' : `${from} – ${to}`;
}

type ModeButtonProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

/**
 * Kip düğmesi.
 *
 * ⚠️ `Button` bileşeni KULLANILMADI ve sebebi seçili durumun anlatımı: `Button`
 * varyantları eylem şiddetini anlatıyor, "şu an buradasın"ı değil, ve
 * `accessibilityState.selected` taşımıyor. Seçili kip `primarySoft` dolgu +
 * `primary` metin (**4.17:1**, 2.2a ölçümü) ile anlatılıyor; ayrım renkten
 * bağımsız olarak ekran okuyucuya `selected` ile de gidiyor.
 */
function ModeButton({ label, active, onPress }: ModeButtonProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[
        styles.modeButton,
        { backgroundColor: active ? theme.primarySoft : 'transparent' },
      ]}
    >
      <Text
        style={[
          textStyles.button,
          { color: active ? theme.primary : theme.textSecondary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    gap: layout.listGap,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: layout.screenPaddingVertical,
    paddingBottom: layout.sectionGap,
  },
  close: {
    alignSelf: 'flex-start',
  },
  modeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modeButton: {
    minHeight: layout.minTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: layout.minTouchTarget / 2,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthBlock: {
    gap: layout.listGap,
  },
  summaryBlock: {
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
});
