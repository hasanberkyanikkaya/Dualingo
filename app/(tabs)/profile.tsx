import Screen from '@/components/Screen';
import ProfileBackground from '@/features/profile/components/ProfileBackground';
import ProfileHub from '@/features/profile/components/ProfileHub';

export default function ProfileScreen() {
  return (
    <Screen background={<ProfileBackground />} tabPane>
      <ProfileHub />
    </Screen>
  );
}
