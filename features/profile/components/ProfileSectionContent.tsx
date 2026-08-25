import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import Button from '@/components/Button';
import { componentRadius } from '@/constants/radius';
import { spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import ProfileOverview from '@/features/profile/components/ProfileOverview';
import BadgeSection from '@/features/progress/components/BadgeSection';
import { useTheme } from '@/lib/useTheme';

import type { ProfileSectionId } from '@/features/profile/types';

type ProfileSectionContentProps = { sectionId: ProfileSectionId };
type ManageableSection = Exclude<ProfileSectionId, 'overview' | 'badges'>;

const sectionCopy: Record<ManageableSection, { title: string; body: string; action: string }> = {
  placement: {
    title: strings.profile.placementTitle,
    body: strings.profile.placementBody,
    action: strings.profile.placementAction,
  },
  notifications: {
    title: strings.profile.prayerNotificationsTitle,
    body: strings.profile.prayerNotificationsBody,
    action: strings.profile.prayerNotificationsAction,
  },
  account: {
    title: strings.profile.accountTitle,
    body: strings.profile.accountBody,
    action: strings.profile.accountAction,
  },
};

function openSection(sectionId: ManageableSection): void {
  if (sectionId === 'placement') {
    router.push({ pathname: '/placement', params: { retake: '1' } });
    return;
  }
  router.push(sectionId === 'notifications' ? '/prayer/notifications' : '/account');
}

export default function ProfileSectionContent({ sectionId }: ProfileSectionContentProps) {
  const { theme } = useTheme();

  if (sectionId === 'overview') {
    return <ProfileOverview />;
  }

  if (sectionId === 'badges') {
    return <BadgeSection />;
  }

  const copy = sectionCopy[sectionId];
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.borderControl,
          ...theme.elevation.card,
        },
      ]}
    >
      <Text accessibilityRole="header" style={[textStyles.h3, { color: theme.textPrimary }]}>
        {copy.title}
      </Text>
      <Text style={[textStyles.bodyMedium, { color: theme.textSecondary }]}>{copy.body}</Text>
      <Button label={copy.action} onPress={() => openSection(sectionId)} variant="secondary" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'flex-start',
    gap: spacing.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderRadius: componentRadius.card,
  },
});
