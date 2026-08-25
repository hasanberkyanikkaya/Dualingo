import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';

import { componentRadius } from '@/constants/radius';
import { layout, spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import { formatString } from '@/lib/formatString';
import { useTheme } from '@/lib/useTheme';

import type { ColorTheme } from '@/constants/colors';
import type { PrayerMarkStatus } from '@/types';

type PrayerStatusControlProps = {
  status: PrayerMarkStatus;
  /** Dokunuşta işaretler veya işareti kaldırır. */
  onPress: () => void;
  disabled?: boolean;
  /** Ekran okuyucuya "hangi gün, hangi vakit" bilgisini veren ön ek. */
  accessibilityLabel: string;
  /** Izgara hücrelerinde ikon küçülür; günlük tabloda tam boy kalır. */
  compact?: boolean;
  /** Günlük ekranda durum adını ikonun yanında görünür kılar. */
  showLabel?: boolean;
};

/** Durumun ekrandaki karşılığı — ad, ikon, renk. */
const STATUS_LABELS: Record<PrayerMarkStatus, string> = {
  kilinmadi: strings.prayer.statusNone,
  kilindi: strings.prayer.statusDone,
};

/**
 * Durum renk dışında ikon biçimi ve erişilebilirlikte checked alanıyla taşınır:
 * boş halka kayıt yok, dolu tik kılındı demektir.
 */
const STATUS_ICONS: Record<PrayerMarkStatus, keyof typeof Ionicons.glyphMap> = {
  kilinmadi: 'ellipse-outline',
  kilindi: 'checkmark-circle',
};

function statusColor(status: PrayerMarkStatus, theme: ColorTheme): string {
  return status === 'kilindi' ? theme.primary : theme.borderControl;
}

/**
 * İki durumlu işaret kontrolü — günlük tablo, haftalık ızgara ve aylık
 * düzenleme panelinin ORTAK kontrolü.
 *
 * Üç yerde aynı bileşen olması mimari kural 3'ün gereği ama asıl sebep şu:
 * kontrol üç yerde ayrı yazılsaydı ölçülmüş renk ve ikon kararları üç kez
 * verilir, biri er geç kayardı ve aynı işaret iki ekranda farklı görünürdü.
 *
 * İki durum olduğu için checkbox rolü ve checked alanı doğru semantiği verir.
 *
 * ⚠️ **Pasif kontrol GRİLEŞTİRİLMİYOR** — `textDisabled` kendi zemini üzerinde
 * 1.97:1 ve pratikte görünmez olurdu (2.1'de kilit ikonunda ölçülmüştü).
 * Basılamaz olduğunu `accessibilityState` söylüyor; boş halka zaten "henüz
 * değil" diyor.
 */
export default function PrayerStatusControl({
  status,
  onPress,
  disabled = false,
  accessibilityLabel,
  compact = false,
  showLabel = false,
}: PrayerStatusControlProps) {
  const { theme } = useTheme();

  const size = compact ? spacing.lg : spacing.xl;

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ disabled, checked: status === 'kilindi' }}
      accessibilityLabel={formatString(strings.a11y.prayerStatusControl, {
        hedef: accessibilityLabel,
        durum: STATUS_LABELS[status],
      })}
      accessibilityHint={disabled ? undefined : strings.a11y.prayerStatusHint}
      disabled={disabled}
      onPress={onPress}
      // ⚠️ Etkin dokunma hedefi `hitSlop` ile 48'e (`layout.minTouchTarget`)
      // çıkıyor — Button'ın aritmetiğinin aynısı. İkonun kendisini büyütmek
      // ızgarayı taşırırdı; hedef görünenden büyük olabilir.
      hitSlop={(layout.minTouchTarget - size) / 2}
      style={[
        styles.control,
        showLabel
          ? {
              minHeight: layout.minTouchTarget,
              paddingHorizontal: spacing.md,
              borderWidth: 1,
              borderColor: status === 'kilindi' ? theme.primary : theme.borderControl,
              borderRadius: componentRadius.button,
              backgroundColor: status === 'kilindi' ? theme.primarySoft : theme.surface,
            }
          : null,
      ]}
    >
      <Ionicons name={STATUS_ICONS[status]} size={size} color={statusColor(status, theme)} />
      {showLabel ? (
        <Text style={[textStyles.labelMedium, { color: theme.textPrimary }]}>
          {status === 'kilindi' ? strings.prayer.statusDone : strings.prayer.markAsDone}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
});
