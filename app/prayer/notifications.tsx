import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/Button';
import ScreenHeader from '@/components/ScreenHeader';
import { componentRadius } from '@/constants/radius';
import { layout, spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import OffsetPicker from '@/features/prayer/components/OffsetPicker';
import { PRAYER_LABELS } from '@/features/prayer/prayerLabels';
import { TRACKABLE_PRAYERS } from '@/features/prayer/prayerDay';
import { usePrayerStore } from '@/features/prayer/store';
import { resolvePref } from '@/features/prayer/prayerNotify';
import { usePrayerNotifications } from '@/features/prayer/usePrayerNotifications';
import { formatString } from '@/lib/formatString';
import { useTheme } from '@/lib/useTheme';

/**
 * Namaz vakti bildirim ayarları (Faz 4.4).
 *
 * ⚠️ Ekran `Screen` kullanmıyor: odaklanmış bir bağlam, mercan şerit yok
 * (2.3'ün ders ekranı, 4.1'in ilçe ekranı ve 4.3'ün çizelgesiyle aynı karar).
 * Güvenli alan payını kendisi çiziyor ve DÖRT kenarı da alıyor; kapatma
 * düğmesi ELLE çiziliyor çünkü kök yerleşim `headerShown: false` veriyor.
 *
 * ⚠️ **Hiçbir metin yargı taşımıyor.** Bildirim, kullanıcının izin vermediği
 * bir anda elinde olmayan bir yerde belirir; orada "unutma" demek uyarı değil
 * baskıdır. Ekran neyin ne zaman geleceğini söyler, gerisini kullanıcıya
 * bırakır (4.3'ün yasaklı dil kuralının sürdürülmesi).
 */
export default function PrayerNotificationsScreen() {
  const { theme } = useTheme();
  const { prefs, permission, toggle, setOffset, setAll, refreshPermission } = usePrayerNotifications();
  const district = usePrayerStore((state) => state.district);

  // ⚠️ Kullanıcı "Ayarları aç"a basıp sistem ayarlarına gidip DÖNEBİLİR; izin
  // durumu o sırada değişmiş olur. Odak geri geldiğinde yeniden sorulmazsa
  // ekran "izin kapalı" derken bildirimler çalışıyor olurdu.
  useFocusEffect(
    useCallback(() => {
      refreshPermission();
    }, [refreshPermission]),
  );

  const allOff = TRACKABLE_PRAYERS.every((prayer) => !resolvePref(prefs, prayer).enabled);
  const allOn = TRACKABLE_PRAYERS.every((prayer) => resolvePref(prefs, prayer).enabled);

  return (
    <SafeAreaView
      edges={['top', 'bottom', 'left', 'right']}
      style={[styles.root, { backgroundColor: theme.background }]}
    >
      <Stack.Screen options={{ title: strings.prayer.notificationsTitle }} />

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

        <ScreenHeader
          title={strings.prayer.notificationsTitle}
          subtitle={strings.prayer.notificationsBody}
        />

        <View
          style={[
            styles.quickSetup,
            { backgroundColor: theme.surfaceAlt, borderColor: theme.borderControl },
          ]}
        >
          <View style={styles.quickHeading}>
            <Ionicons name="location-outline" size={spacing.xl} color={theme.primary} />
            <View style={styles.quickCopy}>
              <Text style={[textStyles.labelLarge, { color: theme.textPrimary }]}>
                {strings.prayer.notificationLocationTitle}
              </Text>
              <Text style={[textStyles.bodySmall, { color: theme.textSecondary }]}>
                {district === null
                  ? strings.prayer.notificationNoLocation
                  : formatString(strings.prayer.notificationSelectedLocation, {
                      ilce: district.districtName,
                      il: district.cityName,
                    })}
              </Text>
            </View>
          </View>

          {district === null ? (
            <Button
              label={strings.prayer.selectDistrictTitle}
              variant="secondary"
              onPress={() => router.push('/prayer/district')}
            />
          ) : (
            <View style={styles.quickButtons}>
              <Button
                label={strings.prayer.enableAllNotifications}
                disabled={allOn}
                onPress={() => setAll(true)}
              />
              <Button
                label={strings.prayer.disableAllNotifications}
                variant="ghost"
                disabled={allOff}
                onPress={() => setAll(false)}
              />
            </View>
          )}
        </View>

        {/*
          ⚠️ İzin kartı yalnızca izin GERÇEKTEN kapalıyken çıkıyor; `permission`
          `null` iken (henüz sorulmadı) hiçbir şey çizilmiyor — bir kare
          "izin kapalı" gösterip sonra kaybolmak yanlış alarm olurdu.

          ⚠️ Kartın kenarlığı YOK: dolgu `primarySoft` ve `borderControl` renkli
          yumuşak dolgu üzerine çizilmez (2.3 ölçümü: 2.39 koyu). İkincil satır
          `textSecondary`, `textMuted` DEĞİL (orada 4.16, AA altı).
        */}
        {permission === 'denied' ? (
          <View style={[styles.notice, { backgroundColor: theme.primarySoft }]}>
            <Text style={[textStyles.labelLarge, { color: theme.textPrimary }]}>
              {strings.prayer.permissionDeniedTitle}
            </Text>
            <Text style={[textStyles.bodyMedium, { color: theme.textSecondary }]}>
              {strings.prayer.permissionDeniedBody}
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

        <View style={styles.list}>
          {TRACKABLE_PRAYERS.map((prayer) => {
            const { enabled, offsetMinutes } = resolvePref(prefs, prayer);
            const label = PRAYER_LABELS[prayer];

            return (
              <View key={prayer} style={styles.row}>
                <View style={styles.rowHeader}>
                  <Text style={[textStyles.h4, { color: theme.textPrimary }]}>{label}</Text>

                  {/*
                    ⚠️ Durumu renk TAŞIMIYOR ve taşımasına gerek yok: `Switch`
                    platformun kendi kontrolü, açık/kapalı bilgisini işletim
                    sistemi rolü ve başparmağın konumu veriyor. Özel çizdiğimiz
                    kontrollerde (`PrayerStatusControl`, `OffsetPicker`) ikon
                    biçimine başvurmamızın sebebi tam da bu güvencenin
                    olmamasıydı.
                  */}
                  <Switch
                    accessibilityLabel={formatString(strings.a11y.prayerNotificationToggle, {
                      vakit: label,
                    })}
                    value={enabled}
                    onValueChange={() => toggle(prayer)}
                    trackColor={{ false: theme.border, true: theme.primary }}
                  />
                </View>

                {enabled ? (
                  <View style={styles.timing}>
                    <Text style={[textStyles.labelMedium, { color: theme.textSecondary }]}>
                      {strings.prayer.notificationTiming}
                    </Text>
                    <OffsetPicker
                      value={offsetMinutes}
                      prayerLabel={label}
                      onChange={(offset) => setOffset(prayer, offset)}
                    />
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>

        {allOff ? (
          <Text style={[textStyles.bodySmall, { color: theme.textSecondary }]}>
            {strings.prayer.notificationsAllOff}
          </Text>
        ) : null}

        <Text style={[textStyles.caption, { color: theme.textMuted }]}>
          {strings.prayer.notificationsHint}
        </Text>
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
  quickSetup: {
    gap: spacing.md,
    padding: layout.cardPadding,
    borderWidth: 1,
    borderRadius: componentRadius.card,
  },
  quickHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  quickCopy: { flex: 1, gap: spacing.xs },
  quickButtons: { gap: spacing.sm },
  list: {
    gap: layout.sectionGap,
  },
  row: {
    gap: spacing.md,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: layout.minTouchTarget,
  },
  timing: {
    gap: spacing.sm,
  },
});
