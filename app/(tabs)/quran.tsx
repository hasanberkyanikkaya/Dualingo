import ComingSoon from '@/components/ComingSoon';
import Screen from '@/components/Screen';
import ScreenHeader from '@/components/ScreenHeader';
import strings from '@/constants/strings';

// Kur'an sekmesi — v0.1'de dolmayacak, "Yakında" durumunda duruyor (Faz 5).
export default function QuranScreen() {
  return (
    <Screen>
      <ScreenHeader title={strings.quran.title} />
      <ComingSoon
        icon="book-outline"
        title={strings.quran.comingSoonTitle}
        body={strings.quran.comingSoonBody}
      />
    </Screen>
  );
}
