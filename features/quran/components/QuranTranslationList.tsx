import { StyleSheet, Text, View } from 'react-native';

import { quranTheme } from '@/constants/quranTheme';
import { spacing } from '@/constants/spacing';
import { quranTextScales, textStyles } from '@/constants/typography';

import type { QuranReaderFontSize, QuranVerse } from '@/types';

type QuranTranslationListProps = {
  verses: readonly QuranVerse[];
  fontSize: QuranReaderFontSize;
};

export default function QuranTranslationList({
  verses,
  fontSize,
}: QuranTranslationListProps) {
  const scale = quranTextScales[fontSize];

  return (
    <View style={styles.root}>
      {verses.map((verse) => (
        <View key={verse.key} style={styles.verse}>
          <Text selectable style={[scale.translation, { color: quranTheme.translationInk }]}>
            <Text style={[textStyles.labelSmall, { color: quranTheme.footnoteInk }]}>
              {verse.numberInSurah}.{' '}
            </Text>
            <Text>
              {verse.translationText}
            </Text>
          </Text>
          {verse.translationFootnotes.map((footnote, index) => (
            <Text
              key={`${verse.key}-footnote-${index}`}
              selectable
              style={[styles.footnote, scale.footnote, { color: quranTheme.footnoteInk }]}
            >
              {footnote}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
  },
  verse: {
    gap: spacing.sm,
  },
  footnote: {
    fontStyle: 'italic',
  },
});
