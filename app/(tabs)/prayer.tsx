import ComingSoon from '@/components/ComingSoon';
import Screen from '@/components/Screen';
import ScreenHeader from '@/components/ScreenHeader';
import strings from '@/constants/strings';

// Namaz sekmesi — v0.1'de dolmayacak, "Yakında" durumunda duruyor (Faz 4).
export default function PrayerScreen() {
  return (
    <Screen>
      <ScreenHeader title={strings.prayer.title} />
      <ComingSoon
        icon="moon-outline"
        title={strings.prayer.comingSoonTitle}
        body={strings.prayer.comingSoonBody}
      />
    </Screen>
  );
}
