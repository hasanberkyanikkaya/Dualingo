import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import Button from '@/components/Button';
import ScreenHeader from '@/components/ScreenHeader';
import { componentRadius } from '@/constants/radius';
import { layout, spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import { requestSync, useSyncStore } from '@/features/sync/syncEngine';
import { useTheme } from '@/lib/useTheme';

import { useAccountStore } from '../store';

type FormMode = 'signIn' | 'signUp';

function syncLabel(status: ReturnType<typeof useSyncStore.getState>['status']): string {
  switch (status) {
    case 'syncing': return strings.account.syncRunning;
    case 'offline': return strings.account.syncOffline;
    case 'error': return strings.account.syncError;
    case 'disabled': return strings.account.syncDisabled;
    default: return strings.account.syncIdle;
  }
}

export default function AccountManager() {
  const { theme } = useTheme();
  const account = useAccountStore();
  const sync = useSyncStore();
  const [mode, setMode] = useState<FormMode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function submit(): Promise<void> {
    setNotice(null);
    account.clearError();
    if (!email.includes('@')) { setNotice(strings.account.invalidEmail); return; }
    if (password.length < 8) { setNotice(strings.account.weakPassword); return; }
    setBusy(true);
    const success = mode === 'signIn'
      ? await account.signIn(email, password)
      : await account.signUp(email, password);
    setBusy(false);
    if (success && mode === 'signUp') setNotice(strings.account.verificationSent);
    if (success && mode === 'signIn') await requestSync();
  }

  async function resetPassword(): Promise<void> {
    if (!email.includes('@')) { setNotice(strings.account.invalidEmail); return; }
    setBusy(true);
    const success = await account.sendPasswordReset(email);
    setBusy(false);
    if (success) setNotice(strings.account.resetSent);
  }

  async function updatePassword(): Promise<void> {
    if (password.length < 8) { setNotice(strings.account.weakPassword); return; }
    setBusy(true);
    const success = await account.updatePassword(password);
    setBusy(false);
    if (success) {
      setPassword('');
      setNotice(strings.account.passwordUpdated);
    }
  }

  function confirmSignOut(): void {
    Alert.alert(strings.account.signOutTitle, strings.account.signOutBody, [
      { text: strings.common.cancel, style: 'cancel' },
      { text: strings.account.signOut, style: 'destructive', onPress: () => void account.signOut() },
    ]);
  }

  function confirmDelete(): void {
    Alert.alert(strings.account.deleteTitle, strings.account.deleteBody, [
      { text: strings.common.cancel, style: 'cancel' },
      { text: strings.account.deleteConfirm, style: 'destructive', onPress: () => void account.deleteAccount() },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Button label={strings.common.back} onPress={() => router.back()} variant="ghost" />
      <ScreenHeader title={strings.account.title} subtitle={strings.account.subtitle} />

      {notice !== null || account.error !== null ? (
        <Text accessibilityRole="alert" style={[textStyles.bodyMedium, { color: account.error === null ? theme.success : theme.error }]}>
          {account.error ?? notice}
        </Text>
      ) : null}

      {account.status === 'unconfigured' ? (
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderControl }]}>
          <Text style={[textStyles.h3, { color: theme.textPrimary }]}>{strings.account.unconfiguredTitle}</Text>
          <Text style={[textStyles.bodyMedium, { color: theme.textSecondary }]}>{strings.account.unconfiguredBody}</Text>
        </View>
      ) : null}

      {account.status === 'signedIn' ? (
        <>
          {account.recoveryMode ? (
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderControl }]}>
              <Text style={[textStyles.h3, { color: theme.textPrimary }]}>{strings.account.newPasswordLabel}</Text>
              <TextInput
                accessibilityLabel={strings.account.newPasswordLabel}
                autoCapitalize="none"
                autoComplete="new-password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                placeholder={strings.account.passwordPlaceholder}
                placeholderTextColor={theme.textMuted}
                style={[styles.input, textStyles.bodyLarge, { color: theme.textPrimary, borderColor: theme.borderControl, backgroundColor: theme.surface }]}
              />
              <Button label={strings.account.updatePassword} onPress={() => void updatePassword()} loading={busy} fullWidth />
            </View>
          ) : null}
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderControl }]}>
            <Text style={[textStyles.labelLarge, { color: theme.textSecondary }]}>{strings.account.signedInAs}</Text>
            <Text style={[textStyles.bodyLarge, { color: theme.textPrimary }]}>{account.user?.email ?? ''}</Text>
          </View>
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderControl }]}>
            <Text style={[textStyles.h3, { color: theme.textPrimary }]}>{strings.account.syncTitle}</Text>
            <Text style={[textStyles.bodyMedium, { color: theme.textSecondary }]}>{syncLabel(sync.status)}</Text>
            <Button label={strings.account.syncNow} onPress={() => void requestSync()} loading={sync.status === 'syncing'} />
          </View>
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderControl }]}>
            <View style={styles.switchRow}>
              <View style={styles.switchText}>
                <Text style={[textStyles.h3, { color: theme.textPrimary }]}>{strings.account.prayerSyncTitle}</Text>
                <Text style={[textStyles.bodyMedium, { color: theme.textSecondary }]}>{strings.account.prayerSyncBody}</Text>
              </View>
              <Switch
                accessibilityLabel={strings.account.prayerSyncTitle}
                value={account.prayerSyncEnabled}
                onValueChange={(enabled) => {
                  account.setPrayerConsent(enabled);
                  if (enabled) void requestSync();
                }}
                trackColor={{ false: theme.disabledBackground, true: theme.primarySoft }}
                thumbColor={account.prayerSyncEnabled ? theme.primary : theme.textMuted}
              />
            </View>
            <Text style={[textStyles.labelSmall, { color: theme.textMuted }]}>{strings.account.prayerSyncPrivacy}</Text>
          </View>
          <View style={styles.actions}>
            <Button label={strings.account.signOut} onPress={confirmSignOut} variant="secondary" fullWidth />
            <Button label={strings.account.deleteAccount} onPress={confirmDelete} variant="ghost" fullWidth />
          </View>
        </>
      ) : null}

      {account.status === 'signedOut' || account.status === 'loading' ? (
        <View style={styles.form}>
          <Text style={[textStyles.labelLarge, { color: theme.textPrimary }]}>{strings.account.emailLabel}</Text>
          <TextInput
            accessibilityLabel={strings.account.emailLabel}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholder={strings.account.emailPlaceholder}
            placeholderTextColor={theme.textMuted}
            style={[styles.input, textStyles.bodyLarge, { color: theme.textPrimary, borderColor: theme.borderControl, backgroundColor: theme.surface }]}
          />
          <Text style={[textStyles.labelLarge, { color: theme.textPrimary }]}>{strings.account.passwordLabel}</Text>
          <TextInput
            accessibilityLabel={strings.account.passwordLabel}
            autoCapitalize="none"
            autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholder={strings.account.passwordPlaceholder}
            placeholderTextColor={theme.textMuted}
            style={[styles.input, textStyles.bodyLarge, { color: theme.textPrimary, borderColor: theme.borderControl, backgroundColor: theme.surface }]}
          />
          <Button label={mode === 'signIn' ? strings.account.signIn : strings.account.signUp} onPress={() => void submit()} loading={busy} fullWidth />
          {mode === 'signIn' ? <Button label={strings.account.forgotPassword} onPress={() => void resetPassword()} variant="ghost" fullWidth /> : null}
          <Button
            label={mode === 'signIn' ? strings.account.switchToSignUp : strings.account.switchToSignIn}
            onPress={() => setMode((current) => (current === 'signIn' ? 'signUp' : 'signIn'))}
            variant="secondary"
            fullWidth
          />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: layout.sectionGap, paddingBottom: spacing.xxxl },
  card: { borderWidth: 1, borderRadius: componentRadius.card, padding: layout.cardPadding, gap: spacing.md },
  form: { gap: spacing.md },
  input: { minHeight: layout.minTouchTarget, borderWidth: 1, borderRadius: componentRadius.input, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  switchText: { flex: 1, gap: spacing.xs },
  actions: { gap: spacing.md },
});
