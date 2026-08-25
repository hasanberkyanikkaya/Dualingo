import { StyleSheet, Text } from 'react-native';

import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import { splitRemaining, useCountdown } from '@/features/prayer/useCountdown';
import { formatString } from '@/lib/formatString';
import { useTheme } from '@/lib/useTheme';

import type { Timestamp } from '@/types';

type CountdownLabelProps = {
  /** Hedef an. `null` ise geri sayım hiç kurulmaz. */
  target: Timestamp | null;
  /** Hedefe varıldığında bir kez çağrılır — sıradaki vakti yeniden hesaplamak için. */
  onElapsed: () => void;
  compact?: boolean;
};

/**
 * Saniyede bir güncellenen geri sayım — **tik atan tek yaprak**.
 *
 * ⚠️ `useCountdown` bilerek BURADA çağrılıyor, `NextPrayerCard`ta ya da ekranda
 * değil. Yukarıda çağrılsaydı saniyede bir kez kart, tablo ve ekran birlikte
 * yeniden çizilirdi. 3.3'ün "her yıldız kendi `Star` bileşenine taşındı"
 * kararının aynı sınıftan devamı: tikleyen durum, tikleyen en küçük bileşende.
 *
 * ⚠️ **Ekran okuyucudan gizli.** Saniyede bir değişen bir metni anons etmek
 * ekran okuyucuyu kullanılamaz hale getirir. Dakika hassasiyetli tek etiket
 * kartın kendisinde (`accessible` sarmalı); 3.3'ün `useCountUp` kararının
 * birebir aynısı.
 */
export default function CountdownLabel({
  target,
  onElapsed,
  compact = false,
}: CountdownLabelProps) {
  const { theme } = useTheme();
  const remaining = useCountdown(target, onElapsed);
  const { hours, minutes, seconds } = splitRemaining(remaining);

  // Bir saatin altında saat hanesi gösterilmiyor: "0 sa 12 dk 30 sn" satırın
  // yarısını sıfıra harcıyor ve okumayı yavaşlatıyor.
  const label =
    hours > 0
      ? formatString(strings.prayer.remaining, { saat: hours, dakika: minutes, saniye: seconds })
      : formatString(strings.prayer.remainingShort, { dakika: minutes, saniye: seconds });

  return (
    <Text
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={[
        compact ? textStyles.labelSmall : textStyles.h2,
        styles.label,
        { color: compact ? theme.textSecondary : theme.textPrimary },
      ]}
    >
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: {
    // Rakamlar değiştikçe satır genişliği oynuyor; sayı tabloda değil kartta
    // olduğu için sola yaslı kalması yeterli.
    fontVariant: ['tabular-nums'],
  },
});
