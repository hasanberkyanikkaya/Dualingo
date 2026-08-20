import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import Button from '@/components/Button';
import Screen from '@/components/Screen';
import ScreenHeader from '@/components/ScreenHeader';
import { layout, spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import NextPrayerCard from '@/features/prayer/components/NextPrayerCard';
import PrayerTimesTable from '@/features/prayer/components/PrayerTimesTable';
import { buildPrayerDay } from '@/features/prayer/prayerDay';
import { usePrayerTimes } from '@/features/prayer/usePrayerTimes';
import { formatGregorianTr } from '@/lib/turkishDate';
import { useTheme } from '@/lib/useTheme';

/**
 * Namaz sekmesi (Faz 4.1).
 *
 * Ekran ince: veri `usePrayerTimes`ten geliyor, karar mantığı `features/prayer`
 * altındaki saf modüllerde. Burada yalnızca düzen ve dört durumun ayrımı var:
 * ilçe yok · veri yok · veri var · ağ uyarısı.
 *
 * Faz 4.2'de üç şey eklendi: kart büyüdü ve ortalandı, tablo geçmiş vakitleri
 * soluk çiziyor ve kılındı işareti taşıyor, başlık altına Miladi + Hicri tarih
 * geldi.
 *
 * ⚠️ **Tarih satırı YER TUTUCU yazmaz.** Hicri tarih yoksa (4.2'den önce
 * indirilmiş satırlarda `hicriLong` `NULL`) satır kısalır, "—" ya da "bilinmiyor"
 * yazılmaz. Miladi tarih de çözülemezse satırın tamamı çizilmez.
 *
 * ⚠️ **Ağ uyarısı yalnızca ekran BOŞKEN gösteriliyor.** Dolu bir ekranda
 * "sunucuya ulaşılamadı" demek kullanıcıyı boşuna telaşlandırır — vakitler
 * zaten önbellekte ve doğru. 4.0'ın "çevrimdışı + önbellek dolu → hiçbir şey
 * değişmez" kararının görünen yüzü.
 */
export default function PrayerScreen() {
  const { theme } = useTheme();
  const { district, today, next, markedToday, notice, loading, refresh, recompute, toggleMark } =
    usePrayerTimes();

  if (district === null) {
    return (
      <Screen>
        <ScreenHeader title={strings.prayer.title} />
        <View style={styles.empty}>
          <Ionicons name="location-outline" size={spacing.huge} color={theme.textMuted} />
          <Text style={[textStyles.h3, styles.centered, { color: theme.textPrimary }]}>
            {strings.prayer.noDistrictTitle}
          </Text>
          <Text style={[textStyles.bodyMedium, styles.centered, { color: theme.textSecondary }]}>
            {strings.prayer.noDistrictBody}
          </Text>
          <Button
            label={strings.prayer.selectDistrictTitle}
            onPress={() => router.push('/prayer/district')}
          />
        </View>
      </Screen>
    );
  }

  const subtitle = `${district.districtName}, ${district.cityName}`;

  // ⚠️ `useMemo` YOK — `app.json`'da `reactCompiler: true`, belletme
  // derleyicinin işi. Elle sarmak projede hiçbir yerde yapılmıyor.
  const rows = buildPrayerDay(today, next, markedToday, Date.now());

  const gregorian = today === null ? null : formatGregorianTr(today.date);
  // Uzun biçim servisin yazdığı metindir; yoksa kısa biçime düşülür. Hicri ay
  // adları bu projede ÜRETİLMEZ (dini içerik politikası) — kaynak ne
  // gönderdiyse o gösterilir.
  const hijri = today === null ? null : (today.hicriLong ?? today.hicriShort);
  const dateLine = [gregorian, hijri].filter((part) => part !== null).join('  ·  ');

  return (
    <Screen>
      <ScreenHeader title={strings.prayer.title} subtitle={subtitle} />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {next !== null ? <NextPrayerCard next={next} onElapsed={recompute} /> : null}

        {today !== null ? (
          <View>
            <Text style={[textStyles.labelLarge, { color: theme.textSecondary }]}>
              {strings.prayer.todayTitle}
            </Text>

            {dateLine !== '' ? (
              <Text style={[textStyles.bodySmall, styles.dateLine, { color: theme.textSecondary }]}>
                {dateLine}
              </Text>
            ) : null}

            <View style={styles.table}>
              <PrayerTimesTable rows={rows} onToggle={toggleMark} />
            </View>
          </View>
        ) : (
          <View style={styles.empty}>
            <Ionicons name="cloud-offline-outline" size={spacing.huge} color={theme.textMuted} />
            <Text style={[textStyles.h3, styles.centered, { color: theme.textPrimary }]}>
              {strings.prayer.emptyTitle}
            </Text>
            <Text style={[textStyles.bodyMedium, styles.centered, { color: theme.textSecondary }]}>
              {/*
                ⚠️ Uyarı metni yalnızca burada — yani veri YOKKEN — görünüyor.
                `notice` dolu bir ekranda sessiz kalıyor.
              */}
              {notice === 'upstream'
                ? strings.prayer.upstreamError
                : notice === 'offline'
                  ? strings.prayer.offlineNotice
                  : notice === 'invalidDistrict'
                    ? strings.prayer.invalidDistrict
                    : strings.prayer.emptyBody}
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          <Button
            label={strings.prayer.refresh}
            variant="secondary"
            loading={loading}
            onPress={() => {
              void refresh(true);
            }}
          />
          <Button
            label={strings.prayer.changeDistrict}
            variant="ghost"
            onPress={() => router.push('/prayer/district')}
          />
        </View>

        {/*
          ⚠️ Atıf ZORUNLU ve metni birebir `strings.prayer.attribution`dan
          geliyor. Veri Diyanet İşleri Başkanlığı'nın yayınladığı tablodur ama
          uygulama Diyanet'in değildir; "resmi" ya da "onaylı" demek hem hukuki
          hem mağaza incelemesi riski (4.0 kararı).
        */}
        <Text style={[textStyles.caption, styles.centered, { color: theme.textMuted }]}>
          {strings.prayer.attribution}
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: layout.sectionGap,
    paddingBottom: layout.sectionGap,
  },
  dateLine: {
    marginTop: spacing.xs,
  },
  table: {
    marginTop: spacing.sm,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingVertical: layout.sectionGap,
  },
  centered: {
    textAlign: 'center',
  },
  actions: {
    gap: layout.listGap,
  },
});
