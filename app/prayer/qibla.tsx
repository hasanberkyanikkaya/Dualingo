import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/Button';
import ScreenHeader from '@/components/ScreenHeader';
import { componentRadius } from '@/constants/radius';
import { layout, spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import QiblaDial from '@/features/prayer/components/QiblaDial';
import { usePrayerStore } from '@/features/prayer/store';
import { useQibla } from '@/features/prayer/useQibla';
import { formatString } from '@/lib/formatString';
import { useTheme } from '@/lib/useTheme';

/**
 * Kıble pusulası (Faz 4.5).
 *
 * ⚠️ Ekran `Screen` kullanmıyor: odaklanmış bir bağlam, mercan şerit yok
 * (2.3'ün ders ekranı, 4.1'in ilçe, 4.3'ün çizelge ve 4.4'ün bildirim
 * ekranlarıyla aynı karar). Güvenli alan payını kendisi çiziyor ve DÖRT kenarı
 * da alıyor; kapatma düğmesi ELLE çiziliyor çünkü kök yerleşim
 * `headerShown: false` veriyor.
 *
 * ⚠️ **`turkeyOnly` kısıtı YOK.** Namaz vakitlerinin aksine kıble açısı
 * dünyanın her yerinde hesaplanabilir; bu ekran ülke sormaz. Yalnızca kıble
 * saati paneli indirilmiş veriye bağlı ve o yoksa hiç çizilmiyor.
 *
 * ⚠️ **DİNİ İÇERİK SINIRI.** Ekranda hiçbir fıkhi hüküm, tarif ya da geçerlilik
 * ifadesi geçmiyor. Kıble saati paneli yalnızca astronomik olguyu söylüyor ve
 * bununla ne yapılacağını anlatmıyor. Alt açıklama teknik: yön sensörden okunur
 * ve etkilenebilir (4.3/4.4'ün yasaklı dil kuralının sürdürülmesi).
 */
export default function QiblaScreen() {
  const { theme } = useTheme();
  const { status, bearing, rotation, delta, aligned, quality, retry } = useQibla();

  /*
   * ⚠️ Kıble saati BEDAVA geliyor: `prayer_time.kible_saati` 4.1'den beri
   * yazılıyor ama tüketicisi yoktu. Yeni istek, yeni sütun, yeni ayrıştırma yok.
   *
   * ⚠️ Yalnızca değer VARKEN çiziliyor, yer tutucu YAZILMIYOR — namaz
   * sekmesindeki Hicri tarih kararının aynısı.
   */
  const kibleSaati = usePrayerStore((state) => state.today?.kibleSaati ?? null);

  const showDial = status === 'ready' && bearing !== null;

  return (
    <SafeAreaView
      edges={['top', 'bottom', 'left', 'right']}
      style={[styles.root, { backgroundColor: theme.background }]}
    >
      <Stack.Screen options={{ title: strings.prayer.qiblaTitle }} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={strings.a11y.closeButton}
          hitSlop={spacing.md}
          onPress={() => router.back()}
          style={styles.close}
        >
          <Ionicons name="close" size={spacing.xl} color={theme.textMuted} />
        </Pressable>

        <ScreenHeader title={strings.prayer.qiblaTitle} subtitle={strings.prayer.qiblaBody} />

        {status === 'locating' ? (
          <Text style={[textStyles.bodyMedium, { color: theme.textSecondary }]}>
            {strings.prayer.qiblaLocating}
          </Text>
        ) : null}

        {/*
          ⚠️ İzin kartının kenarlığı YOK: dolgu `primarySoft` ve `borderControl`
          renkli yumuşak dolgu üzerine çizilmez (2.3 ölçümü: 2.39 koyu).
          İkincil satır `textSecondary`, `textMuted` DEĞİL (orada 4.16, AA altı).
          `notifications.tsx`teki izin kartının aynısı.
        */}
        {status === 'denied' ? (
          <View style={[styles.notice, { backgroundColor: theme.primarySoft }]}>
            <Text style={[textStyles.labelLarge, { color: theme.textPrimary }]}>
              {strings.prayer.qiblaPermissionTitle}
            </Text>
            <Text style={[textStyles.bodyMedium, { color: theme.textSecondary }]}>
              {strings.prayer.qiblaPermissionBody}
            </Text>
            <Button
              label={strings.prayer.openSettings}
              variant="secondary"
              onPress={() => {
                void Linking.openSettings();
              }}
            />
          </View>
        ) : null}

        {status === 'unavailable' ? (
          <View style={styles.empty}>
            <Ionicons name="compass-outline" size={spacing.huge} color={theme.textMuted} />
            <Text style={[textStyles.bodyMedium, styles.centered, { color: theme.textSecondary }]}>
              {strings.prayer.qiblaUnavailable}
            </Text>
            <Button label={strings.prayer.retry} variant="secondary" onPress={retry} />
          </View>
        ) : null}

        {showDial ? (
          <>
            {/*
              ⚠️ Kalibrasyon uyarısı kadranın ÜSTÜNDE: kullanıcı yanlış bir yöne
              güvenmeden önce görmeli. `quality === 'unknown'` iken hiçbir şey
              çizilmiyor — henüz ölçüm gelmemişken "pusulan bozuk" demek yanlış
              alarmdır (`notifications.tsx`in `permission === null` kararı).
            */}
            {quality === 'low' ? (
              <View style={[styles.notice, { backgroundColor: theme.primarySoft }]}>
                <Text style={[textStyles.labelLarge, { color: theme.textPrimary }]}>
                  {strings.prayer.qiblaCalibrateTitle}
                </Text>
                <Text style={[textStyles.bodyMedium, { color: theme.textSecondary }]}>
                  {strings.prayer.qiblaCalibrateBody}
                </Text>
              </View>
            ) : null}

            <QiblaDial bearing={bearing} rotation={rotation} aligned={aligned} />

            {/*
              ⚠️ Bu satır hizalanmanın renkten BAĞIMSIZ ikinci taşıyıcısı
              (birincisi işaretçi ikonunun biçimi). Renk tek başına bırakılsaydı
              WCAG 1.4.1'e takılırdı.
            */}
            <Text style={[textStyles.h3, styles.centered, { color: theme.textPrimary }]}>
              {aligned || delta === null
                ? strings.prayer.qiblaAligned
                : formatString(
                    delta > 0 ? strings.prayer.qiblaTurnRight : strings.prayer.qiblaTurnLeft,
                    { derece: Math.abs(Math.round(delta)) },
                  )}
            </Text>

            <Text style={[textStyles.bodyMedium, styles.centered, { color: theme.textSecondary }]}>
              {formatString(strings.prayer.qiblaBearing, { derece: Math.round(bearing) })}
            </Text>

            {kibleSaati !== null ? (
              <View style={styles.timeBlock}>
                <Text style={[textStyles.labelLarge, { color: theme.textSecondary }]}>
                  {strings.prayer.qiblaTimeTitle}
                </Text>
                <Text style={[textStyles.h2, { color: theme.textPrimary }]}>{kibleSaati}</Text>
                <Text style={[textStyles.bodySmall, { color: theme.textSecondary }]}>
                  {strings.prayer.qiblaTimeBody}
                </Text>
                <Text style={[textStyles.caption, { color: theme.textMuted }]}>
                  {strings.prayer.attribution}
                </Text>
              </View>
            ) : null}

            <Text style={[textStyles.caption, styles.centered, { color: theme.textMuted }]}>
              {strings.prayer.qiblaHint}
            </Text>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
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
  notice: {
    gap: spacing.sm,
    alignItems: 'flex-start',
    padding: layout.cardPadding,
    borderRadius: componentRadius.card,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: layout.sectionGap,
  },
  centered: {
    textAlign: 'center',
  },
  timeBlock: {
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
});
