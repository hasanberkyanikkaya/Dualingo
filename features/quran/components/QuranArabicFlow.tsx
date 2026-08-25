import { StyleSheet, Text, View } from 'react-native';

import { quranTheme } from '@/constants/quranTheme';
import { spacing } from '@/constants/spacing';
import { quranTextScales, textStyles } from '@/constants/typography';
import { getQuranCatalog } from '@/features/quran/contentLoader';
import {
  formatQuranVerseMarker,
  groupQuranVersesBySurah,
} from '@/features/quran/readerLayout';

import type { QuranReaderFontSize, QuranVerse, QuranVerseKey } from '@/types';

type QuranArabicFlowProps = {
  verses: readonly QuranVerse[];
  fontSize: QuranReaderFontSize;
  focusVerseKey?: QuranVerseKey | null;
  showFirstSurahHeading?: boolean;
};

const surahById = new Map(getQuranCatalog().surahs.map((surah) => [surah.id, surah]));

export default function QuranArabicFlow({
  verses,
  fontSize,
  focusVerseKey = null,
  showFirstSurahHeading = false,
}: QuranArabicFlowProps) {
  const sections = groupQuranVersesBySurah(verses);
  const scale = quranTextScales[fontSize];

  return (
    <View style={styles.root}>
      {sections.map((section, sectionIndex) => {
        const showHeading = showFirstSurahHeading || sectionIndex > 0;
        const surah = surahById.get(section.surahId);

        return (
          <View key={`${section.surahId}-${sectionIndex}`} style={styles.section}>
            {showHeading ? (
              <View style={styles.surahTransition}>
                <View style={styles.transitionRule} />
                <Text style={[textStyles.labelLarge, styles.surahName, { color: quranTheme.ink }]}>
                  {surah?.nameTurkish ?? surah?.nameArabic}
                </Text>
              </View>
            ) : null}

            <Text
              accessible
              selectable
              style={[styles.arabicFlow, scale.arabic, { color: quranTheme.ink }]}
            >
              {section.verses.map((verse) => (
                <Text
                  key={verse.key}
                  style={verse.key === focusVerseKey ? styles.focusedVerse : undefined}
                >
                  {verse.arabicText}
                  <Text style={[textStyles.labelSmall, styles.verseMarker]}>
                    {formatQuranVerseMarker(verse.numberInSurah)}
                  </Text>
                </Text>
              ))}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
  },
  section: {
    gap: spacing.md,
  },
  surahTransition: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  transitionRule: {
    width: '100%',
    height: 1,
    backgroundColor: quranTheme.bookGold,
  },
  surahName: {
    textAlign: 'center',
  },
  arabicFlow: {
    textAlign: 'justify',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  focusedVerse: {
    backgroundColor: quranTheme.accentSoft,
  },
  verseMarker: {
    color: quranTheme.bookGold,
  },
});
