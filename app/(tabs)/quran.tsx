import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { quranTheme } from '@/constants/quranTheme';
import { componentRadius } from '@/constants/radius';
import { layout, spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import { findQuranVerse, getQuranManifest } from '@/features/quran/contentLoader';
import QuranButton from '@/features/quran/components/QuranButton';
import QuranNightBackground from '@/features/quran/components/QuranNightBackground';
import SurahPickerModal from '@/features/quran/components/SurahPickerModal';
import { readLastReadPosition } from '@/features/quran/quranDb';
import { formatString } from '@/lib/formatString';

import type { QuranReadingPosition, QuranSurahSummary } from '@/types';

export default function QuranScreen() {
  const [lastPosition, setLastPosition] = useState<QuranReadingPosition | null>(() =>
    readLastReadPosition(),
  );
  const [pickerVisible, setPickerVisible] = useState(false);
  const manifest = getQuranManifest();
  const lastVerse =
    lastPosition?.contentRevision === manifest.contentRevision
      ? findQuranVerse(lastPosition.verseKey)
      : null;

  useFocusEffect(
    useCallback(() => {
      setLastPosition(readLastReadPosition());
    }, []),
  );

  function openReader(verseKey: string): void {
    router.push({ pathname: '/quran/reader', params: { verseKey } });
  }

  function selectSurah(surah: QuranSurahSummary): void {
    setPickerVisible(false);
    openReader(`${surah.id}:1`);
  }

  return (
    <QuranNightBackground>
      <StatusBar style="light" />
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.titleBlock}>
              <Text accessibilityRole="header" style={[textStyles.h1, { color: quranTheme.text }]}>
                {strings.quran.title}
              </Text>
              <Text style={[textStyles.bodyMedium, { color: quranTheme.textMuted }]}>
                {strings.quran.subtitle}
              </Text>
            </View>
            <View style={styles.headerIcon}>
              <Ionicons name="book-outline" size={spacing.xxl} color={quranTheme.accent} />
            </View>
          </View>

          <View style={styles.heroCard}>
            <View style={styles.cardIcon}>
              <Ionicons name="bookmark" size={spacing.xl} color={quranTheme.onAccent} />
            </View>
            <View style={styles.cardCopy}>
              <Text style={[textStyles.h3, { color: quranTheme.text }]}>
                {lastVerse === null ? strings.quran.startTitle : strings.quran.continueTitle}
              </Text>
              <Text style={[textStyles.bodyMedium, { color: quranTheme.textMuted }]}>
                {lastVerse === null
                  ? strings.quran.startBody
                  : formatString(strings.quran.continueBody, {
                      sure: lastVerse.surahId,
                      ayet: lastVerse.numberInSurah,
                      sayfa: lastVerse.pageNumber,
                    })}
              </Text>
            </View>
            <QuranButton
              icon="book-outline"
              label={lastVerse === null ? strings.quran.startAction : strings.quran.continueAction}
              onPress={() => openReader(lastVerse?.key ?? '1:1')}
              variant="accent"
            />
          </View>

          <View style={styles.glassCard}>
            <View style={styles.selectCopy}>
              <Ionicons name="list" size={spacing.xl} color={quranTheme.accent} />
              <View style={styles.selectText}>
                <Text style={[textStyles.h4, { color: quranTheme.text }]}>
                  {strings.quran.chooseSurah}
                </Text>
                <Text style={[textStyles.bodySmall, { color: quranTheme.textMuted }]}>
                  {strings.quran.surahPickerBody}
                </Text>
              </View>
            </View>
            <QuranButton
              icon="chevron-forward"
              label={strings.quran.chooseSurah}
              onPress={() => setPickerVisible(true)}
            />
          </View>

          {manifest.publicationStatus === 'development_only' ? (
            <View style={styles.developmentNotice}>
              <Ionicons
                name="information-circle-outline"
                size={spacing.lg}
                color={quranTheme.textMuted}
              />
              <Text style={[textStyles.caption, styles.noticeText, { color: quranTheme.textMuted }]}>
                {strings.quran.developmentNotice}
              </Text>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="link"
            onPress={() => {
              void Linking.openURL('https://tanzil.net/');
            }}
            style={styles.attribution}
          >
            <Text style={[textStyles.caption, styles.attributionText, { color: quranTheme.textMuted }]}>
              {strings.quran.sourceAttribution}
            </Text>
            <Ionicons name="open-outline" size={spacing.lg} color={quranTheme.textMuted} />
          </Pressable>
        </ScrollView>
      </SafeAreaView>

      <SurahPickerModal
        onClose={() => setPickerVisible(false)}
        onSelect={selectSurah}
        selectedSurahId={lastVerse?.surahId ?? null}
        visible={pickerVisible}
      />
    </QuranNightBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: {
    flexGrow: 1,
    gap: layout.sectionGap,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.xl,
    paddingBottom: layout.sectionGap,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  titleBlock: { flex: 1, gap: spacing.xs },
  headerIcon: {
    width: spacing.huge,
    height: spacing.huge,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: componentRadius.modal,
    borderWidth: 1,
    borderColor: quranTheme.glassBorder,
    backgroundColor: quranTheme.glass,
  },
  heroCard: {
    gap: spacing.lg,
    padding: spacing.xl,
    borderRadius: componentRadius.modal,
    borderWidth: 1,
    borderColor: quranTheme.glassBorder,
    backgroundColor: quranTheme.glass,
  },
  cardIcon: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: componentRadius.button,
    backgroundColor: quranTheme.accent,
  },
  cardCopy: { gap: spacing.sm },
  glassCard: {
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: componentRadius.card,
    borderWidth: 1,
    borderColor: quranTheme.glassBorder,
    backgroundColor: quranTheme.glass,
  },
  selectCopy: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  selectText: { flex: 1, gap: spacing.xs },
  developmentNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  noticeText: { flex: 1 },
  attribution: {
    minHeight: layout.minTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  attributionText: { textAlign: 'center' },
});
