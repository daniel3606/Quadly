import { useEffect } from 'react';
import { Stack, useRouter, useSegments, usePathname } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import * as Linking from 'expo-linking';
import { useAuthStore } from '../src/store/authStore';
import { supabase } from '../src/lib/supabase';

function useProtectedRoute() {
  const { token, user, isLoading, isInitialized, initialize, setToken, fetchUser } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const pathname = usePathname();

  // Handle deep links for Supabase OAuth callback
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const { url } = event;
      console.log('Deep link received:', url);

      if (url.includes('auth/callback')) {
        try {
          // Supabase OAuth uses hash fragments (#access_token=...)
          // Extract hash from URL
          const hashMatch = url.match(/#(.+)/);
          if (hashMatch) {
            const hash = hashMatch[1];
            const params = new URLSearchParams(hash);
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');

            if (accessToken && refreshToken) {
              console.log('Supabase tokens found in callback');
              // Set session in Supabase
              const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });

              if (sessionError) {
                console.error('Session error:', sessionError);
                return;
              }

              if (sessionData.session) {
                // Get user and validate email domain
                const { data: { user } } = await supabase.auth.getUser();
                
                if (user && user.email?.endsWith('@umich.edu')) {
                  await setToken(sessionData.session.access_token);
                  await fetchUser();
                } else if (user) {
                  // Invalid email domain
                  await supabase.auth.signOut();
                  console.log('Invalid email domain');
                }
              }
            }
          }
        } catch (e) {
          console.log('Error processing auth callback:', e);
        }
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check initial URL
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => subscription.remove();
  }, [setToken, fetchUser]);

  // Initialize auth state
  useEffect(() => {
    console.log('Calling initialize...');
    initialize();
  }, [initialize]);

  // Handle navigation based on auth state
  useEffect(() => {
    if (!isInitialized) {
      console.log('Not initialized yet, waiting...');
      return;
    }

    console.log('Navigation check - token:', !!token, 'user:', !!user, 'segments:', segments);

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const inBoardsGroup = segments[0] === 'boards';

    // Small delay to ensure navigation is ready
    const timer = setTimeout(() => {
      // If not authenticated and not in auth group, go to welcome
      if (!token && !inAuthGroup) {
        console.log('No token, redirecting to welcome');
        router.replace('/(auth)/welcome');
      }
      // If authenticated with user data
      else if (token && user) {
        // If onboarding not completed, go to onboarding
        if (!user.onboarding_completed && pathname !== '/(auth)/onboarding') {
          console.log('Onboarding not complete, redirecting to onboarding');
          router.replace('/(auth)/onboarding');
        }
        // If onboarding complete and not in tabs/boards, go to tabs
        else if (user.onboarding_completed && !inTabsGroup && !inBoardsGroup && !inAuthGroup) {
          console.log('Redirecting to tabs');
          router.replace('/(tabs)');
        }
      }
      // If we have token but no user (failed to fetch), stay on current screen
      // This allows the welcome screen to handle re-auth
    }, 100);

    return () => clearTimeout(timer);
  }, [token, user, isInitialized, segments, pathname, router]);

  return { isLoading, isInitialized };
}

export default function RootLayout() {
  const { isLoading, isInitialized } = useProtectedRoute();

  // Show loading screen while initializing
  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00274C" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="boards" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});
