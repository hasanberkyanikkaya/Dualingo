import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/Button';
import ScreenHeader from '@/components/ScreenHeader';
import { componentRadius } from '@/constants/radius';
import { layout, spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import DistrictPickerList from '@/features/prayer/components/DistrictPickerList';
import { matchLocation } from '@/features/prayer/districtMatch';
import { lookupCurrentPlace } from '@/features/prayer/location';
import { fetchCities, fetchDistricts } from '@/features/prayer/prayerApi';
import { usePrayerStore } from '@/features/prayer/store';
import { formatString } from '@/lib/formatString';
import { useTheme } from '@/lib/useTheme';

import type { PrayerCity, PrayerDistrict } from '@/types';

/**
 * İlçe seçim ekranı.
 *
 * ⚠️ **Konum izni istemeden ilerleyen yol her zaman açık** (4.0 kararı):
 * "Konumumdan bul" bir kısayol, zorunluluk değil. Ekran il listesiyle açılıyor;
 * kullanıcı düğmeye hiç dokunmadan seçimini tamamlayabilir.
 *
 * ⚠️ Konum eşleşse bile **otomatik seçim yapılmıyor** — sonuç bir öneri kartı
 * olarak gösterilip onaya sunuluyor. Yanlış ilçe = yanlış vakit, bu modülün tek
 * kabul edilemez hatası.
 *
 * ⚠️ Ekran `Screen` kullanmıyor: odaklanmış bir bağlam, mercan şerit yok
 * (ders ekranının 2.3'teki aynı kararı). Bu yüzden güvenli alan payını kendisi
 * çiziyor ve DÖRT kenarı da alıyor.
 */
export default function DistrictScreen() {
  const { theme } = useTheme();
  const selectDistrict = usePrayerStore((state) => state.selectDistrict);
  const refresh = usePrayerStore((state) => state.refresh);

  const [cities, setCities] = useState<PrayerCity[]>([]);
  const [districts, setDistricts] = useState<PrayerDistrict[]>([]);
  const [city, setCity] = useState<PrayerCity | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<{ city: PrayerCity; district: PrayerDistrict } | null>(
    null,
  );

  const loadCities = useCallback(async () => {
    setLoading(true);
    const outcome = await fetchCities();
    setLoading(false);

    if (outcome.kind !== 'ok' || outcome.data.length === 0) {
      // ⚠️ Listeler SQLite'a yazılmıyor (üçüncü tarafın kataloğu, kullanıcı
      // verisi değil), dolayısıyla ilk açılışta ağ yoksa seçim yapılamaz.
      // Bilinçli olarak kabul edilen sonuç; dürüst bir boş durum gösteriliyor.
      setMessage(strings.prayer.listUnavailable);
      return;
    }

    setMessage(null);
    setCities(outcome.data);
  }, []);

  useEffect(() => {
    void loadCities();
  }, [loadCities]);

  const openCity = useCallback(async (target: PrayerCity): Promise<PrayerDistrict[]> => {
    setCity(target);
    setLoading(true);
    const outcome = await fetchDistricts(target.cityId);
    setLoading(false);

    if (outcome.kind !== 'ok' || outcome.data.length === 0) {
      setMessage(strings.prayer.listUnavailable);
      setDistricts([]);
      return [];
    }

    setMessage(null);
    setDistricts(outcome.data);
    return outcome.data;
  }, []);

  const commit = useCallback(
    (target: PrayerCity, district: PrayerDistrict) => {
      selectDistrict(target, district);
      // İlçe seçildikten sonra çekim ZORUNLU: yeni ilçenin hiç verisi yok ve
      // kullanıcı boş bir ekrana dönmemeli.
      void refresh(true);
      router.back();
    },
    [refresh, selectDistrict],
  );

  const findFromLocation = useCallback(async () => {
    setSuggestion(null);
    setLoading(true);
    const place = await lookupCurrentPlace();

    if (place.kind === 'denied') {
      setLoading(false);
      setMessage(strings.prayer.locationDenied);
      return;
    }

    if (place.kind === 'unavailable') {
      setLoading(false);
      setMessage(strings.prayer.locationUnavailable);
      return;
    }

    // İl önce eşleşmeli; ilçe listesi ancak ondan sonra indirilebiliyor.
    const cityOnly = matchLocation({
      countryCode: place.countryCode,
      cityCandidates: place.cityCandidates,
      districtCandidates: place.districtCandidates,
      cities,
      districts: [],
    });

    if (cityOnly.kind === 'outsideTurkey') {
      setLoading(false);
      setMessage(strings.prayer.turkeyOnly);
      return;
    }

    if (cityOnly.kind === 'none') {
      setLoading(false);
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

    if (full.kind === 'district') {
      // ⚠️ Otomatik SEÇİLMİYOR — öneri olarak gösterilip onaya sunuluyor.
      setSuggestion({ city: full.city, district: full.district });
      setMessage(null);
      return;
    }

    // İl tuttu ama ilçe emin değil: kullanıcı zaten o ilin listesinde duruyor.
    setMessage(strings.prayer.locationNoMatch);
  }, [cities, openCity]);

  const showingDistricts = city !== null;

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={[styles.root, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ title: strings.prayer.selectDistrictTitle }} />

      <View style={styles.content}>
        {/*
          ⚠️ Kapatma düğmesi ELLE çiziliyor: kök yerleşim `headerShown: false`
          veriyor (`app/_layout.tsx`), yani navigatörün geri düğmesi yok.
          Olmasaydı ekrandan çıkışın tek yolu iOS'ta kenardan kaydırma, Android'de
          donanım tuşu olurdu — ikisi de görünmez.
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

        <ScreenHeader
          title={showingDistricts ? strings.prayer.districtStepTitle : strings.prayer.cityStepTitle}
          subtitle={showingDistricts ? city.name : strings.prayer.selectDistrictBody}
        />

        {!showingDistricts ? (
          <View style={styles.locationBlock}>
            <Button label={strings.prayer.useLocation} variant="ghost" onPress={() => void findFromLocation()} />
            <Text style={[textStyles.caption, { color: theme.textMuted }]}>
              {strings.prayer.locationHint}
            </Text>
          </View>
        ) : (
          <Button
            label={strings.prayer.backToCities}
            variant="ghost"
            onPress={() => {
              setCity(null);
              setDistricts([]);
              setMessage(null);
            }}
          />
        )}

        {suggestion !== null ? (
          // ⚠️ Metin "bulunduğun ilçe" diyor, "en yakın ilçe" DEMİYOR: servis
          // koordinat vermiyor, ortada bir mesafe hesabı yok.
          <View style={[styles.suggestion, { backgroundColor: theme.primarySoft }]}>
            <Text style={[textStyles.bodyStrong, { color: theme.textPrimary }]}>
              {formatString(strings.prayer.locationMatched, { ilce: suggestion.district.name })}
            </Text>
            <Button
              label={strings.prayer.locationUseMatch}
              onPress={() => commit(suggestion.city, suggestion.district)}
            />
          </View>
        ) : null}

        {message !== null ? (
          <View style={styles.messageBlock}>
            <Text style={[textStyles.bodyMedium, { color: theme.textSecondary }]}>{message}</Text>
            {cities.length === 0 ? (
              <Button label={strings.prayer.retry} variant="ghost" onPress={() => void loadCities()} />
            ) : null}
          </View>
        ) : null}

        {loading ? (
          <ActivityIndicator color={theme.primary} style={styles.spinner} />
        ) : (
          <DistrictPickerList
            items={
              showingDistricts
                ? districts.map((item) => ({ id: item.districtId, name: item.name }))
                : cities.map((item) => ({ id: item.cityId, name: item.name }))
            }
            onSelect={(id) => {
              if (showingDistricts) {
                const target = districts.find((item) => item.districtId === id);
                if (target !== undefined) {
                  commit(city, target);
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
    gap: layout.listGap,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: layout.screenPaddingVertical,
  },
  close: {
    alignSelf: 'flex-start',
  },
  locationBlock: {
    gap: spacing.xs,
  },
  suggestion: {
    padding: layout.cardPadding,
    borderRadius: componentRadius.card,
    gap: spacing.md,
  },
  messageBlock: {
    gap: spacing.sm,
  },
  spinner: {
    flex: 1,
  },
});
