import { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, Text, View, type ScrollView as ScrollViewType } from 'react-native';

import { quranTheme } from '@/constants/quranTheme';
import { componentRadius } from '@/constants/radius';
import { spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import QuranArabicFlow from '@/features/quran/components/QuranArabicFlow';
import QuranTranslationList from '@/features/quran/components/QuranTranslationList';
import { getQuranCatalog } from '@/features/quran/contentLoader';
import { formatString } from '@/lib/formatString';

import type { QuranPage, QuranReaderFontSize, QuranVerseKey } from '@/types';

type QuranBookPageProps = {
  page: QuranPage;
  focusVerseKey: QuranVerseKey | null;
  fontSize: QuranReaderFontSize;
  showTranslation: boolean;
  trackVisibility: boolean;
  onVisibleVerses: (keys: readonly QuranVerseKey[]) => void;
};

const surahById = new Map(getQuranCatalog().surahs.map((surah) => [surah.id, surah]));

export default function QuranBookPage({
  page,
  focusVerseKey,
  fontSize,
  showTranslation,
  trackVisibility,
  onVisibleVerses,
}: QuranBookPageProps) {
  const scrollRef = useRef<ScrollViewType>(null);
  const visibleCallback = useRef(onVisibleVerses);
  const firstSurah = surahById.get(page.verses[0]?.surahId ?? 0);
  const juzLabel = getJuzLabel(page);

  useEffect(() => {
    visibleCallback.current = onVisibleVerses;
  }, [onVisibleVerses]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [page.pageNumber]);

  useEffect(() => {
    if (!trackVisibility) {
      return undefined;
    }

    const timer = setTimeout(() => {
      visibleCallback.current(page.verses.map((verse) => verse.key));
    }, 600);
    return () => clearTimeout(timer);
  }, [page.pageNumber, page.verses, trackVisibility]);

  return (
    <View style={styles.paper}>
      <View style={styles.pageHeader}>
        <Text
          numberOfLines={1}
          style={[textStyles.bodyLarge, styles.surahName, { color: quranTheme.ink }]}
        >
          {firstSurah?.nameTurkish ?? firstSurah?.nameArabic}
        </Text>
        <Text style={[textStyles.caption, { color: quranTheme.footnoteInk }]}>{juzLabel}</Text>
      </View>

      <View style={styles.rule} />

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.pageContent}
        showsVerticalScrollIndicator={false}
      >
        <QuranArabicFlow
          focusVerseKey={focusVerseKey}
          fontSize={fontSize}
          verses={page.verses}
        />

        {showTranslation ? (
          <View style={styles.translationSection}>
            <View style={styles.translationHeading}>
              <View style={styles.translationRule} />
              <Text style={[textStyles.labelLarge, { color: quranTheme.translationInk }]}>
                {strings.quran.pageTranslation}
              </Text>
              <View style={styles.translationRule} />
            </View>
            <QuranTranslationList fontSize={fontSize} verses={page.verses} />
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.pageNumberRow}>
        <View style={styles.pageNumberRule} />
        <Text style={[textStyles.labelSmall, { color: quranTheme.footnoteInk }]}>
          {formatString(strings.quran.page, { number: page.pageNumber })}
        </Text>
        <View style={styles.pageNumberRule} />
      </View>
    </View>
  );
}

function getJuzLabel(page: QuranPage): string {
  return page.juzNumbers.length > 1
    ? formatString(strings.quran.juzRange, {
        first: page.juzNumbers[0],
        last: page.juzNumbers[page.juzNumbers.length - 1],
      })
    : formatString(strings.quran.juz, { number: page.juzNumbers[0] ?? 1 });
}

const styles = StyleSheet.create({
  paper: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: quranTheme.paper,
    borderRadius: componentRadius.card,
  },
  pageHeader: {
    minHeight: spacing.xxxl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  surahName: {
    flex: 1,
  },
  rule: {
    height: 1,
    marginHorizontal: spacing.lg,
    backgroundColor: quranTheme.paperRule,
  },
  pageContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  translationSection: {
    gap: spacing.lg,
    paddingTop: spacing.xl,
  },
  translationHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  translationRule: {
    flex: 1,
    height: 1,
    backgroundColor: quranTheme.paperRule,
  },
  pageNumberRow: {
    minHeight: spacing.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  pageNumberRule: {
    width: spacing.xxl,
    height: 1,
    backgroundColor: quranTheme.bookGold,
  },
});
