import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { componentRadius } from '@/constants/radius';
import { layout, spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import { useTheme } from '@/lib/useTheme';

import type { ProfileSectionId } from '@/features/profile/types';
import type { ComponentProps } from 'react';

type SidebarItem = {
  id: ProfileSectionId;
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
};

type ProfileSidebarProps = {
  selectedId: ProfileSectionId;
  visible: boolean;
  onClose: () => void;
  onSelect: (id: ProfileSectionId) => void;
};

const items: readonly SidebarItem[] = [
  { id: 'overview', icon: 'person-outline', label: strings.profile.overviewTitle },
  { id: 'badges', icon: 'ribbon-outline', label: strings.progress.badges },
  { id: 'placement', icon: 'school-outline', label: strings.profile.placementTitle },
  { id: 'notifications', icon: 'notifications-outline', label: strings.profile.notifications },
  { id: 'account', icon: 'person-circle-outline', label: strings.profile.accountTitle },
];

export default function ProfileSidebar({
  selectedId,
  visible,
  onClose,
  onSelect,
}: ProfileSidebarProps) {
  const { theme } = useTheme();

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View accessibilityViewIsModal style={[styles.overlay, { backgroundColor: theme.overlay }]}>
        <SafeAreaView
          edges={['top', 'bottom', 'left']}
          style={[styles.sidebar, { backgroundColor: theme.surface, ...theme.elevation.modal }]}
        >
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Text accessibilityRole="header" style={[textStyles.h3, { color: theme.textPrimary }]}>
              {strings.profile.sidebarTitle}
            </Text>
            <Pressable
              accessibilityLabel={strings.profile.closeSidebar}
              accessibilityRole="button"
              hitSlop={spacing.sm}
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                { backgroundColor: pressed ? theme.surfaceAlt : theme.surface },
              ]}
            >
              <Ionicons name="close" size={spacing.xl} color={theme.textPrimary} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.menu} showsVerticalScrollIndicator={false}>
            {items.map((item) => {
              const selected = item.id === selectedId;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => onSelect(item.id)}
                  style={({ pressed }) => [
                    styles.menuItem,
                    {
                      backgroundColor: selected || pressed ? theme.primarySoft : theme.surface,
                      borderColor: selected ? theme.primary : theme.borderControl,
                    },
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={spacing.xl}
                    color={selected ? theme.primary : theme.textSecondary}
                  />
                  <Text style={[textStyles.labelLarge, styles.menuLabel, { color: theme.textPrimary }]}>
                    {item.label}
                  </Text>
                  <Ionicons
                    name={selected ? 'checkmark-circle' : 'chevron-forward'}
                    size={spacing.xl}
                    color={selected ? theme.primary : theme.textMuted}
                  />
                </Pressable>
              );
            })}
          </ScrollView>
        </SafeAreaView>

        <Pressable
          accessibilityLabel={strings.profile.closeSidebar}
          accessibilityRole="button"
          onPress={onClose}
          style={styles.backdrop}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, flexDirection: 'row' },
  sidebar: { width: '82%' },
  backdrop: { flex: 1 },
  header: {
    minHeight: layout.minTouchTarget + spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: componentRadius.button,
  },
  menu: { gap: spacing.md, padding: spacing.lg },
  menuItem: {
    minHeight: layout.minTouchTarget + spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderRadius: componentRadius.card,
  },
  menuLabel: { flex: 1 },
});
