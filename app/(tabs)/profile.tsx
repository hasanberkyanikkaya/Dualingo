import Screen from '@/components/Screen';
import ScreenHeader from '@/components/ScreenHeader';
import strings from '@/constants/strings';

// Profil ekranı — şimdilik iskelet. İstatistik ve ayarlar Faz 3'te gelecek.
export default function ProfileScreen() {
  return (
    <Screen>
      <ScreenHeader title={strings.profile.title} subtitle={strings.profile.emptyBody} />
    </Screen>
  );
}
