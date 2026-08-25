import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import Button from '@/components/Button';
import Screen from '@/components/Screen';
import ScreenHeader from '@/components/ScreenHeader';
import { componentRadius } from '@/constants/radius';
import { layout, spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import NextPrayerCard from '@/features/prayer/components/NextPrayerCard';
import PrayerActionGrid from '@/features/prayer/components/PrayerActionGrid';
import PrayerTimesTable from '@/features/prayer/components/PrayerTimesTable';
import PrayerTodayTracker from '@/features/prayer/components/PrayerTodayTracker';
import { buildPrayerDay } from '@/features/prayer/prayerDay';
import { usePrayerTimes } from '@/features/prayer/usePrayerTimes';
import { formatGregorianTr } from '@/lib/turkishDate';
import { useTheme } from '@/lib/useTheme';

export default function PrayerScreen() {
  const { theme } = useTheme();
  const { district, today, next, markedToday, notice, loading, refresh, recompute, cycleMark } =
    usePrayerTimes();

  const subtitle =
    district === null ? strings.prayer.locationNotSelected : `${district.districtName}, ${district.cityName}`;
  const rows = buildPrayerDay(today, next, markedToday, Date.now());
  const gregorian = today === null ? null : formatGregorianTr(today.date);
  const hijri = today === null ? null : (today.hicriLong ?? today.hicriShort);
  const dateLine = [gregorian, hijri].filter((part) => part !== null).join('  ·  ');

  return (
    <Screen>
      <ScreenHeader title={strings.prayer.title} subtitle={subtitle} />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {district === null ? (
          <View
            style={[
              styles.locationPrompt,
              { backgroundColor: theme.surfaceAlt, borderColor: theme.borderControl },
            ]}
          >
            <View style={styles.promptHeading}>
              <Ionicons name="location-outline" size={spacing.xl} color={theme.primary} />
              <View style={styles.promptCopy}>
                <Text style={[textStyles.h4, { color: theme.textPrimary }]}>
                  {strings.prayer.noDistrictTitle}
                </Text>
                <Text style={[textStyles.bodySmall, { color: theme.textSecondary }]}>
                  {strings.prayer.noDistrictBody}
                </Text>
              </View>
            </View>
            <Button
              label={strings.prayer.selectDistrictTitle}
              onPress={() => router.push('/prayer/district')}
            />
          </View>
        ) : null}

        {next !== null ? <NextPrayerCard next={next} onElapsed={recompute} /> : null}

        {today !== null ? (
          <View>
            <Text style={[textStyles.labelLarge, { color: theme.textSecondary }]}>
              {strings.prayer.todayTitle}
            </Text>
            {dateLine === '' ? null : (
              <Text style={[textStyles.bodySmall, styles.dateLine, { color: theme.textSecondary }]}>
                {dateLine}
              </Text>
            )}
            <View style={styles.table}>
              <PrayerTimesTable rows={rows} onCycle={cycleMark} />
            </View>
          </View>
        ) : (
          <PrayerTodayTracker marks={markedToday} onCycle={cycleMark} />
        )}

        {district !== null && today === null ? (
          <View style={[styles.notice, { backgroundColor: theme.primarySoft }]}>
            <Ionicons name="cloud-offline-outline" size={spacing.xl} color={theme.primary} />
            <View style={styles.promptCopy}>
              <Text style={[textStyles.labelLarge, { color: theme.textPrimary }]}>
                {strings.prayer.emptyTitle}
              </Text>
              <Text style={[textStyles.bodySmall, { color: theme.textSecondary }]}>
                {notice === 'upstream'
                  ? strings.prayer.upstreamError
                  : notice === 'offline'
                    ? strings.prayer.offlineNotice
                    : notice === 'invalidDistrict'
                      ? strings.prayer.invalidDistrict
                      : strings.prayer.emptyBody}
              </Text>
            </View>
          </View>
        ) : null}

        <PrayerActionGrid
          onGarden={() => router.push('/prayer/garden')}
          onChart={() => router.push('/prayer/chart')}
          onNotifications={() => router.push('/prayer/notifications')}
          onQibla={() => router.push('/prayer/qibla')}
        />

        <View style={styles.settingsActions}>
          {district === null ? null : (
            <Button
              label={strings.prayer.refresh}
              variant="secondary"
              loading={loading}
              onPress={() => void refresh(true)}
            />
          )}
          <Button
            label={district === null ? strings.prayer.selectDistrictTitle : strings.prayer.changeDistrict}
            variant="ghost"
            onPress={() => router.push('/prayer/district')}
          />
        </View>

        {district === null ? null : (
          <Text style={[textStyles.caption, styles.centered, { color: theme.textMuted }]}>
            {strings.prayer.attribution}
          </Text>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { gap: layout.sectionGap, paddingBottom: layout.sectionGap },
  locationPrompt: {
    gap: spacing.md,
    padding: layout.cardPadding,
    borderWidth: 1,
    borderRadius: componentRadius.card,
  },
  promptHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  promptCopy: { flex: 1, gap: spacing.xs },
  dateLine: { marginTop: spacing.xs },
  table: { marginTop: spacing.sm },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: layout.cardPadding,
    borderRadius: componentRadius.card,
  },
  settingsActions: { gap: layout.listGap },
  centered: { textAlign: 'center' },
});
