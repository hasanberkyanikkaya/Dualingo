import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { layout, spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import { PRAYER_LABELS } from '@/features/prayer/components/NextPrayerCard';
import { markedCount, trackableCount } from '@/features/prayer/prayerDay';
import { formatString } from '@/lib/formatString';
import { useTheme } from '@/lib/useTheme';

import type { PrayerRow } from '@/features/prayer/prayerDay';
import type { PrayerName } from '@/types';

type PrayerTimesTableProps = {
  rows: readonly PrayerRow[];
  /** Bir vaktin "kılındı" işaretini tersine çevirir. */
  onToggle: (prayer: PrayerName) => void;
};

/**
 * Günün altı vakti + kılınan namaz işaretleri.
 *
 * ⚠️ **"Sıradaki" ve "geçti" durumları RENKLE taşınmıyor.** `primary` ile
 * `success` arasında 1.10:1, `primary` ile `error` arasında 1.06:1 var (2.1 ve
 * 2.3 ölçümleri); bu palette bir satırı renklendirmek onu ayırt edilebilir
 * yapmıyor. Durumu taşıyan şey **ikonun BİÇİMİ** (dolu ok → sıradaki, dolu
 * daire → geçmiş, boş halka → gelecek) ve etiketin kalınlığı.
 * WCAG 1.4.1'in bu projedeki yedinci uygulaması.
 *
 * ⚠️ **Geçmiş satır `textMuted`e düşüyor, `opacity` ile SOLDURULMUYOR.**
 * Opaklık iki şeyi birden bozardı: kontrast artık hesaplanamaz olurdu (jetonun
 * zeminle oranı ölçülü, yarı saydam hâli değil) ve aynı satırdaki dokunulabilir
 * işaret kutusu da sönerdi. Ölçüldü: `textMuted` açık temada beyaza karşı
 * **5.30:1**, koyu temada `#1A1218`e karşı **5.96:1** — ikisi de AA (4.5:1).
 *
 * ⚠️ **İşaret kutusu SÖNMEZ.** Satır soluk olsa da kutu tam kontrastta kalır:
 * o bir kontroldür, geçmiş bir bilgi değil. Sınırı `borderControl` çiziyor
 * (jetonun tanımı birebir bu: dokunulabilir öğenin sınırı; sayfa zeminine
 * karşı 3.64 açık / 3.46 koyu, 1.4.11'in istediği 3:1 sağlanıyor).
 *
 * ⚠️ **Satırın TAMAMI artık `accessible` bir kutu DEĞİL.** 4.1'de öyleydi;
 * içine bir kontrol girdiği an satırı tek parça yapmak ekran okuyucunun kutuya
 * odaklanmasını engeller. Bunun yerine bilgi kısmı (ikon + ad + saat) tek odak
 * durağı, işaret kutusu ayrı bir odak durağı.
 */
export default function PrayerTimesTable({ rows, onToggle }: PrayerTimesTableProps) {
  const { theme } = useTheme();

  const marked = markedCount(rows);
  const trackable = trackableCount(rows);

  return (
    <View>
      {rows.map((row, index) => {
        const isNext = row.phase === 'next';
        const isPast = row.phase === 'past';

        // ⚠️ Kutu yalnızca GEÇMİŞ bir namaz satırında etkin. Henüz girmemiş bir
        // vakti "kıldım" diye işaretlemek anlamsız; Güneş ise namaz değil ve
        // hiç kutu almıyor (`prayerDay.isTrackable`).
        const canMark = row.trackable && isPast;

        return (
          <View
            key={row.name}
            style={[
              styles.row,
              index > 0 ? { borderTopWidth: StyleSheet.hairlineWidth } : null,
              { borderTopColor: theme.border },
            ]}
          >
            <View
              accessible
              accessibilityLabel={`${PRAYER_LABELS[row.name]}, ${row.time}`}
              style={styles.info}
            >
              <Ionicons
                name={isNext ? 'arrow-forward-circle' : isPast ? 'ellipse' : 'ellipse-outline'}
                size={spacing.xl}
                color={isNext ? theme.primary : theme.textMuted}
              />

              <Text
                style={[
                  isNext ? textStyles.bodyStrong : textStyles.bodyMedium,
                  styles.name,
                  { color: isPast ? theme.textMuted : theme.textPrimary },
                ]}
              >
                {PRAYER_LABELS[row.name]}
              </Text>

              <Text
                style={[
                  isNext ? textStyles.bodyStrong : textStyles.bodyMedium,
                  styles.time,
                  { color: isPast ? theme.textMuted : theme.textPrimary },
                ]}
              >
                {row.time}
              </Text>
            </View>

            {row.trackable ? (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: row.marked, disabled: !canMark }}
                accessibilityLabel={formatString(strings.a11y.prayerMarkToggle, {
                  vakit: PRAYER_LABELS[row.name],
                })}
                disabled={!canMark}
                onPress={() => onToggle(row.name)}
                // Kutu ikonu 24; `hitSlop` ile etkin dokunma hedefi 48'e
                // çıkıyor (`layout.minTouchTarget`, Button'ın aritmetiği).
                hitSlop={(layout.minTouchTarget - spacing.xl) / 2}
              >
                <Ionicons
                  name={row.marked ? 'checkbox' : 'square-outline'}
                  size={spacing.xl}
                  // ⚠️ Pasif kutu GRİLEŞTİRİLMİYOR: `textDisabled` kendi zemini
                  // üzerinde 1.97:1 ve pratikte görünmez olurdu (2.1'de kilit
                  // ikonunda ölçülmüştü). Basılamaz olduğunu `accessibilityState`
                  // söylüyor; görsel olarak boş kutu zaten "henüz değil" diyor.
                  color={row.marked ? theme.primary : theme.borderControl}
                />
              </Pressable>
            ) : (
              // Güneş satırında kutu yok ama yeri korunuyor — yoksa saat sütunu
              // tek satırda sağa kayar ve tablo hizasını kaybeder.
              <View style={styles.checkboxSpacer} />
            )}
          </View>
        );
      })}

      {/*
        ⚠️ Özet yalnızca en az bir işaret varken görünüyor. Sıfırdayken
        "0 / 5" yazmak, hiçbir şey söylemediği hâlde bir eksiklik bildirimi gibi
        okunur; ekran sayar, hüküm vermez.
      */}
      {marked > 0 ? (
        <Text style={[textStyles.labelMedium, styles.summary, { color: theme.textSecondary }]}>
          {formatString(strings.prayer.markedSummary, { kilinan: marked, toplam: trackable })}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  info: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  name: {
    flex: 1,
  },
  time: {
    fontVariant: ['tabular-nums'],
  },
  checkboxSpacer: {
    width: spacing.xl,
  },
  summary: {
    marginTop: spacing.md,
    textAlign: 'right',
  },
});
