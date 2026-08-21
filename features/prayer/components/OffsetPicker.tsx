import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { componentRadius } from '@/constants/radius';
import { spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import { NOTIFICATION_OFFSETS } from '@/features/prayer/prayerNotify';
import { formatString } from '@/lib/formatString';
import { useTheme } from '@/lib/useTheme';

import type { PrayerNotificationOffset } from '@/types';

/** Kenarlık kalınlığı `OptionCard` ile aynı ve aynı gerekçeyle 2px. */
const BORDER_WIDTH = 2;

type OffsetPickerProps = {
  value: PrayerNotificationOffset;
  onChange: (offset: PrayerNotificationOffset) => void;
  /** Ekran okuyucuya "hangi vaktin gecikmesi" bilgisini veren ön ek. */
  prayerLabel: string;
};

/** `0` "vakit başında" der; gerisi "{dakika} dk sonra". */
export function offsetLabel(offset: PrayerNotificationOffset): string {
  return offset === 0
    ? strings.prayer.offsetAtStart
    : formatString(strings.prayer.offsetLater, { dakika: offset });
}

/**
 * Gecikme seçici — beş hazır seçenek, sarmalı satır.
 *
 * ⚠️ **Seçili durum RENKLE değil, İKONLA taşınıyor** (boş halka → dolu tik).
 * `primary` ile `borderControl` arasında yalnızca 1.40:1 var (2.2a ölçümü) ve
 * fark neredeyse tamamen hüe; renge bakarak hangi seçeneğin seçili olduğu
 * ayırt edilemezdi. WCAG 1.4.1'in bu projedeki **dokuzuncu** uygulaması.
 *
 * ⚠️ **Seçili kutuya `borderControl` ÇİZİLMEZ.** Dolgusu `primarySoft` ve 2.3'te
 * ölçüldü: kontrol kenarlığı renkli yumuşak dolgu üzerinde 3.19 açık / **2.39
 * koyu** — 3:1'in altı. Seçilmemiş kutunun komşusu sayfa zemini olduğu için
 * orada aynı jeton 3.64/3.46 veriyor ve sorunsuz.
 *
 * ⚠️ Kenarlık kalınlığı iki durumda da **2px**: 1→2 değişimi etiketi kaydırıp
 * satırı titretirdi (2.2a `OptionCard` kararı).
 *
 * ⚠️ **`accessibilityRole="radio"` DEĞİL, `"button"` + `selected`.** Radyo rolü
 * bir `radiogroup` kabı ve konum anonsu bekliyor; sarmalı bir satırda konum
 * bilgisi yanıltıcı olurdu. `PrayerStatusControl`ün "rol yerine etiket" kararı.
 */
export default function OffsetPicker({ value, onChange, prayerLabel }: OffsetPickerProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.row}>
      {NOTIFICATION_OFFSETS.map((offset) => {
        const selected = offset === value;
        const label = offsetLabel(offset);

        return (
          <Pressable
            key={offset}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={formatString(strings.a11y.prayerOffsetOption, {
              vakit: prayerLabel,
              secenek: label,
            })}
            hitSlop={spacing.xs}
            onPress={() => onChange(offset)}
            style={[
              styles.option,
              selected
                ? { backgroundColor: theme.primarySoft, borderColor: theme.primarySoft }
                : { borderColor: theme.borderControl },
            ]}
          >
            <Ionicons
              name={selected ? 'checkmark-circle' : 'ellipse-outline'}
              size={spacing.lg}
              color={selected ? theme.primary : theme.borderControl}
            />
            <Text style={[textStyles.labelMedium, { color: theme.textPrimary }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: BORDER_WIDTH,
    borderRadius: componentRadius.chip,
  },
});
