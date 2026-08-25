import 'react-native-url-polyfill/auto';

import { createClient, processLock, type SupabaseClient } from '@supabase/supabase-js';

import { secureSessionStorage } from './secureSessionStorage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '';
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? '';

let cachedClient: SupabaseClient | null | undefined;

export function isSupabaseConfigured(): boolean {
  return supabaseUrl.startsWith('https://') && publishableKey.length > 0;
}

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient !== undefined) {
    return cachedClient;
  }
  if (!isSupabaseConfigured()) {
    cachedClient = null;
    return null;
  }

  cachedClient = createClient(supabaseUrl, publishableKey, {
    auth: {
      storage: secureSessionStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: 'pkce',
      lock: processLock,
    },
  });
  return cachedClient;
}

