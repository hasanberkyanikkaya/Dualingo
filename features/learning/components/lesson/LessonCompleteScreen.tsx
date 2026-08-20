import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import Button from '@/components/Button';
import { sequence } from '@/constants/motion';
import { layout, spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import LevelStars from '@/features/learning/components/map/LevelStars';
import type { LessonSummary } from '@/features/learning/lessonSession';
import { useProgressStore } from '@/features/progress/store';
import { formatString } from '@/lib/formatString';
import { useCountUp } from '@/lib/useCountUp';
import { useTheme } from '@/lib/useTheme';

import BadgeEarnedSection from './BadgeEarnedSection';
import CelebrationMascot from './CelebrationMascot';
import MistakeList from './MistakeList';

import type { Question } from '@/types';

const STAR_SIZE = spacing.xxxl; // 48
const XP_ICON_SIZE = spacing.xl; // 24

type LessonCompleteScreenProps = {
  summary: LessonSummary;
  questions: Question[];
  onDone: () => void;
  /**
   * Sonraki derse geçiş. Yolun sonundaysa `null` — o zaman tek buton çizilir.
   * Hedefi bulmak rotanın işi; ekran yalnızca "gidilecek bir yer var mı" bilir.
   */
  onNext: (() => void) | null;
};

/**
 * Ders sonu: bu denemenin yıldızı, XP, doğruluk ve hata özeti.
 *
 * ⚠️ **Yalnızca BU deneme gösteriliyor** (kullanıcı kararı). Haritadaki yıldız
 * en iyi dereceyi gösterecek — `LevelProgress` "en iyi denemede kazanılan
 * yıldız" diyor ve o `Math.max` Faz 2.4'ün işi. Burada geçmiş bir koşunun
 * derecesini göstermek, az önce olan biteni yanlış anlatmak olurdu.
 *
 * Butonlar kaydırma alanının DIŞINDA sabit: uzun bir hata listesinde çıkış yolu
 * ekranın altında kaybolmamalı. (Soru kabuğunun aynı disiplini.)
 */
export default function LessonCompleteScreen({
  summary,
  questions,
  onDone,
  onNext,
}: LessonCompleteScreenProps) {
  const { theme } = useTheme();
  const drainPendingBadges = useProgressStore((state) => state.drainPendingBadges);

  /**
   * Ekrandan çıkan HER yol buradan geçer.
   *
   * ⚠️ **Rozet kuyruğu iki çıkışta da boşaltılmalı.** "Sonraki ders" bunu
   * atlarsa kuyruk dolu kalır ve **aynı rozet bir sonraki dersin sonunda ikinci
   * kez kutlanır** — üstelik o ders onu kazandırmamışken. Tek bir yardımcıya
   * bağlanmasının sebebi bu; üçüncü bir çıkış eklenirse de aynı kapıdan geçer.
   *
   * ⚠️ Kuyruk İŞLEYİCİDE boşaltılıyor, `useEffect`te DEĞİL: `reactCompiler` +
   * StrictMode etkileri iki kez çalıştırıyor ve kutlama daha okunmadan
   * kaybolurdu. (2.3'ün "tamamlanma sinyali işleyiciden gider" kararının aynısı.)
   */
  function leave(go: () => void) {
    drainPendingBadges();
    go();
  }

  const accuracyPercent =
    summary.total > 0 ? Math.round((summary.correct * 100) / summary.total) : 0;
  const hasMistakes = summary.mistakes.length > 0;

  /**
   * Kutlama yalnızca kazanılmış bir an için oynar: ilk tamamlama ya da önceki
   * en iyi dereceyi geçen bir tekrar. Sıradan bir tekrarda ekran son hâlinde,
   * hareketsiz açılır — üçüncü kez aynı dersi çalışan kullanıcıyı her seferinde
   * aynı sahneyle bekletmek kutlamayı ödül olmaktan çıkarıp gecikmeye çevirir.
   */
  const celebrate = summary.isFirstCompletion || summary.isNewRecord;

  const xpShown = useCountUp(summary.xpEarned, {
    duration: sequence.xpDuration,
    // Yıldızlar yerleşirken sayaç beklemede durur; ikisi aynı anda oynarsa göz
    // hangisine bakacağını bilemiyor.
    delay: sequence.xpStart,
    enabled: celebrate,
  });

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summary}>
          <CelebrationMascot animate={celebrate} />

          <Text style={[textStyles.h2, { color: theme.textPrimary }]}>
            {strings.result.title}
          </Text>

          {/* Yıldızlar dekoratif olarak gizli; sayıyı sarmalayıcı okuyor. */}
          <View
            accessible
            accessibilityLabel={formatString(strings.a11y.levelStars, {
              total: 3,
              earned: summary.stars,
            })}
          >
            <LevelStars earned={summary.stars} size={STAR_SIZE} animateIn={celebrate} />
          </View>

          {/*
            ⚠️ Etiket SAYAN değil SON değerden kuruluyor. Sarmalayıcı olmasaydı
            ekran okuyucu değişen metni takip eder ve tek bir "+40 XP" yerine
            onlarca ara değeri arka arkaya anons ederdi. ProgressBar'ın "anonsa
            giden sayı görünenle aynı kaynaktan" kuralının bilinçli tersi:
            orada sayı duruyordu, burada sayıyor.
          */}
          <View
            accessible
            accessibilityLabel={formatString(strings.result.xpEarned, { xp: summary.xpEarned })}
            style={styles.xpRow}
          >
            {/* Renk grafikte, kontrast metinde: `secondaryStrong` beyaz üzerinde
                3.69 — grafik için yeterli, normal metin için değil. */}
            <Ionicons name="flash" size={XP_ICON_SIZE} color={theme.secondaryStrong} />
            <Text style={[textStyles.h3, { color: theme.textPrimary }]}>
              {formatString(strings.result.xpEarned, { xp: xpShown })}
            </Text>
          </View>

          <Text style={[textStyles.bodyMedium, { color: theme.textSecondary }]}>
            {formatString(strings.result.accuracy, { percent: accuracyPercent })}
          </Text>
        </View>

        {/* Rozet bölümü özet ile hata listesi arasında: kutlama önce, ders
            değerlendirmesi sonra. */}
        <BadgeEarnedSection />

        {hasMistakes ? (
          <MistakeList mistakes={summary.mistakes} questions={questions} />
        ) : (
          <View style={styles.perfect}>
            <Text style={[textStyles.bodyStrong, { color: theme.success }]}>
              {strings.result.perfectTitle}
            </Text>
            <Text style={[textStyles.bodyMedium, { color: theme.textSecondary }]}>
              {strings.result.perfectSubtitle}
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {onNext !== null ? (
          <Button
            label={strings.result.nextLesson}
            onPress={() => leave(onNext)}
            size="large"
            fullWidth
          />
        ) : null}

        {/*
          Yolun sonunda "Yola dön" tek başına kalıyor ve ghost varyantı dolgusuz.
          Sorun değil: ekranda başka buton yokken tek eylem zaten belirgin, ve
          onu birincil yapmak yol boyunca butonun görünümünü değiştirirdi.
        */}
        <Button
          label={strings.result.backToPath}
          onPress={() => leave(onDone)}
          variant="ghost"
          size="large"
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    gap: layout.sectionGap,
    paddingBottom: spacing.xl,
  },
  summary: {
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.xl,
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  perfect: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  footer: {
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
});
