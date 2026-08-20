import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import Button from '@/components/Button';
import OptionCard from '@/components/OptionCard';
import ScreenHeader from '@/components/ScreenHeader';
import { layout, spacing } from '@/constants/spacing';
import strings from '@/constants/strings';

import type { Difficulty } from '@/types';

/**
 * Kademe seçenekleri — sırası kolaydan zora.
 *
 * ⚠️ Etiketler `Difficulty` değerlerinin Türkçe karşılığı ve eşleme **düz**;
 * `types/learning.ts` bu hazneyi tam bu iş için tanımlamıştı. Araya bir çeviri
 * katmanı koymak, tespit sonucunun içerikteki `level.difficulty` ile
 * karşılaştırılabilmesini bozardı.
 */
const OPTIONS: readonly { value: Difficulty; label: string; body: string }[] = [
  {
    value: 'beginner',
    label: strings.onboarding.difficultyBeginner,
    body: strings.onboarding.difficultyBeginnerBody,
  },
  {
    value: 'basic',
    label: strings.onboarding.difficultyBasic,
    body: strings.onboarding.difficultyBasicBody,
  },
  {
    value: 'advanced',
    label: strings.onboarding.difficultyAdvanced,
    body: strings.onboarding.difficultyAdvancedBody,
  },
];

type DifficultyStepProps = {
  /** Kademe seçildi, sınav başlasın. */
  onStart: (difficulty: Difficulty) => void;
  /**
   * İkincil eylem.
   *
   * İlk açılışta "En baştan başlamak istiyorum" (sınav yapılmaz, `beginner`
   * yazılır); tekrar akışında **"Vazgeç"** ve hiçbir şey yazılmaz.
   *
   * ⚠️ İkisinin ayrılması şart: tekrar akışında "en baştan başla" butonu, yolun
   * ortasındaki bir kullanıcıyı kendi isteği dışında başa çeker. Üstelik iOS'ta
   * kaydırma jesti kapalı ve bu ekranın başka çıkışı yok — tekrar akışında bu
   * buton **tek kaçış yolu**.
   */
  secondaryLabel: string;
  onSecondary: () => void;
};

/**
 * Kademe seçimi. Seçim sınavın hangi soru havuzundan geleceğini belirliyor **ve**
 * sonucun tavanı oluyor: sınav beyanı doğrular ya da bir kademe düşürür, asla
 * yükseltmez (`resolvePlacementDifficulty`).
 *
 * Seçim yerel durumda tutuluyor, seçer seçmez akışa gitmiyor: üç seçenek yan
 * yana okunmadan verilmiş bir karar, geri alınması onay penceresi isteyen bir
 * karar olurdu.
 */
export default function DifficultyStep({
  onStart,
  secondaryLabel,
  onSecondary,
}: DifficultyStepProps) {
  const [selected, setSelected] = useState<Difficulty | null>(null);

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title={strings.onboarding.levelTestTitle}
          subtitle={strings.onboarding.levelTestSubtitle}
        />

        <View accessibilityRole="radiogroup" style={styles.list}>
          {OPTIONS.map((option) => (
            <OptionCard
              key={option.value}
              label={option.label}
              body={option.body}
              selected={option.value === selected}
              onPress={() => setSelected(option.value)}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <Button
          label={strings.onboarding.levelTestStart}
          onPress={() => selected !== null && onStart(selected)}
          disabled={selected === null}
          size="large"
          fullWidth
        />

        {/* İkincil eylem kaçış kapağı, eşdeğer bir yol değil — bu yüzden ghost. */}
        <Button label={secondaryLabel} onPress={onSecondary} variant="ghost" fullWidth />
      </View>
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
  list: {
    gap: layout.listGap,
  },
  actions: {
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
});
