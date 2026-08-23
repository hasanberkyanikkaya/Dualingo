import { useEffect, useRef } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  type FlatList as FlatListType,
  type ViewToken,
} from 'react-native';

import { quranTheme } from '@/constants/quranTheme';
import { componentRadius } from '@/constants/radius';
import { spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { quranTextScales, textStyles } from '@/constants/typography';
import { getQuranCatalog } from '@/features/quran/contentLoader';
import { formatString } from '@/lib/formatString';

import type { QuranPage, QuranReaderFontSize, QuranVerse, QuranVerseKey } from '@/types';

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
  const listRef = useRef<FlatListType<QuranVerse>>(null);
  const visibleCallback = useRef(onVisibleVerses);
  const trackRef = useRef(trackVisibility);
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 55,
    minimumViewTime: 600,
  }).current;
  const scale = quranTextScales[fontSize];
  const focusIndex = page.verses.findIndex((verse) => verse.key === focusVerseKey);
  const pageSurahNames = [...new Set(page.verses.map((verse) => verse.surahId))]
    .map((surahId) => surahById.get(surahId)?.nameArabic)
    .filter((name): name is string => name !== undefined)
    .join(' · ');
  const juzLabel =
    page.juzNumbers.length > 1
      ? formatString(strings.quran.juzRange, {
          first: page.juzNumbers[0],
          last: page.juzNumbers[page.juzNumbers.length - 1],
        })
      : formatString(strings.quran.juz, { number: page.juzNumbers[0] ?? 1 });

  useEffect(() => {
    visibleCallback.current = onVisibleVerses;
    trackRef.current = trackVisibility;
  }, [onVisibleVerses, trackVisibility]);

  useEffect(() => {
    if (focusIndex <= 0) {
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
      return;
    }

    listRef.current?.scrollToIndex({ index: focusIndex, animated: false, viewPosition: 0 });
  }, [focusIndex, page.pageNumber]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken<QuranVerse>[] }) => {
      if (!trackRef.current) {
        return;
      }
      const keys = viewableItems
        .filter((token) => token.isViewable && token.item !== undefined)
        .sort((left, right) => (left.index ?? 0) - (right.index ?? 0))
        .map((token) => token.item.key);
      visibleCallback.current(keys);
    },
  ).current;

  function renderVerse({ item }: { item: QuranVerse }) {
    return (
      <View style={styles.verseBlock}>
        <View style={styles.verseHeading}>
          <View style={styles.verseNumber}>
            <Text style={[textStyles.labelSmall, { color: quranTheme.ink }]}>
              {item.numberInSurah}
            </Text>
          </View>
          <Text style={[textStyles.caption, { color: quranTheme.footnoteInk }]}>
            {formatString(strings.quran.verse, { number: item.numberInSurah })}
          </Text>
        </View>

        <Text
          selectable
          style={[
            styles.arabic,
            scale.arabic,
            { color: quranTheme.ink },
          ]}
        >
          {item.arabicText}
        </Text>

        {showTranslation ? (
          <View style={styles.translationBlock}>
            <Text selectable style={[scale.translation, { color: quranTheme.translationInk }]}>
              {item.translationText}
            </Text>
            {item.translationFootnotes.map((footnote, index) => (
              <Text
                key={`${item.key}-footnote-${index}`}
                selectable
                style={[styles.footnote, scale.footnote, { color: quranTheme.footnoteInk }]}
              >
                {footnote}
              </Text>
            ))}
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.paper}>
      <View style={styles.pageHeader}>
        <Text
          numberOfLines={1}
          style={[textStyles.bodyLarge, styles.surahName, { color: quranTheme.ink }]}
        >
          {pageSurahNames}
        </Text>
        <Text style={[textStyles.caption, { color: quranTheme.footnoteInk }]}>{juzLabel}</Text>
      </View>

      <View style={styles.rule} />

      <FlatList
        ref={listRef}
        contentContainerStyle={styles.pageContent}
        data={page.verses}
        initialNumToRender={page.verses.length}
        keyExtractor={(verse) => verse.key}
        onScrollToIndexFailed={({ averageItemLength, index }) => {
          listRef.current?.scrollToOffset({
            offset: Math.max(0, averageItemLength * index),
            animated: false,
          });
        }}
        onViewableItemsChanged={onViewableItemsChanged}
        renderItem={renderVerse}
        showsVerticalScrollIndicator={false}
        viewabilityConfig={viewabilityConfig}
      />

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

const styles = StyleSheet.create({
  paper: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: quranTheme.paper,
    borderRadius: componentRadius.card,
  },
  pageHeader: {
    minHeight: spacing.xxxl,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  surahName: {
    flex: 1,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  rule: {
    height: 1,
    marginHorizontal: spacing.lg,
    backgroundColor: quranTheme.paperRule,
  },
  pageContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  verseBlock: {
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: quranTheme.paperRule,
  },
  verseHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  verseNumber: {
    minWidth: spacing.xl,
    height: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: quranTheme.bookGold,
    borderRadius: componentRadius.button,
  },
  arabic: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  translationBlock: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  footnote: {
    fontStyle: 'italic',
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
