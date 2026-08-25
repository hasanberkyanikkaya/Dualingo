import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { quranTheme } from '@/constants/quranTheme';
import { componentRadius } from '@/constants/radius';
import { layout, spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import QuranBook from '@/features/quran/components/QuranBook';
import QuranIconButton from '@/features/quran/components/QuranIconButton';
import QuranNightBackground from '@/features/quran/components/QuranNightBackground';
import QuranSurahReading from '@/features/quran/components/QuranSurahReading';
import SurahPickerModal from '@/features/quran/components/SurahPickerModal';
import { getQuranCatalog, loadQuranSurah } from '@/features/quran/contentLoader';
import { useQuranReaderStore } from '@/features/quran/readerStore';
import { useQuranReader } from '@/features/quran/useQuranReader';

import type { QuranReaderFontSize, QuranReaderMode, QuranSurahSummary } from '@/types';

const fontOptions: readonly { value: QuranReaderFontSize; label: string }[] = [
  { value: 'small', label: strings.quran.fontSmall },
  { value: 'medium', label: strings.quran.fontMedium },
  { value: 'large', label: strings.quran.fontLarge },
];

export default function QuranReaderScreen() {
  const params = useLocalSearchParams<{
    mode?: string | string[];
    surahId?: string | string[];
    verseKey?: string | string[];
  }>();
  const mode: QuranReaderMode = params.mode === 'surah' ? 'surah' : 'mushaf';
  const requestedVerseKey = typeof params.verseKey === 'string' ? params.verseKey : undefined;
  const requestedSurahId = parseSurahId(params.surahId);
  const [surahId, setSurahId] = useState(requestedSurahId);
  const reader = useQuranReader(mode, requestedVerseKey);
  const showTranslation = useQuranReaderStore((state) => state.showTranslation);
  const setShowTranslation = useQuranReaderStore((state) => state.setShowTranslation);
  const fontSize = useQuranReaderStore((state) => state.fontSize);
  const setFontSize = useQuranReaderStore((state) => state.setFontSize);
  const [pickerVisible, setPickerVisible] = useState(false);
  const selectedSurahId = mode === 'surah' ? surahId : reader.selectedSurahId;
  const selectedSurah = getQuranCatalog().surahs.find(
    (surah) => surah.id === selectedSurahId,
  );
  const surahContent = mode === 'surah' ? loadQuranSurah(surahId) : null;

  function selectSurah(surah: QuranSurahSummary): void {
    setSurahId(surah.id);
    setPickerVisible(false);
  }

  return (
    <QuranNightBackground>
      <Stack.Screen options={{ title: strings.quran.readerTitle }} />
      <StatusBar style="dark" />
      <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.safeArea}>
        <View style={styles.header}>
          <QuranIconButton
            accessibilityLabel={strings.a11y.closeButton}
            icon="close"
            onPress={() => router.back()}
          />

          <Pressable
            accessibilityRole={mode === 'surah' ? 'button' : undefined}
            disabled={mode === 'mushaf'}
            onPress={() => setPickerVisible(true)}
            style={({ pressed }) => [
              styles.surahSelector,
              {
                backgroundColor:
                  pressed && mode === 'surah' ? quranTheme.glassPressed : quranTheme.glass,
              },
            ]}
          >
            <View style={styles.surahSelectorText}>
              <Text numberOfLines={1} style={[textStyles.labelSmall, { color: quranTheme.textMuted }]}>
                {mode === 'surah'
                  ? strings.quran.changeSurah
                  : strings.quran.mushafReadingLabel}
              </Text>
              <Text numberOfLines={1} style={[textStyles.labelLarge, { color: quranTheme.text }]}>
                {selectedSurah?.nameTurkish ?? strings.quran.chooseSurah}
              </Text>
            </View>
            {mode === 'surah' ? (
              <Ionicons name="chevron-down" size={spacing.lg} color={quranTheme.textMuted} />
            ) : null}
          </Pressable>

          <QuranIconButton
            accessibilityLabel={strings.quran.openSource}
            icon="information-circle-outline"
            onPress={() => {
              void Linking.openURL('https://tanzil.net/');
            }}
          />
        </View>

        <View style={styles.controls}>
          <View style={styles.translationControl}>
            <Text style={[textStyles.labelMedium, { color: quranTheme.text }]}>
              {strings.quran.translation}
            </Text>
            <Switch
              accessibilityLabel={strings.quran.translation}
              onValueChange={setShowTranslation}
              style={styles.translationSwitch}
              thumbColor={showTranslation ? quranTheme.onAccent : quranTheme.textMuted}
              trackColor={{ false: quranTheme.glassBorder, true: quranTheme.accent }}
              value={showTranslation}
            />
          </View>

          <View accessibilityRole="radiogroup" style={styles.fontOptions}>
            {fontOptions.map((option) => {
              const selected = option.value === fontSize;
              return (
                <Pressable
                  key={option.value}
                  accessibilityLabel={`${strings.quran.fontSize}: ${option.label}`}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => setFontSize(option.value)}
                  style={[
                    styles.fontOption,
                    {
                      backgroundColor: selected ? quranTheme.accent : quranTheme.glass,
                      borderColor: selected ? quranTheme.accent : quranTheme.glassBorder,
                    },
                  ]}
                >
                  {selected ? (
                    <Ionicons name="checkmark" size={spacing.md} color={quranTheme.onAccent} />
                  ) : null}
                  <Text
                    style={[
                      textStyles.labelSmall,
                      { color: selected ? quranTheme.onAccent : quranTheme.text },
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {mode === 'surah' ? (
          <View style={styles.surahReadingArea}>
            <View style={styles.surahReadingNotice}>
              <Ionicons name="information-circle-outline" size={spacing.lg} color={quranTheme.textMuted} />
              <Text style={[textStyles.caption, styles.noticeText, { color: quranTheme.textMuted }]}>
                {strings.quran.surahReadingNotice}
              </Text>
            </View>
            {surahContent === null ? (
              <View style={styles.unavailable}>
                <Text style={[textStyles.bodyMedium, { color: quranTheme.text }]}>
                  {strings.quran.contentUnavailable}
                </Text>
              </View>
            ) : (
              <QuranSurahReading
                content={surahContent}
                fontSize={fontSize}
                showTranslation={showTranslation}
              />
            )}
          </View>
        ) : (
          <QuranBook
            focusVerseKey={reader.focusVerseKey}
            fontSize={fontSize}
            onRequestPage={reader.openPage}
            onVisibleVerses={reader.recordVisibleVerses}
            page={reader.page}
            pageCount={reader.pageCount}
            showTranslation={showTranslation}
          />
        )}
      </SafeAreaView>

      <SurahPickerModal
        onClose={() => setPickerVisible(false)}
        onSelect={selectSurah}
        selectedSurahId={selectedSurahId}
        visible={mode === 'surah' && pickerVisible}
      />
    </QuranNightBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, gap: spacing.sm, paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  surahSelector: {
    minHeight: layout.minTouchTarget,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: quranTheme.glassBorder,
    borderRadius: componentRadius.button,
  },
  surahSelectorText: { flex: 1 },
  controls: {
    minHeight: layout.minTouchTarget,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm,
  },
  translationControl: {
    minHeight: layout.minTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    borderWidth: 1,
    borderColor: quranTheme.glassBorder,
    borderRadius: componentRadius.button,
    backgroundColor: quranTheme.glass,
  },
  translationSwitch: { alignSelf: 'center' },
  fontOptions: {
    minHeight: layout.minTouchTarget,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.xs,
  },
  fontOption: {
    minWidth: layout.minTouchTarget,
    minHeight: layout.minTouchTarget,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
    borderWidth: 1,
    borderRadius: componentRadius.button,
  },
  surahReadingArea: {
    flex: 1,
    gap: spacing.sm,
  },
  surahReadingNotice: {
    minHeight: layout.minTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: quranTheme.glassBorder,
    borderRadius: componentRadius.button,
    backgroundColor: quranTheme.glass,
  },
  noticeText: {
    flex: 1,
  },
  unavailable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

function parseSurahId(value: string | string[] | undefined): number {
  const parsed = typeof value === 'string' ? Number(value) : Number.NaN;
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 114 ? parsed : 1;
}
