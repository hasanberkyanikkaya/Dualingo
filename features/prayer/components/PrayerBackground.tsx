import IllustratedBackground from '@/components/IllustratedBackground';

const prayerRug = require('@/assets/images/prayer/prayer-illustrated-background.png');

/** Namaz sekmesinde içerikten bağımsız, sabit kalan seccade zemini. */
export default function PrayerBackground() {
  return <IllustratedBackground source={prayerRug} />;
}
