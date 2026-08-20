import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import Button from '@/components/Button';
import ScreenHeader from '@/components/ScreenHeader';
import { componentRadius } from '@/constants/radius';
import { layout, spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import { formatString } from '@/lib/formatString';
import { useTheme } from '@/lib/useTheme';

import type { Difficulty } from '@/types';

const BADGE_ICON_SIZE = spacing.xxl; // 32

/** Kademe → Türkçe etiket. `DifficultyStep`teki listenin okuma yönü. */
const TIER_LABEL: Record<Difficulty, string> = {
  beginner: strings.onboarding.difficultyBeginner,
  basic: strings.onboarding.difficultyBasic,
  advanced: strings.onboarding.difficultyAdvanced,
};

type PlacementResultStepProps = {
  /** Sınavın belirlediği kademe. */
  difficulty: Difficulty;
  /** Kullanıcının beyanı — düşürülüp düşürülmediğini bu ikili söylüyor. */
  declared: Difficulty;
  correct: number;
  total: number;
  /** Başlanacak ünitenin adı. Bulunamazsa `null`. */
  unitTitle: string | null;
  onContinue: () => void;
};

/**
 * Sınav sonucu.
 *
 * ⚠️ Bu ekran `LessonCompleteScreen`'in kopyası DEĞİL ve olmamalı: ders
 * tamamlama ekranı yıldız, XP ve hata listesi gösteriyor — sınavın üçü de yok
 * (`setPlacement` XP vermiyor, seri işlemiyor). Ortak olan tek şey "bir koşu
 * bitti" hissi, o da paylaşılan `Button` ve `ScreenHeader` ile geliyor.
 *
 * ⚠️ **Yanlış cevaplar tek tek gösterilmiyor.** Sınav bir ders değil, ölçüm;
 * hangi soruyu bilmediğini göstermek burada öğretmiyor, yalnızca kademeyi
 * hak etmediği hissini veriyor.
 */
export default function PlacementResultStep({
  difficulty,
  declared,
  correct,
  total,
  unitTitle,
  onContinue,
}: PlacementResultStepProps) {
  const { theme } = useTheme();

  const lowered = difficulty !== declared;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title={strings.onboarding.levelTestResultTitle}
          subtitle={
            unitTitle === null
              ? undefined
              : formatString(strings.onboarding.levelTestResultSubtitle, { unit: unitTitle })
          }
        />

        {/*
          Rozet kartı. Sınırı `borderControl` DEĞİL `border` çiziyor: kart
          dokunulabilir bir kontrol değil, pasif bir yüzey — `borderControl`
          "buraya basılır" diyor (2.2a'da bu şekilde tanımlandı).
        */}
        <View style={[styles.card, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          <Ionicons
            // Süs; bilgiyi altındaki iki satır taşıyor.
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            name="ribbon"
            size={BADGE_ICON_SIZE}
            color={theme.secondaryStrong}
          />

          <Text style={[textStyles.h3, { color: theme.textPrimary }]}>
            {formatString(strings.onboarding.levelTestTierLabel, {
              tier: TIER_LABEL[difficulty],
            })}
          </Text>

          <Text style={[textStyles.bodyMedium, { color: theme.textSecondary }]}>
            {formatString(strings.onboarding.levelTestScore, { correct, total })}
          </Text>
        </View>

        <Text style={[textStyles.bodyMedium, { color: theme.textSecondary }]}>
          {lowered ? strings.onboarding.levelTestLowered : strings.onboarding.levelTestConfirmed}
        </Text>
      </ScrollView>

      <Button
        label={strings.onboarding.levelTestResultStart}
        onPress={onContinue}
        size="large"
        fullWidth
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    gap: layout.sectionGap,
    paddingBottom: spacing.lg,
  },
  card: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: layout.cardPadding,
    borderRadius: componentRadius.card,
    borderWidth: 1,
  },
});
