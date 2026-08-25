import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { quranTheme } from '@/constants/quranTheme';
import { componentRadius } from '@/constants/radius';
import { spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import QuranArabicFlow from '@/features/quran/components/QuranArabicFlow';
import QuranTranslationList from '@/features/quran/components/QuranTranslationList';

import type { QuranReaderFontSize, QuranSurahContent } from '@/types';

type QuranSurahReadingProps = {
  content: QuranSurahContent;
  fontSize: QuranReaderFontSize;
  showTranslation: boolean;
};

export default function QuranSurahReading({
  content,
  fontSize,
  showTranslation,
}: QuranSurahReadingProps) {
  return (
    <View style={styles.paper}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={[textStyles.h3, { color: quranTheme.ink }]}>
          {content.surah.nameTurkish}
        </Text>
        <Text style={[textStyles.caption, { color: quranTheme.footnoteInk }]}>
          {strings.quran.surahReadingLabel}
        </Text>
      </View>

      <View style={styles.rule} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <QuranArabicFlow fontSize={fontSize} verses={content.verses} />

        {showTranslation ? (
          <View style={styles.translationSection}>
            <View style={styles.translationHeading}>
              <View style={styles.translationRule} />
              <Text style={[textStyles.labelLarge, { color: quranTheme.translationInk }]}>
                {strings.quran.translation}
              </Text>
              <View style={styles.translationRule} />
            </View>
            <QuranTranslationList fontSize={fontSize} verses={content.verses} />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  paper: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: quranTheme.paper,
    borderRadius: componentRadius.card,
  },
  header: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  rule: {
    height: 1,
    marginHorizontal: spacing.lg,
    backgroundColor: quranTheme.paperRule,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  translationSection: {
    gap: spacing.lg,
    paddingTop: spacing.xl,
  },
  translationHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  translationRule: {
    flex: 1,
    height: 1,
    backgroundColor: quranTheme.paperRule,
  },
});
