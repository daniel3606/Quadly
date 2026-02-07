import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { useAuthStore } from '../src/store/authStore';
import { supabase } from '../src/lib/supabase';

export default function RootLayout() {
  const initialize = useAuthStore(s => s.initialize);
  const session = useAuthStore(s => s.session);
  const isInitialized = useAuthStore(s => s.isInitialized);
  const setSession = useAuthStore(s => s.setSession);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    initialize();
  }, []);

  // Handle incoming deep link URLs (cold-start scenario)
  // If the app restarts from an OAuth redirect, this picks up the tokens from the URL
  const url = Linking.useURL();
  useEffect(() => {
    if (!url) return;

    const handleUrl = async () => {
      try {
        console.log('[Auth] Incoming deep link URL:', url);
        const { params, errorCode } = QueryParams.getQueryParams(url);

        if (errorCode) {
          console.error('[Auth] Deep link error code:', errorCode);
          return;
        }

        const { access_token, refresh_token } = params;
        if (access_token && refresh_token) {
          console.log('[Auth] Found tokens in deep link, setting session');
          const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (error) {
            console.error('[Auth] setSession from deep link error:', error.message);
            return;
          }
          if (data.session) {
            setSession(data.session);
          }
        }
      } catch (e: any) {
        console.error('[Auth] Deep link handling error:', e?.message ?? e);
      }
    };

    handleUrl();
  }, [url]);

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isInitialized, session]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
