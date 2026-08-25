import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import Button from '@/components/Button';
import Screen from '@/components/Screen';
import ScreenHeader from '@/components/ScreenHeader';
import { layout, spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import BadgeSection from '@/features/progress/components/BadgeSection';
import { useTheme } from '@/lib/useTheme';

/** Seviye tespitini yeniden çalıştırır. Karşılama adımı atlanır (`retake`). */
function openPlacement() {
  router.push({ pathname: '/placement', params: { retake: '1' } });
}

// Profil ekranı — şimdilik iskelet. İstatistik ve ayarlar Faz 3'te gelecek.
export default function ProfileScreen() {
  const { theme } = useTheme();

  return (
    <Screen>
      <View style={styles.root}>
        <ScreenHeader title={strings.profile.title} subtitle={strings.profile.emptyBody} />

        {/*
          "Geri dönüp atlanan üniteleri açabilme" garantisinin görünür olduğu yer.
          ⚠️ Tekrar HİÇBİR ilerlemeyi silmiyor: `applyPlacement` `completed`
          kayıtlara hiçbir koşulda dokunmuyor, daha düşük bir kademe seçilse bile.
          `profile.placementBody` bunu kullanıcıya söz olarak veriyor.
        */}
        <View style={styles.section}>
          {/* Bölüm başlığı `h3`: `ScreenHeader` `h2` çiziyor ve ekranda ikinci
              bir `h2` başlık hiyerarşisini düzler. */}
          <Text accessibilityRole="header" style={[textStyles.h3, { color: theme.textPrimary }]}>
            {strings.profile.placementTitle}
          </Text>

          <Text style={[textStyles.bodyMedium, { color: theme.textSecondary }]}>
            {strings.profile.placementBody}
          </Text>

          <Button
            label={strings.profile.placementAction}
            onPress={openPlacement}
            variant="secondary"
          />
        </View>

        {/*
          Namaz vakti bildirimleri (Faz 4.4).

          ⚠️ Ayarlar profilde ama ekran `app/prayer/` altında ve bu bilinçli:
          bildirim namaz modülünün bir parçası, profilin değil. Profil yalnızca
          kapıyı açıyor.
        */}
        <View style={styles.section}>
          <Text accessibilityRole="header" style={[textStyles.h3, { color: theme.textPrimary }]}>
            {strings.profile.prayerNotificationsTitle}
          </Text>

          <Text style={[textStyles.bodyMedium, { color: theme.textSecondary }]}>
            {strings.profile.prayerNotificationsBody}
          </Text>

          <Button
            label={strings.profile.prayerNotificationsAction}
            onPress={() => router.push('/prayer/notifications')}
            variant="secondary"
          />
        </View>

        <View style={styles.section}>
          <Text accessibilityRole="header" style={[textStyles.h3, { color: theme.textPrimary }]}>
            {strings.profile.accountTitle}
          </Text>
          <Text style={[textStyles.bodyMedium, { color: theme.textSecondary }]}>
            {strings.profile.accountBody}
          </Text>
          <Button
            label={strings.profile.accountAction}
            onPress={() => router.push('/account')}
            variant="secondary"
          />
        </View>

        {/* Ekran dosyası ince kalıyor (mimari kural 2): rozetlerin tamamı
            kendi bölüm bileşeninde. */}
        <BadgeSection />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: layout.sectionGap,
  },
  section: {
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
});
