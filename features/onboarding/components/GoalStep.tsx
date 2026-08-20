import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import Button from '@/components/Button';
import OptionCard from '@/components/OptionCard';
import ScreenHeader from '@/components/ScreenHeader';
import { layout, spacing } from '@/constants/spacing';
import strings from '@/constants/strings';

import type { DailyGoal } from '@/types';

/**
 * ⚠️ Dakika değerleri **etiketin içinde**, `DailyGoal` değerinin yanında değil.
 * Diske yazılan şey kullanıcının niyeti (`casual`/`regular`/`serious`); o
 * niyetin kaç dakikaya karşılık geldiği Faz 3'te hedef takibi gelince
 * değişebilir ve o gün eski kayıtların anlamı bozulmamalı.
 */
const OPTIONS: readonly { value: DailyGoal; label: string }[] = [
  { value: 'casual', label: strings.onboarding.goalCasual },
  { value: 'regular', label: strings.onboarding.goalRegular },
  { value: 'serious', label: strings.onboarding.goalSerious },
];

type GoalStepProps = {
  /** Seçim yapılmadan geçildiyse `null` gelir. */
  onDone: (goal: DailyGoal | null) => void;
};

/**
 * Günlük hedef — akışın son adımı.
 *
 * ⚠️ Hedef **atlanabilir olmalı** ve öyle: "Devam et" seçim yapılmadan da
 * basılabiliyor, o zaman `dailyGoal` `null` kalıyor. Zorunlu kılmak, henüz
 * hiçbir yerde kullanılmayan bir tercihi (hedef takibi Faz 3) uygulamaya
 * girişin önünde engel yapardı.
 */
export default function GoalStep({ onDone }: GoalStepProps) {
  const [selected, setSelected] = useState<DailyGoal | null>(null);

  return (
    <View style={styles.root}>
      <View style={styles.body}>
        <ScreenHeader
          title={strings.onboarding.goalTitle}
          subtitle={strings.onboarding.goalSubtitle}
        />

        <View accessibilityRole="radiogroup" style={styles.list}>
          {OPTIONS.map((option) => (
            <OptionCard
              key={option.value}
              label={option.label}
              selected={option.value === selected}
              onPress={() => setSelected(option.value)}
            />
          ))}
        </View>
      </View>

      <Button
        // Etiket seçime göre değişiyor: seçim yokken buton "Devam et" derse
        // kullanıcı bir şey kaydettiğini sanır.
        label={selected === null ? strings.common.skip : strings.common.continue}
        onPress={() => onDone(selected)}
        size="large"
        fullWidth
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'space-between',
    gap: spacing.xl,
  },
  body: {
    gap: layout.sectionGap,
  },
  list: {
    gap: layout.listGap,
  },
});
