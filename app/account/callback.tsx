import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Screen from '@/components/Screen';
import ScreenHeader from '@/components/ScreenHeader';
import { spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import { useAccountStore } from '@/features/account/store';
import { useTheme } from '@/lib/useTheme';

export default function AccountCallbackScreen() {
  const { theme } = useTheme();
  const status = useAccountStore((state) => state.status);
  const error = useAccountStore((state) => state.error);
  useEffect(() => {
    if (status === 'signedIn' || (status === 'signedOut' && error !== null)) {
      router.replace('/account');
    }
  }, [error, status]);
  return (
    <Screen>
      <View style={styles.root}>
        <ScreenHeader title={strings.account.callbackTitle} subtitle={strings.account.callbackBody} />
        <Text style={[textStyles.bodyMedium, { color: theme.textSecondary }]}>{strings.common.loading}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({ root: { gap: spacing.lg } });
