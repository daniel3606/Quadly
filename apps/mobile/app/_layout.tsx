import { Stack, useRouter, useSegments, useNavigationContainerRef } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
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
  const navigationRef = useNavigationContainerRef();
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  useEffect(() => {
    if (navigationRef?.isReady()) {
      setIsNavigationReady(true);
    }
  });

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
    if (!isInitialized || !isNavigationReady) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isInitialized, session, isNavigationReady]);

  // Show loading screen until auth is initialized - prevents premature
  // rendering of tab screens that make authenticated API calls
  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
        <ActivityIndicator size="large" color="#00274C" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
