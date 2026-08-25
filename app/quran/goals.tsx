import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { quranTheme } from '@/constants/quranTheme';
import { componentRadius } from '@/constants/radius';
import { layout, spacing } from '@/constants/spacing';
import { strings } from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import QuranButton from '@/features/quran/components/QuranButton';
import QuranGoalEditor from '@/features/quran/components/QuranGoalEditor';
import QuranGoalSummary from '@/features/quran/components/QuranGoalSummary';
import QuranNightBackground from '@/features/quran/components/QuranNightBackground';
import { useQuranGoal } from '@/features/quran/useQuranGoal';

export default function QuranGoalsScreen() {
  const quranGoal = useQuranGoal();
  const refresh = quranGoal.refresh;
  const refreshPermission = quranGoal.refreshPermission;
  const [editing, setEditing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refresh();
      void refreshPermission();
    }, [refresh, refreshPermission]),
  );

  function confirmRemove(): void {
    Alert.alert(strings.quran.goalRemoveTitle, strings.quran.goalRemoveBody, [
      { text: strings.quran.goalCancel, style: 'cancel' },
      {
        text: strings.quran.goalRemove,
        style: 'destructive',
        onPress: () => {
          void quranGoal.removeGoal();
        },
      },
    ]);
  }

  return (
    <QuranNightBackground>
      <Stack.Screen options={{ title: strings.quran.goalScreenTitle }} />
      <StatusBar style="dark" />
      <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Pressable
              accessibilityLabel={strings.a11y.closeButton}
              accessibilityRole="button"
              hitSlop={spacing.md}
              onPress={() => router.back()}
              style={styles.close}
            >
              <Ionicons name="close" size={spacing.xl} color={quranTheme.text} />
            </Pressable>
            <View style={styles.headerCopy}>
              <Text accessibilityRole="header" style={[textStyles.h2, { color: quranTheme.text }]}>
                {strings.quran.goalScreenTitle}
              </Text>
              <Text style={[textStyles.bodyMedium, { color: quranTheme.textMuted }]}>
                {strings.quran.goalScreenBody}
              </Text>
            </View>
          </View>

          {quranGoal.permission === 'denied' && quranGoal.goal?.reminderEnabled ? (
            <View style={styles.permissionNotice}>
              <Ionicons name="notifications-off-outline" size={spacing.xl} color={quranTheme.warning} />
              <View style={styles.permissionCopy}>
                <Text style={[textStyles.labelLarge, { color: quranTheme.text }]}>
                  {strings.quran.goalPermissionDeniedTitle}
                </Text>
                <Text style={[textStyles.bodySmall, { color: quranTheme.textMuted }]}>
                  {strings.quran.goalPermissionDeniedBody}
                </Text>
              </View>
              <QuranButton
                icon="settings-outline"
                label={strings.quran.goalOpenSettings}
                onPress={() => {
                  void Linking.openSettings();
                }}
              />
            </View>
          ) : null}

          {quranGoal.goal !== null && quranGoal.progress !== null && !editing ? (
            <QuranGoalSummary
              goal={quranGoal.goal}
              onEdit={() => setEditing(true)}
              onRemove={confirmRemove}
              progress={quranGoal.progress}
            />
          ) : (
            <QuranGoalEditor
              goal={quranGoal.goal}
              onSave={async (input) => {
                const result = await quranGoal.saveGoal(input);
                if (result.saved) {
                  setEditing(false);
                }
                return result;
              }}
              today={quranGoal.today}
            />
          )}
        </ScrollView>
      </SafeAreaView>
    </QuranNightBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: {
    gap: layout.sectionGap,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: layout.screenPaddingVertical,
    paddingBottom: layout.sectionGap,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  close: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: quranTheme.glassBorder,
    borderRadius: componentRadius.button,
    backgroundColor: quranTheme.glass,
  },
  headerCopy: { flex: 1, gap: spacing.xs },
  permissionNotice: {
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: quranTheme.warning,
    borderRadius: componentRadius.card,
    backgroundColor: quranTheme.glass,
  },
  permissionCopy: { gap: spacing.xs },
});
