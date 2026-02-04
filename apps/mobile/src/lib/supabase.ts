import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// Custom storage adapter for Expo SecureStore
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    SecureStore.deleteItemAsync(key);
  },
};

// Get Supabase URL and key from config or environment
const getSupabaseConfig = () => {
  const configUrl = Constants.expoConfig?.extra?.supabaseUrl;
  const configKey = Constants.expoConfig?.extra?.supabaseAnonKey;

  if (configUrl && configKey) {
    return { url: configUrl, key: configKey };
  }

  // Fallback to environment variables (for development)
  return {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
    key: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  };
};

const { url, key } = getSupabaseConfig();

if (!url || !key) {
  console.warn('Supabase URL and Anon Key must be configured');
}

export const supabase = createClient(url, key, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
  },
});
