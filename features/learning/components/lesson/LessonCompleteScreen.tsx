import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import Button from '@/components/Button';
import { layout, spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import LevelStars from '@/features/learning/components/map/LevelStars';
import type { LessonSummary } from '@/features/learning/lessonSession';
import { formatString } from '@/lib/formatString';
import { useTheme } from '@/lib/useTheme';

import MistakeList from './MistakeList';

import type { Question } from '@/types';

const STAR_SIZE = spacing.xxxl; // 48
const XP_ICON_SIZE = spacing.xl; // 24

type LessonCompleteScreenProps = {
  summary: LessonSummary;
  questions: Question[];
  onDone: () => void;
};

/**
 * Ders sonu: bu denemenin yıldızı, XP, doğruluk ve hata özeti.
 *
 * ⚠️ **Yalnızca BU deneme gösteriliyor** (kullanıcı kararı). Haritadaki yıldız
 * en iyi dereceyi gösterecek — `LevelProgress` "en iyi denemede kazanılan
 * yıldız" diyor ve o `Math.max` Faz 2.4'ün işi. Burada geçmiş bir koşunun
 * derecesini göstermek, az önce olan biteni yanlış anlatmak olurdu.
 *
 * "Yola dön" butonu kaydırma alanının DIŞINDA sabit: uzun bir hata listesinde
 * çıkış yolu ekranın altında kaybolmamalı. (Soru kabuğunun aynı disiplini.)
 */
export default function LessonCompleteScreen({
  summary,
  questions,
  onDone,
}: LessonCompleteScreenProps) {
  const { theme } = useTheme();

  const accuracyPercent =
    summary.total > 0 ? Math.round((summary.correct * 100) / summary.total) : 0;
  const hasMistakes = summary.mistakes.length > 0;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summary}>
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
            <LevelStars earned={summary.stars} size={STAR_SIZE} />
          </View>

          <View style={styles.xpRow}>
            {/* Renk grafikte, kontrast metinde: `secondaryStrong` beyaz üzerinde
                3.69 — grafik için yeterli, normal metin için değil. */}
            <Ionicons name="flash" size={XP_ICON_SIZE} color={theme.secondaryStrong} />
            <Text style={[textStyles.h3, { color: theme.textPrimary }]}>
              {formatString(strings.result.xpEarned, { xp: summary.xpEarned })}
            </Text>
          </View>

          <Text style={[textStyles.bodyMedium, { color: theme.textSecondary }]}>
            {formatString(strings.result.accuracy, { percent: accuracyPercent })}
          </Text>
        </View>

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
        <Button label={strings.result.backToPath} onPress={onDone} size="large" fullWidth />
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
  },
});
