import type { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { create } from 'zustand';

import {
  activateCloudOwner,
  hasPrayerSyncConsent,
  purgeActiveCloudOwnerFromDevice,
  setPrayerSyncConsent,
} from '@/features/sync/localSyncDb';
import { reloadProgressForActiveOwner } from '@/features/progress/store';
import strings from '@/constants/strings';

import { getSupabaseClient, isSupabaseConfigured } from './supabase';

type AuthStatus = 'unconfigured' | 'loading' | 'signedOut' | 'signedIn';

type AccountState = {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  error: string | null;
  recoveryMode: boolean;
  prayerSyncEnabled: boolean;
  initialize: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  sendPasswordReset: (email: string) => Promise<boolean>;
  updatePassword: (password: string) => Promise<boolean>;
  signOut: () => Promise<boolean>;
  deleteAccount: () => Promise<boolean>;
  setPrayerConsent: (enabled: boolean) => void;
  clearError: () => void;
};

let initialized = false;

function activateSession(session: Session | null): void {
  if (session?.user.id === undefined) {
    return;
  }
  activateCloudOwner(session.user.id);
  void reloadProgressForActiveOwner();
}

export const useAccountStore = create<AccountState>((set, get) => ({
  status: isSupabaseConfigured() ? 'loading' : 'unconfigured',
  session: null,
  user: null,
  error: null,
  recoveryMode: false,
  prayerSyncEnabled: false,

  initialize: async () => {
    if (initialized || !isSupabaseConfigured()) {
      return;
    }
    initialized = true;
    const client = getSupabaseClient();
    if (client === null) {
      set({ status: 'unconfigured' });
      return;
    }

    const { data, error } = await client.auth.getSession();
    if (error !== null) {
      set({ status: 'signedOut', error: strings.account.authError });
    } else {
      activateSession(data.session);
      set({
        status: data.session === null ? 'signedOut' : 'signedIn',
        session: data.session,
        user: data.session?.user ?? null,
        prayerSyncEnabled: data.session === null ? false : hasPrayerSyncConsent(),
      });
    }

    client.auth.onAuthStateChange((event, session) => {
      activateSession(session);
      set({
        status: session === null ? 'signedOut' : 'signedIn',
        session,
        user: session?.user ?? null,
        prayerSyncEnabled: session === null ? false : hasPrayerSyncConsent(),
        recoveryMode: event === 'PASSWORD_RECOVERY' ? true : session === null ? false : get().recoveryMode,
      });
    });
  },

  signUp: async (email, password) => {
    const client = getSupabaseClient();
    if (client === null) {
      set({ error: strings.account.notConfigured });
      return false;
    }
    set({ error: null });
    const redirectTo = Linking.createURL('/account/callback');
    const { error } = await client.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: redirectTo } });
    if (error !== null) {
      set({ error: strings.account.authError });
      return false;
    }
    return true;
  },

  signIn: async (email, password) => {
    const client = getSupabaseClient();
    if (client === null) {
      set({ error: strings.account.notConfigured });
      return false;
    }
    set({ error: null });
    const { error } = await client.auth.signInWithPassword({ email: email.trim(), password });
    if (error !== null) {
      set({ error: strings.account.authError });
      return false;
    }
    return true;
  },

  sendPasswordReset: async (email) => {
    const client = getSupabaseClient();
    if (client === null) {
      set({ error: strings.account.notConfigured });
      return false;
    }
    const redirectTo = Linking.createURL('/account/callback');
    const { error } = await client.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    if (error !== null) {
      set({ error: strings.account.authError });
      return false;
    }
    set({ error: null });
    return true;
  },

  updatePassword: async (password) => {
    const client = getSupabaseClient();
    if (client === null || get().session === null) {
      return false;
    }
    const { error } = await client.auth.updateUser({ password });
    if (error !== null) {
      set({ error: strings.account.authError });
      return false;
    }
    set({ error: null, recoveryMode: false });
    return true;
  },

  signOut: async () => {
    const client = getSupabaseClient();
    if (client === null) {
      return false;
    }
    const { error } = await client.auth.signOut();
    if (error !== null) {
      set({ error: strings.account.authError });
      return false;
    }
    purgeActiveCloudOwnerFromDevice();
    await reloadProgressForActiveOwner();
    set({ status: 'signedOut', session: null, user: null, prayerSyncEnabled: false, recoveryMode: false });
    return true;
  },

  deleteAccount: async () => {
    const client = getSupabaseClient();
    if (client === null || get().session === null) {
      return false;
    }
    const { error } = await client.functions.invoke('delete-account', { method: 'POST' });
    if (error !== null) {
      set({ error: strings.account.authError });
      return false;
    }
    await client.auth.signOut({ scope: 'local' });
    purgeActiveCloudOwnerFromDevice();
    await reloadProgressForActiveOwner();
    set({ status: 'signedOut', session: null, user: null, prayerSyncEnabled: false, recoveryMode: false });
    return true;
  },

  setPrayerConsent: (enabled) => {
    setPrayerSyncConsent(enabled);
    set({ prayerSyncEnabled: enabled });
  },

  clearError: () => set({ error: null }),
}));

export async function handleAuthCallback(url: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (client === null) {
    return false;
  }
  const parsed = Linking.parse(url);
  const code = typeof parsed.queryParams?.code === 'string' ? parsed.queryParams.code : null;
  if (code === null) {
    return false;
  }
  const { error } = await client.auth.exchangeCodeForSession(code);
  if (error !== null) {
    useAccountStore.setState({ status: 'signedOut', error: strings.account.authError });
    return false;
  }
  return true;
}
