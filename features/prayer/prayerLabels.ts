import strings from '@/constants/strings';

import type { PrayerName } from '@/types';

/**
 * Vakit adı → görünen etiket. **Yapısal etiket, dini içerik değil.**
 *
 * ⚠️ Faz 4.4'te `components/NextPrayerCard.tsx` içinden BURAYA taşındı.
 * Sebep: bildirim başlığı da bu haritayı istiyor ve `notifications.ts` yerel
 * bir modül; bir React bileşenini import etmesi bütün bileşen ağacını yerel
 * katmana sokardı. (4.1'de `normalizeTr`in `lib/turkishText.ts`e taşınmasının
 * aynı gerekçesi.)
 */
export const PRAYER_LABELS: Record<PrayerName, string> = {
  imsak: strings.prayer.imsak,
  gunes: strings.prayer.gunes,
  ogle: strings.prayer.ogle,
  ikindi: strings.prayer.ikindi,
  aksam: strings.prayer.aksam,
  yatsi: strings.prayer.yatsi,
};
