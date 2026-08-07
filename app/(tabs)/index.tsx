import Screen from '@/components/Screen';
import ScreenHeader from '@/components/ScreenHeader';
import strings from '@/constants/strings';

// Öğrenme yolu ekranı — şimdilik iskelet. Seviye haritası Faz 2'de gelecek.
export default function LearnScreen() {
  return (
    <Screen>
      <ScreenHeader title={strings.learn.title} subtitle={strings.learn.emptyPath} />
    </Screen>
  );
}
