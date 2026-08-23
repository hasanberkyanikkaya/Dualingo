import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { quranTheme } from '@/constants/quranTheme';
import { componentRadius } from '@/constants/radius';
import { layout, spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import { formatString } from '@/lib/formatString';

import type { QuranJuzProgress } from '@/types';

type JuzProgressGridProps = {
  items: readonly QuranJuzProgress[];
};

export default function JuzProgressGrid({ items }: JuzProgressGridProps) {
  return (
    <View style={styles.section}>
      <View style={styles.copy}>
        <Text style={[textStyles.h4, { color: quranTheme.text }]}>
          {strings.quran.goalJuzGridTitle}
        </Text>
        <Text style={[textStyles.bodySmall, { color: quranTheme.textMuted }]}>
          {strings.quran.goalJuzGridBody}
        </Text>
      </View>

      <View style={styles.grid}>
        {items.map((item) => {
          const percent = Math.round(item.ratio * 100);
          const complete = item.ratio >= 1;
          const started = item.ratio > 0;
          const icon = complete ? 'checkmark-circle' : started ? 'pie-chart' : 'ellipse-outline';

          return (
            <View
              key={item.juzNumber}
              accessible
              accessibilityLabel={formatString(strings.a11y.quranJuzProgress, {
                juz: item.juzNumber,
                percent,
              })}
              style={[
                styles.cell,
                {
                  backgroundColor: complete ? quranTheme.accentSoft : quranTheme.glass,
                  borderColor: complete ? quranTheme.accent : quranTheme.glassBorder,
                },
              ]}
            >
              <Text style={[textStyles.labelMedium, { color: quranTheme.text }]}>
                {item.juzNumber}
              </Text>
              <Ionicons
                name={icon}
                size={spacing.lg}
                color={complete ? quranTheme.accent : quranTheme.textMuted}
              />
              {started && !complete ? (
                <Text style={[textStyles.caption, { color: quranTheme.textMuted }]}>{percent}%</Text>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.lg },
  copy: { gap: spacing.xs },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.sm,
  },
  cell: {
    width: '18%',
    minHeight: layout.minTouchTarget + spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderRadius: componentRadius.card,
  },
});
