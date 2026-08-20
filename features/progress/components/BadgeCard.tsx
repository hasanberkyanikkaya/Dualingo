import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import { formatString } from '@/lib/formatString';
import { useTheme } from '@/lib/useTheme';

type IoniconName = keyof typeof Ionicons.glyphMap;

/** Rozet dairesinin çapı ve içindeki ikonun boyutu. */
const CIRCLE_SIZE = spacing.xxxl + spacing.md; // 60
const ICON_SIZE = spacing.xxl; // 32

/** Kart genişliği — üç sütun sığsın ama uzun ad iki satıra sarabilsin. */
const CARD_WIDTH = 96;

/** Kilitli halkanın kalınlığı. */
const RING_WIDTH = 2;

/** Katalogda ikon yoksa ya da ad tanınmıyorsa düşülen varsayılan. */
const FALLBACK_ICON: IoniconName = 'ribbon';

/** İkon adı Ionicons'ta gerçekten var mı — içerik OTA ile geliyor, güvenilmez. */
function resolveIcon(name: string | undefined): IoniconName {
  return name !== undefined && name in Ionicons.glyphMap ? (name as IoniconName) : FALLBACK_ICON;
}

type BadgeCardProps = {
  name: string;
  earned: boolean;
  icon?: string;
};

/**
 * Tek bir rozet — daire + altında ad.
 *
 * ⚠️ **Durumu RENK taşımıyor, ikonun BİÇİMİ taşıyor** (WCAG 1.4.1): kazanılmış
 * rozet kendi ikonunu, kilitli rozet asma kilidi gösteriyor. `LevelNode`daki
 * kararın aynısı ve aynı sebeple — bu palette `primary` ile `success` arasında
 * 1.10:1 var, durum bilgisi renkten okunamaz.
 *
 * Ölçümler yeniden yapılmadı, `LevelNode`dan devralındı:
 * - Kazanılmış: `primarySoft` dolgu + `primary` ikon → **4.17:1**.
 * - Kilitli: `borderStrong` halka + **`textMuted`** kilit. `disabledText` kendi
 *   zemininde 1.97:1 ve asma kilit görünmüyor.
 *
 * ⚠️ **`borderControl` KULLANILMIYOR**: o jetonun tanımı "dokunulabilir bir
 * öğenin sınırı" ve rozet kartı dokunulabilir değil. Kart bu yüzden bir kutu
 * değil; sınırı çizen tek şey dairenin kendisi.
 */
export default function BadgeCard({ name, earned, icon }: BadgeCardProps) {
  const { theme } = useTheme();

  const circleStyle = earned
    ? { backgroundColor: theme.primarySoft, borderColor: theme.primarySoft }
    : { backgroundColor: theme.background, borderColor: theme.borderStrong };

  return (
    <View
      accessible
      accessibilityLabel={formatString(
        earned ? strings.a11y.badgeEarned : strings.a11y.badgeLocked,
        { name },
      )}
      style={styles.root}
    >
      <View style={[styles.circle, circleStyle]}>
        <Ionicons
          name={earned ? resolveIcon(icon) : 'lock-closed'}
          size={ICON_SIZE}
          color={earned ? theme.primary : theme.textMuted}
        />
      </View>

      {/* Kilitli rozetin adı `textSecondary`; `textMuted` kilit ikonuna ait ve
          iki öğe aynı tonda olursa ad ikonun uzantısı gibi okunuyor. */}
      <Text
        numberOfLines={2}
        style={[textStyles.labelMedium, { color: earned ? theme.textPrimary : theme.textSecondary }]}
      >
        {name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: CARD_WIDTH,
    alignItems: 'center',
    gap: spacing.xs,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: RING_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
