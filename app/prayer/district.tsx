import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/Button';
import ScreenHeader from '@/components/ScreenHeader';
import { componentRadius } from '@/constants/radius';
import { layout, spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import DistrictPickerList from '@/features/prayer/components/DistrictPickerList';
import { matchLocation, normalizePlaceName } from '@/features/prayer/districtMatch';
import { lookupCurrentPlace } from '@/features/prayer/location';
import { fetchCities, fetchDistricts } from '@/features/prayer/prayerApi';
import { usePrayerStore } from '@/features/prayer/store';
import { formatString } from '@/lib/formatString';
import { useTheme } from '@/lib/useTheme';

import type { PrayerCity, PrayerDistrict } from '@/types';

export default function DistrictScreen() {
  const { theme } = useTheme();
  const selectDistrict = usePrayerStore((state) => state.selectDistrict);
  const refresh = usePrayerStore((state) => state.refresh);

  const [cities, setCities] = useState<PrayerCity[]>([]);
  const [districts, setDistricts] = useState<PrayerDistrict[]>([]);
  const [city, setCity] = useState<PrayerCity | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<PrayerDistrict | null>(null);
  const [query, setQuery] = useState('');
  const [listLoading, setListLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [suggestedDistrictId, setSuggestedDistrictId] = useState<string | null>(null);

  const loadCities = useCallback(async () => {
    setListLoading(true);
    const outcome = await fetchCities();
    setListLoading(false);

    if (outcome.kind !== 'ok' || outcome.data.length === 0) {
      setMessage(strings.prayer.listUnavailable);
      return;
    }

    setCities(outcome.data);
    setMessage(null);
  }, []);

  useEffect(() => {
    void loadCities();
  }, [loadCities]);

  const openCity = useCallback(async (target: PrayerCity): Promise<PrayerDistrict[]> => {
    setCity(target);
    setSelectedDistrict(null);
    setSuggestedDistrictId(null);
    setQuery('');
    setListLoading(true);

    const outcome = await fetchDistricts(target.cityId);
    setListLoading(false);

    if (outcome.kind !== 'ok' || outcome.data.length === 0) {
      setMessage(strings.prayer.listUnavailable);
      setDistricts([]);
      return [];
    }

    setDistricts(outcome.data);
    setMessage(null);
    return outcome.data;
  }, []);

  const commit = useCallback(async () => {
    if (city === null || selectedDistrict === null) {
      return;
    }

    setSubmitting(true);
    setMessage(null);
    selectDistrict(city, selectedDistrict);
    await refresh(true);
    setSubmitting(false);

    if (usePrayerStore.getState().today === null) {
      setMessage(strings.prayer.locationSavedNoTimes);
      return;
    }

    router.back();
  }, [city, refresh, selectDistrict, selectedDistrict]);

  const findFromLocation = useCallback(async () => {
    setLocating(true);
    setMessage(null);
    setSuggestedDistrictId(null);

    const place = await lookupCurrentPlace();
    if (place.kind === 'denied') {
      setLocating(false);
      setMessage(strings.prayer.locationDenied);
      return;
    }
    if (place.kind === 'unavailable') {
      setLocating(false);
      setMessage(strings.prayer.locationUnavailable);
      return;
    }

    const cityOnly = matchLocation({
      countryCode: place.countryCode,
      cityCandidates: place.cityCandidates,
      districtCandidates: place.districtCandidates,
      cities,
      districts: [],
    });

    if (cityOnly.kind === 'outsideTurkey') {
      setLocating(false);
      setMessage(strings.prayer.turkeyOnly);
      return;
    }
    if (cityOnly.kind === 'none') {
      setLocating(false);
      setMessage(strings.prayer.locationNoMatch);
      return;
    }

    const list = await openCity(cityOnly.city);
    const full = matchLocation({
      countryCode: place.countryCode,
      cityCandidates: place.cityCandidates,
      districtCandidates: place.districtCandidates,
      cities,
      districts: list,
    });

    setLocating(false);
    if (full.kind === 'district') {
      setSelectedDistrict(full.district);
      setSuggestedDistrictId(full.district.districtId);
      setMessage(formatString(strings.prayer.locationMatched, { ilce: full.district.name }));
      return;
    }

    setMessage(strings.prayer.locationCityMatched);
  }, [cities, openCity]);

  const showingDistricts = city !== null;
  const normalizedQuery = normalizePlaceName(query);
  const visibleCities = cities.filter((item) =>
    normalizePlaceName(item.name).includes(normalizedQuery),
  );
  const visibleDistricts = districts.filter((item) =>
    normalizePlaceName(item.name).includes(normalizedQuery),
  );
  const visibleItems = showingDistricts
    ? visibleDistricts.map((item) => ({ id: item.districtId, name: item.name }))
    : visibleCities.map((item) => ({ id: item.cityId, name: item.name }));

  return (
    <SafeAreaView
      edges={['top', 'bottom', 'left', 'right']}
      style={[styles.root, { backgroundColor: theme.background }]}
    >
      <Stack.Screen options={{ title: strings.prayer.selectDistrictTitle }} />

      <View style={styles.content}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={strings.a11y.closeButton}
          hitSlop={spacing.md}
          onPress={() => router.back()}
          style={styles.close}
        >
          <Ionicons name="close" size={spacing.xl} color={theme.textMuted} />
        </Pressable>

        <ScreenHeader
          title={showingDistricts ? strings.prayer.districtStepTitle : strings.prayer.cityStepTitle}
          subtitle={showingDistricts ? city.name : strings.prayer.selectDistrictBody}
        />

        {!showingDistricts ? (
          <View
            style={[
              styles.locationCard,
              { backgroundColor: theme.surfaceAlt, borderColor: theme.borderControl },
            ]}
          >
            <View style={styles.locationCopy}>
              <Ionicons name="navigate-circle-outline" size={spacing.xl} color={theme.primary} />
              <View style={styles.locationText}>
                <Text style={[textStyles.labelLarge, { color: theme.textPrimary }]}>
                  {strings.prayer.locationCardTitle}
                </Text>
                <Text style={[textStyles.bodySmall, { color: theme.textSecondary }]}>
                  {strings.prayer.locationHint}
                </Text>
              </View>
            </View>
            <Button
              label={strings.prayer.useLocation}
              variant="secondary"
              disabled={cities.length === 0}
              loading={locating}
              onPress={() => void findFromLocation()}
            />
          </View>
        ) : (
          <Button
            label={strings.prayer.backToCities}
            variant="ghost"
            onPress={() => {
              setCity(null);
              setDistricts([]);
              setSelectedDistrict(null);
              setSuggestedDistrictId(null);
              setQuery('');
              setMessage(null);
            }}
          />
        )}

        <View
          style={[
            styles.search,
            { backgroundColor: theme.surface, borderColor: theme.borderControl },
          ]}
        >
          <Ionicons name="search" size={spacing.xl} color={theme.textMuted} />
          <TextInput
            accessibilityLabel={
              showingDistricts ? strings.prayer.searchDistrict : strings.prayer.searchCity
            }
            autoCapitalize="words"
            autoCorrect={false}
            placeholder={
              showingDistricts ? strings.prayer.searchDistrict : strings.prayer.searchCity
            }
            placeholderTextColor={theme.textMuted}
            value={query}
            onChangeText={setQuery}
            style={[textStyles.bodyLarge, styles.searchInput, { color: theme.textPrimary }]}
          />
          {query === '' ? null : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={strings.prayer.clearSearch}
              hitSlop={spacing.sm}
              onPress={() => setQuery('')}
            >
              <Ionicons name="close-circle" size={spacing.xl} color={theme.textMuted} />
            </Pressable>
          )}
        </View>

        {message === null ? null : (
          <View style={[styles.message, { backgroundColor: theme.primarySoft }]}>
            <Ionicons
              name={suggestedDistrictId === null ? 'information-circle' : 'locate'}
              size={spacing.xl}
              color={theme.primary}
            />
            <Text style={[textStyles.bodyMedium, styles.messageText, { color: theme.textPrimary }]}>
              {message}
            </Text>
            {cities.length === 0 ? (
              <Button label={strings.prayer.retry} variant="ghost" onPress={() => void loadCities()} />
            ) : showingDistricts && districts.length === 0 ? (
              <Button
                label={strings.prayer.retry}
                variant="ghost"
                onPress={() => void openCity(city)}
              />
            ) : null}
          </View>
        )}

        <View style={styles.listBlock}>
          <Text style={[textStyles.labelMedium, { color: theme.textSecondary }]}>
            {formatString(strings.prayer.locationResultCount, { sayi: visibleItems.length })}
          </Text>

          {listLoading ? (
            <ActivityIndicator color={theme.primary} style={styles.spinner} />
          ) : (
            <DistrictPickerList
              items={visibleItems}
              selectedId={showingDistricts ? selectedDistrict?.districtId : null}
              emptyLabel={strings.prayer.locationSearchEmpty}
              onSelect={(id) => {
                if (showingDistricts) {
                  const target = districts.find((item) => item.districtId === id);
                  if (target !== undefined) {
                    setSelectedDistrict(target);
                    setSuggestedDistrictId(null);
                    setMessage(null);
                  }
                  return;
                }

                const target = cities.find((item) => item.cityId === id);
                if (target !== undefined) {
                  void openCity(target);
                }
              }}
            />
          )}
        </View>

        {showingDistricts ? (
          <View style={styles.confirm}>
            <Text style={[textStyles.bodySmall, { color: theme.textSecondary }]}>
              {selectedDistrict === null
                ? strings.prayer.chooseDistrictToContinue
                : formatString(strings.prayer.selectedLocation, {
                    ilce: selectedDistrict.name,
                    il: city.name,
                  })}
            </Text>
            <Button
              label={strings.prayer.locationUseMatch}
              fullWidth
              disabled={selectedDistrict === null}
              loading={submitting}
              onPress={() => void commit()}
            />
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    flex: 1,
    gap: layout.listGap,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: layout.screenPaddingVertical,
  },
  close: { alignSelf: 'flex-start' },
  locationCard: {
    gap: spacing.md,
    padding: layout.cardPadding,
    borderWidth: 1,
    borderRadius: componentRadius.card,
  },
  locationCopy: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  locationText: { flex: 1, gap: spacing.xs },
  search: {
    minHeight: layout.minTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: componentRadius.input,
  },
  searchInput: { flex: 1, paddingVertical: spacing.sm },
  message: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: componentRadius.card,
  },
  messageText: { flex: 1 },
  listBlock: { flex: 1, gap: spacing.sm },
  spinner: { flex: 1 },
  confirm: { gap: spacing.sm },
});
