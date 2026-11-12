import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Screen from "@/components/Screen";
import { quranTheme } from "@/constants/quranTheme";
import { componentRadius } from "@/constants/radius";
import { layout, spacing } from "@/constants/spacing";
import strings from "@/constants/strings";
import { textStyles } from "@/constants/typography";
import QuranButton from "@/features/quran/components/QuranButton";
import QuranHomeBackground from "@/features/quran/components/QuranHomeBackground";
import QuranProgressBar from "@/features/quran/components/QuranProgressBar";
import SurahPickerModal from "@/features/quran/components/SurahPickerModal";
import {
  findQuranVerse,
  getQuranCatalog,
  getQuranManifest,
} from "@/features/quran/contentLoader";
import { readLastReadPosition } from "@/features/quran/quranDb";
import { useQuranGoal } from "@/features/quran/useQuranGoal";
import { formatString } from "@/lib/formatString";
import { useTheme } from "@/lib/useTheme";

import type { QuranReadingPosition, QuranSurahSummary } from "@/types";

export default function QuranScreen() {
  const { isDark, theme } = useTheme();
  const [lastPosition, setLastPosition] = useState<QuranReadingPosition | null>(
    () => readLastReadPosition(),
  );
  const [pickerVisible, setPickerVisible] = useState(false);
  const { progress: goalProgress, refresh: refreshGoal } = useQuranGoal();
  const manifest = getQuranManifest();
  const lastVerse =
    lastPosition?.contentRevision === manifest.contentRevision
      ? findQuranVerse(lastPosition.verseKey)
      : null;
  const lastSurah =
    lastVerse === null
      ? null
      : (getQuranCatalog().surahs.find(
          (surah) => surah.id === lastVerse.surahId,
        ) ?? null);

  useFocusEffect(
    useCallback(() => {
      setLastPosition(readLastReadPosition());
      refreshGoal();
    }, [refreshGoal]),
  );

  function openMushaf(verseKey: string): void {
    router.push({
      pathname: "/quran/reader",
      params: { mode: "mushaf", verseKey },
    });
  }

  function selectSurah(surah: QuranSurahSummary): void {
    setPickerVisible(false);
    router.push({
      pathname: "/quran/reader",
      params: { mode: "surah", surahId: String(surah.id) },
    });
  }

  return (
    <Screen
      background={<QuranHomeBackground />}
      contentStyle={styles.screenContent}
      tabPane
    >
      <StatusBar style={isDark ? "light" : "dark"} />
      <View style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View
              style={[
                styles.headerIcon,
                {
                  backgroundColor: theme.surfaceGlass,
                  borderColor: theme.borderControl,
                },
              ]}
            >
              <Ionicons
                name="book-outline"
                size={spacing.xl}
                color={quranTheme.accent}
              />
            </View>
            <Text
              accessibilityRole="header"
              style={[textStyles.h2, { color: theme.textPrimary }]}
            >
              {strings.quran.title}
            </Text>
          </View>

          <View
            style={[
              styles.heroCard,
              theme.elevation.card,
              {
                backgroundColor: theme.surfaceGlass,
                borderColor: theme.borderControl,
              },
            ]}
          >
            <View style={styles.cardIcon}>
              <Ionicons
                name="bookmark"
                size={spacing.xl}
                color={quranTheme.onAccent}
              />
            </View>
            <View style={styles.cardCopy}>
              <Text style={[textStyles.h3, { color: theme.textPrimary }]}>
                {lastVerse === null
                  ? strings.quran.startTitle
                  : strings.quran.continueTitle}
              </Text>
              <Text
                style={[textStyles.bodyMedium, { color: theme.textSecondary }]}
              >
                {lastVerse === null
                  ? strings.quran.startBody
                  : formatString(strings.quran.continueBody, {
                      sure: lastSurah?.nameTurkish ?? lastVerse.surahId,
                      ayet: lastVerse.numberInSurah,
                      sayfa: lastVerse.pageNumber,
                    })}
              </Text>
            </View>
            <QuranButton
              icon="book-outline"
              label={
                lastVerse === null
                  ? strings.quran.startAction
                  : strings.quran.continueAction
              }
              onPress={() => openMushaf(lastVerse?.key ?? "1:1")}
              variant="accent"
            />
          </View>

          <View
            style={[
              styles.glassCard,
              theme.elevation.card,
              {
                backgroundColor: theme.surfaceGlass,
                borderColor: theme.borderControl,
              },
            ]}
          >
            <View style={styles.selectCopy}>
              <Ionicons
                name="flag-outline"
                size={spacing.xl}
                color={quranTheme.accent}
              />
              <View style={styles.selectText}>
                <Text style={[textStyles.h4, { color: theme.textPrimary }]}>
                  {strings.quran.goalCardTitle}
                </Text>
                <Text
                  style={[
                    textStyles.bodySmall,
                    { color: theme.textSecondary },
                  ]}
                >
                  {goalProgress === null
                    ? strings.quran.goalCardEmpty
                    : formatString(strings.quran.goalCardProgress, {
                        percent: goalProgress.percent,
                      })}
                </Text>
              </View>
            </View>
            {goalProgress === null ? null : (
              <QuranProgressBar
                accessibilityLabel={formatString(
                  strings.quran.goalCardProgress,
                  {
                    percent: goalProgress.percent,
                  },
                )}
                ratio={goalProgress.ratio}
                trackColor={theme.borderStrong}
              />
            )}
            <QuranButton
              icon="flag-outline"
              label={strings.quran.goalOpen}
              onPress={() => router.push("/quran/goals")}
              surfaceTone="app"
            />
          </View>

          <View
            style={[
              styles.glassCard,
              theme.elevation.card,
              {
                backgroundColor: theme.surfaceGlass,
                borderColor: theme.borderControl,
              },
            ]}
          >
            <View style={styles.selectCopy}>
              <Ionicons
                name="list"
                size={spacing.xl}
                color={quranTheme.accent}
              />
              <View style={styles.selectText}>
                <Text style={[textStyles.h4, { color: theme.textPrimary }]}>
                  {strings.quran.chooseSurah}
                </Text>
                <Text
                  style={[
                    textStyles.bodySmall,
                    { color: theme.textSecondary },
                  ]}
                >
                  {strings.quran.surahPickerBody}
                </Text>
              </View>
            </View>
            <QuranButton
              icon="chevron-forward"
              label={strings.quran.chooseSurah}
              onPress={() => setPickerVisible(true)}
              surfaceTone="app"
            />
          </View>

          {manifest.publicationStatus === "development_only" ? (
            <View style={styles.developmentNotice}>
              <Ionicons
                name="information-circle-outline"
                size={spacing.lg}
                color={theme.textSecondary}
              />
              <Text
                style={[
                  textStyles.caption,
                  styles.noticeText,
                  { color: theme.textSecondary },
                ]}
              >
                {strings.quran.developmentNotice}
              </Text>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="link"
            onPress={() => {
              void Linking.openURL("https://tanzil.net/");
            }}
            style={styles.attribution}
          >
            <Text
              style={[
                textStyles.caption,
                styles.attributionText,
                { color: theme.textSecondary },
              ]}
            >
              {strings.quran.sourceAttribution}
            </Text>
            <Ionicons
              name="open-outline"
              size={spacing.lg}
              color={theme.textSecondary}
            />
          </Pressable>
        </ScrollView>
      </View>

      <SurahPickerModal
        onClose={() => setPickerVisible(false)}
        onSelect={selectSurah}
        selectedSurahId={null}
        visible={pickerVisible}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    paddingHorizontal: spacing.none,
    paddingVertical: spacing.none,
  },
  safeArea: { flex: 1 },
  content: {
    flexGrow: 1,
    gap: layout.sectionGap,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.xl,
    paddingBottom: layout.sectionGap,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  headerIcon: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: componentRadius.modal,
    borderWidth: 1,
  },
  heroCard: {
    gap: spacing.lg,
    padding: spacing.xl,
    borderRadius: componentRadius.modal,
    borderWidth: 1,
  },
  cardIcon: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: componentRadius.button,
    backgroundColor: quranTheme.accent,
  },
  cardCopy: { gap: spacing.sm },
  glassCard: {
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: componentRadius.card,
    borderWidth: 1,
  },
  selectCopy: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  selectText: { flex: 1, gap: spacing.xs },
  developmentNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  noticeText: { flex: 1 },
  attribution: {
    minHeight: layout.minTouchTarget,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  attributionText: { textAlign: "center" },
});
