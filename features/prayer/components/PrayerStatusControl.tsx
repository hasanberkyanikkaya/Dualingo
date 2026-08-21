import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { layout, spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { formatString } from '@/lib/formatString';
import { useTheme } from '@/lib/useTheme';

import type { ColorTheme } from '@/constants/colors';
import type { PrayerMarkStatus } from '@/types';

type PrayerStatusControlProps = {
  status: PrayerMarkStatus;
  /** Dokunuşta bir sonraki duruma geçirir — döngü `prayerChart.nextStatus`ta. */
  onPress: () => void;
  disabled?: boolean;
  /** Ekran okuyucuya "hangi gün, hangi vakit" bilgisini veren ön ek. */
  accessibilityLabel: string;
  /** Izgara hücrelerinde ikon küçülür; günlük tabloda tam boy kalır. */
  compact?: boolean;
};

/** Durumun ekrandaki karşılığı — ad, ikon, renk. */
const STATUS_LABELS: Record<PrayerMarkStatus, string> = {
  kilinmadi: strings.prayer.statusNone,
  kilindi: strings.prayer.statusDone,
  kaza: strings.prayer.statusKaza,
};

/**
 * ⚠️ **Durum RENKLE taşınmıyor, ikonun BİÇİMİYLE taşınıyor.** Bu palette
 * `primary` ile `success` arasında 1.10:1, `primary` ile `error` arasında
 * 1.06:1 var (2.1 ve 2.3 ölçümleri); üç durumu üç renge bağlamak onları ayırt
 * edilebilir yapmazdı. Boş halka → dolu tik → dönen ok: üçü siyah beyaz bir
 * ekranda bile ayrı. WCAG 1.4.1'in bu projedeki **sekizinci** uygulaması.
 */
const STATUS_ICONS: Record<PrayerMarkStatus, keyof typeof Ionicons.glyphMap> = {
  kilinmadi: 'ellipse-outline',
  kilindi: 'checkmark-circle',
  kaza: 'refresh-circle',
};

function statusColor(status: PrayerMarkStatus, theme: ColorTheme): string {
  if (status === 'kilindi') {
    return theme.primary;
  }
  // `secondaryStrong` grafik dolgusu için ölçülmüş jeton (1.2b): açık temada
  // `sun600`, koyu temada `sun400`. Ham `secondary` açık temada zemine karşı
  // 1.35:1 ve görünmezdi.
  return status === 'kaza' ? theme.secondaryStrong : theme.borderControl;
}

/**
 * Üç durumlu işaret kontrolü — günlük tablo, haftalık ızgara ve aylık
 * düzenleme panelinin ORTAK kontrolü.
 *
 * Üç yerde aynı bileşen olması mimari kural 3'ün gereği ama asıl sebep şu:
 * kontrol üç yerde ayrı yazılsaydı ölçülmüş renk ve ikon kararları üç kez
 * verilir, biri er geç kayardı ve aynı işaret iki ekranda farklı görünürdü.
 *
 * ⚠️ **`accessibilityRole="checkbox"` DEĞİL, `"button"`.** Onay kutusunun iki
 * durumu vardır; ekran okuyucu "işaretli/işaretsiz" diye anons eder ve üçüncü
 * durumu (kaza) hiç söyleyemezdi. Rol `button` + etikete durum ADININ
 * yazılması, üç durumu da sözle duyuran tek yol. (4.2'de kutu iki durumluydu
 * ve `checkbox` doğruydu.)
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
}: PrayerStatusControlProps) {
  const { theme } = useTheme();

  const size = compact ? spacing.lg : spacing.xl;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
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
      style={styles.control}
    >
      <Ionicons name={STATUS_ICONS[status]} size={size} color={statusColor(status, theme)} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  control: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
