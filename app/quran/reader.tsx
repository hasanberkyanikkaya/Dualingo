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
import SurahPickerModal from '@/features/quran/components/SurahPickerModal';
import { getQuranCatalog } from '@/features/quran/contentLoader';
import { useQuranReaderStore } from '@/features/quran/readerStore';
import { useQuranReader } from '@/features/quran/useQuranReader';

import type { QuranReaderFontSize, QuranSurahSummary } from '@/types';

const fontOptions: readonly { value: QuranReaderFontSize; label: string }[] = [
  { value: 'small', label: strings.quran.fontSmall },
  { value: 'medium', label: strings.quran.fontMedium },
  { value: 'large', label: strings.quran.fontLarge },
];

export default function QuranReaderScreen() {
  const params = useLocalSearchParams<{ verseKey?: string | string[] }>();
  const requestedVerseKey = typeof params.verseKey === 'string' ? params.verseKey : undefined;
  const reader = useQuranReader(requestedVerseKey);
  const showTranslation = useQuranReaderStore((state) => state.showTranslation);
  const setShowTranslation = useQuranReaderStore((state) => state.setShowTranslation);
  const fontSize = useQuranReaderStore((state) => state.fontSize);
  const setFontSize = useQuranReaderStore((state) => state.setFontSize);
  const [pickerVisible, setPickerVisible] = useState(false);
  const selectedSurah = getQuranCatalog().surahs.find(
    (surah) => surah.id === reader.selectedSurahId,
  );

  function selectSurah(surah: QuranSurahSummary): void {
    reader.openSurah(surah);
    setPickerVisible(false);
  }

  return (
    <QuranNightBackground>
      <Stack.Screen options={{ title: strings.quran.readerTitle }} />
      <StatusBar style="light" />
      <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.safeArea}>
        <View style={styles.header}>
          <QuranIconButton
            accessibilityLabel={strings.a11y.closeButton}
            icon="close"
            onPress={() => router.back()}
          />

          <Pressable
            accessibilityRole="button"
            onPress={() => setPickerVisible(true)}
            style={({ pressed }) => [
              styles.surahSelector,
              { backgroundColor: pressed ? quranTheme.glassPressed : quranTheme.glass },
            ]}
          >
            <View style={styles.surahSelectorText}>
              <Text numberOfLines={1} style={[textStyles.labelSmall, { color: quranTheme.textMuted }]}>
                {strings.quran.changeSurah}
              </Text>
              <Text numberOfLines={1} style={[textStyles.labelLarge, { color: quranTheme.text }]}>
                {selectedSurah?.nameArabic ?? strings.quran.chooseSurah}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={spacing.lg} color={quranTheme.textMuted} />
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

        <QuranBook
          focusVerseKey={reader.focusVerseKey}
          fontSize={fontSize}
          onRequestPage={reader.openPage}
          onVisibleVerses={reader.recordVisibleVerses}
          page={reader.page}
          pageCount={reader.pageCount}
          showTranslation={showTranslation}
        />
      </SafeAreaView>

      <SurahPickerModal
        onClose={() => setPickerVisible(false)}
        onSelect={selectSurah}
        selectedSurahId={reader.selectedSurahId}
        visible={pickerVisible}
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
    alignItems: 'center',
    gap: spacing.sm,
  },
  translationControl: {
    minHeight: layout.minTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    borderWidth: 1,
    borderColor: quranTheme.glassBorder,
    borderRadius: componentRadius.button,
    backgroundColor: quranTheme.glass,
  },
  fontOptions: {
    minHeight: layout.minTouchTarget,
    flex: 1,
    flexDirection: 'row',
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
});
