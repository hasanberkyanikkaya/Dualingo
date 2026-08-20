import { StyleSheet, Text, View } from 'react-native';

import { componentRadius } from '@/constants/radius';
import { layout, spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import CountdownLabel from '@/features/prayer/components/CountdownLabel';
import { splitRemaining } from '@/features/prayer/useCountdown';
import { formatString } from '@/lib/formatString';
import { useTheme } from '@/lib/useTheme';

import type { NextPrayer, PrayerName } from '@/types';

/** Vakit adı → görünen etiket. Yapısal etiket, dini içerik değil. */
export const PRAYER_LABELS: Record<PrayerName, string> = {
  imsak: strings.prayer.imsak,
  gunes: strings.prayer.gunes,
  ogle: strings.prayer.ogle,
  ikindi: strings.prayer.ikindi,
  aksam: strings.prayer.aksam,
  yatsi: strings.prayer.yatsi,
};

type NextPrayerCardProps = {
  next: NextPrayer;
  onElapsed: () => void;
};

/**
 * Sıradaki vakit + geri sayım.
 *
 * ⚠️ **Kartın kenarlığı YOK.** Dolgu `primarySoft` ve 2.3'te ölçülmüştü:
 * `borderControl` renkli yumuşak dolgu üzerine çizilmez (3.19 açık / **2.39
 * koyu**, 3:1'in altı). Kartı zeminden ayıran şey dolgunun kendisi.
 *
 * ⚠️ **İkincil satır `textSecondary`, `textMuted` DEĞİL** — 2.3'ün kuralı:
 * renkli yumuşak dolgu üzerine `textMuted` gelmez (koyu temada 4.16, AA altı).
 *
 * ⚠️ Erişilebilirlik etiketi **dakika** hassasiyetinde ve tek parça: saniye
 * anons edilseydi ekran okuyucu her saniye yeniden konuşurdu.
 */
export default function NextPrayerCard({ next, onElapsed }: NextPrayerCardProps) {
  const { theme } = useTheme();

  const name = PRAYER_LABELS[next.name];

  // Etiket monte anındaki kalan süreden kuruluyor ve saniyede bir
  // TAZELENMİYOR — kasıtlı. Ekran okuyucu kullanıcısı için "yaklaşık ne kadar
  // kaldı" bilgisi yeterli; kesin an zaten vakit saatinde yazılı.
  const { hours, minutes } = splitRemaining(next.at - Date.now());
  const a11yLabel =
    hours > 0
      ? formatString(strings.a11y.prayerRemaining, { vakit: name, saat: hours, dakika: minutes })
      : formatString(strings.a11y.prayerRemainingSoon, { vakit: name, dakika: minutes });

  return (
    <View
      accessible
      accessibilityLabel={`${formatString(strings.a11y.prayerNext, {
        vakit: name,
        saat: next.time,
      })}. ${a11yLabel}`}
      style={[styles.card, { backgroundColor: theme.primarySoft }]}
    >
      <Text style={[textStyles.labelMedium, { color: theme.textSecondary }]}>
        {strings.prayer.nextPrayerLabel}
      </Text>

      <View style={styles.headline}>
        <Text style={[textStyles.h2, { color: theme.textPrimary }]}>{name}</Text>
        <Text style={[textStyles.h2, { color: theme.textPrimary }]}>{next.time}</Text>
      </View>

      <CountdownLabel target={next.at} onElapsed={onElapsed} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: layout.cardPadding,
    borderRadius: componentRadius.card,
    gap: spacing.xs,
  },
  headline: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
});
