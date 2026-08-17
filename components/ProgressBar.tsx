import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import type { ColorTheme } from '@/constants/colors';
import { timing } from '@/constants/motion';
import { componentRadius } from '@/constants/radius';
import { spacing } from '@/constants/spacing';
import { strings } from '@/constants/strings';
import { formatString } from '@/lib/formatString';
import { useTheme } from '@/lib/useTheme';

type ProgressBarVariant = 'primary' | 'secondary' | 'success';

/**
 * Çubuğun kalınlığı.
 *
 * Ölçekten geliyor (`spacing.md` = 12), doğrudan sayı değil. Hap köşesiyle
 * birlikte bu kalınlık çubuğu ince bir çizgi değil, dolan bir hazne gibi
 * gösteriyor — çocuk kullanıcıda okunurluğu belirleyen şey bu.
 */
const TRACK_HEIGHT = spacing.md;

/**
 * Varyantın dolgu rengi.
 *
 * ⚠️ Maskotun canlı pembesi (`primaryBright` #FF8FBF) burada KULLANILMAZ,
 * paletin notuna rağmen. Sebep ölçüldü: açık temada yol rengiyle (`border`
 * #F2DFE7) arasında yalnızca **1.81:1** var. WCAG 1.4.11 metin taşımayan
 * arayüz parçaları için 3:1 istiyor ve ilerlemeyi anlatan tek şey dolu/boş
 * sınırı — o sınır seçilemezse çubuk bilgi taşımıyor demektir. Açık temada
 * yolu açarak bu düzelmiyor (bembeyaz yol bile 2.11:1'de kalıyor); ikisinden
 * birinin koyulaşması gerekiyordu, koyulaşan dolgu oldu.
 *
 * Yol her varyantta aynı (`border`) — değişen yalnızca dolgu. Boş kısım her
 * yerde aynı görünürse kullanıcı çubuğun ne kadarının dolduğunu varyanttan
 * bağımsız okuyabiliyor.
 *
 * Açık tema kontrastları: birincil 4.34:1 · ikincil 3.15:1 · başarı 3.95:1.
 * Koyu tema: 7.03:1 · 8.46:1 · 7.31:1. Palet değişirse bu sayılar yeniden
 * hesaplanmalı.
 */
function getFillColor(theme: ColorTheme, variant: ProgressBarVariant): string {
  const table: Record<ProgressBarVariant, string> = {
    // Ders ilerlemesi, ünite doluluğu
    primary: theme.primary,
    // XP ve günlük hedef — ödül rengi
    secondary: theme.secondaryStrong,
    // Tamamlanmış hedef, hatasız ders
    success: theme.success,
  };

  return table[variant];
}

/**
 * `total` içinde `current`in oranı — her zaman 0 ile 1 arasında.
 *
 * Bozuk girdiye karşı sessizce boş çubuk döner: `total` sıfır veya negatifse
 * (henüz yüklenmemiş ders, boş ünite) bölme yapılmaz, `NaN` genişliğe sızmaz.
 */
function toRatio(current: number, total: number): number {
  if (!Number.isFinite(current) || !Number.isFinite(total) || total <= 0) {
    return 0;
  }

  if (current <= 0) {
    return 0;
  }

  return current >= total ? 1 : current / total;
}

type ProgressBarProps = {
  /** Tamamlanan miktar — `total`ı aşarsa çubuk dolu görünür, taşmaz */
  current: number;
  /** Toplam miktar. Sıfır veya negatifse çubuk boş çizilir. */
  total: number;
  /** Renk anlamı — varsayılan birincil (ders ilerlemesi) */
  variant?: ProgressBarVariant;
  /** Ekran okuyucu etiketi — verilmezse "İlerleme: 3 / 10" kullanılır */
  accessibilityLabel?: string;
};

/**
 * Uygulamanın tek ilerleme çubuğu.
 *
 * Değer değiştiğinde dolgu yumuşak akar; ilk çizimde AKMAZ, olması gereken
 * yerde başlar. Ekrana her girişte sıfırdan dolan bir çubuk (profildeki günlük
 * hedef gibi) ilerlemeyi anlatmaz, sadece dikkat dağıtır — akış yalnızca
 * gerçekten bir şey kazanıldığında anlam taşır.
 *
 * Genişliği ebeveyninden alır: sütun düzeninde kendiliğinden yayılır, satır
 * düzenine konacaksa saran tarafın `flex` vermesi gerekir.
 */
export default function ProgressBar({
  current,
  total,
  variant = 'primary',
  accessibilityLabel,
}: ProgressBarProps) {
  const { theme } = useTheme();

  // Sistem ayarını uygulama açılışında okur, değiştiğinde yeniden çizmez.
  const reduceMotion = useReducedMotion();

  const ratio = toRatio(current, total);

  // İlk değer doğrudan oran — `withTiming` ile 0'dan gelmiyor.
  const progress = useSharedValue(ratio);

  useEffect(() => {
    // Hareket azaltma açıkken değer anında yerine oturur. Reanimated'ın
    // `ReduceMotion` seçeneği de tween'i kaldırıyor ama Button'da olduğu gibi
    // kesme kararı JS tarafında tutuluyor — tek yerde, okunur biçimde.
    if (reduceMotion) {
      progress.value = ratio;
      return;
    }

    progress.value = withTiming(ratio, timing.progress);
  }, [ratio, reduceMotion, progress]);

  // Genişlik yüzdeyle veriliyor, `scaleX` ile değil: ölçekleme dolgunun sağ
  // ucundaki hap yuvarlaklığını da yatayda gerdiği için düşük değerlerde uç
  // yamuk görünüyor. Yüzde genişlik köşeyi olduğu gibi bırakır.
  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  // Ekran okuyucuya giden sayılar da kırpılmış olmalı; görünen dolulukla
  // duyulan değer ayrışmasın diye aynı kaynaktan türetiliyor.
  const safeTotal = Number.isFinite(total) && total > 0 ? total : 0;
  const safeCurrent = Math.round(ratio * safeTotal);

  return (
    <View
      accessibilityRole="progressbar"
      // Varsayılan etiket sayıları tekrar eder çünkü genel bir çubuğun
      // söyleyebileceği başka şey yok. Bağlamı olan yerlerde çağıran taraf
      // kendi etiketini geçmeli ("Günlük hedef", "Ders ilerlemesi").
      accessibilityLabel={
        accessibilityLabel ??
        formatString(strings.a11y.progressBar, { current: safeCurrent, total: safeTotal })
      }
      accessibilityValue={{ min: 0, max: safeTotal, now: safeCurrent }}
      style={[styles.track, { backgroundColor: theme.border }]}
    >
      <Animated.View
        style={[styles.fill, { backgroundColor: getFillColor(theme, variant) }, fillStyle]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: TRACK_HEIGHT,
    borderRadius: componentRadius.progressBar,
    // Dolgu kendi hap köşesini taşıyor; kırpma yine de duruyor çünkü
    // yuvarlak köşeli iki dikdörtgenin kenarları Android'de bir piksel
    // kaçabiliyor ve dolgu yolun dışına taşmış gibi görünüyor.
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: componentRadius.progressBar,
  },
});
