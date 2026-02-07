import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Get Supabase credentials from Expo config
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || 'https://waahgmnfykmrlxuvxerw.supabase.co';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || '';

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseAnonKey);

// Create a dummy client if no key is available (for testing UI without backend)
let supabase: SupabaseClient;

if (supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: 'implicit',
    },
  });
} else {
  // Create with a placeholder - auth calls will fail but app won't crash
  console.warn('No Supabase anon key found - auth will not work');
  supabase = createClient(supabaseUrl, 'placeholder-key', {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

export { supabase };
