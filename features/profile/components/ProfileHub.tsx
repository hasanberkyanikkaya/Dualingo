import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { componentRadius } from '@/constants/radius';
import { layout, spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import ProfileSectionContent from '@/features/profile/components/ProfileSectionContent';
import ProfileSidebar from '@/features/profile/components/ProfileSidebar';
import { useTheme } from '@/lib/useTheme';

import type { ProfileSectionId } from '@/features/profile/types';

const sectionTitles: Record<ProfileSectionId, string> = {
  badges: strings.progress.badges,
  placement: strings.profile.placementTitle,
  notifications: strings.profile.notifications,
  account: strings.profile.accountTitle,
};

export default function ProfileHub() {
  const { theme } = useTheme();
  const [selectedSection, setSelectedSection] = useState<ProfileSectionId>('badges');
  const [sidebarVisible, setSidebarVisible] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setSidebarVisible(true);
    }, []),
  );

  function selectSection(sectionId: ProfileSectionId): void {
    setSelectedSection(sectionId);
    setSidebarVisible(false);
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel={strings.profile.openSidebar}
          accessibilityRole="button"
          onPress={() => setSidebarVisible(true)}
          style={({ pressed }) => [
            styles.menuButton,
            {
              backgroundColor: pressed ? theme.primarySoft : theme.surface,
              borderColor: theme.borderControl,
            },
          ]}
        >
          <Ionicons name="menu" size={spacing.xl} color={theme.textPrimary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text accessibilityRole="header" style={[textStyles.h2, { color: theme.textPrimary }]}>
            {strings.profile.title}
          </Text>
          <Text style={[textStyles.bodySmall, { color: theme.textSecondary }]}>
            {sectionTitles[selectedSection]}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ProfileSectionContent sectionId={selectedSection} />
      </ScrollView>

      <ProfileSidebar
        onClose={() => setSidebarVisible(false)}
        onSelect={selectSection}
        selectedId={selectedSection}
        visible={sidebarVisible}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  menuButton: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: componentRadius.button,
  },
  headerCopy: { flex: 1, gap: spacing.xs },
  content: { flexGrow: 1, paddingBottom: spacing.xxxl },
});
