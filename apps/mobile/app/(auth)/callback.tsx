import { useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, ActivityIndicator, Text } from 'react-native';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/store/authStore';

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const setSession = useAuthStore(s => s.setSession);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the URL fragments from the callback
        const { access_token, refresh_token, error, error_description, url } = params;

        if (error) {
          console.error('OAuth error:', error, error_description);
          router.replace('/(auth)/login');
          return;
        }

        let accessToken: string | null = null;
        let refreshToken: string | null = null;

        // Try to get tokens from direct params first
        if (access_token && refresh_token) {
          accessToken = access_token as string;
          refreshToken = refresh_token as string;
        } else if (url) {
          // Parse tokens from the callback URL (from WebBrowser redirect)
          try {
            const callbackUrl = url as string;
            const parsedUrl = new URL(callbackUrl);
            
            // Check hash fragment first (common for OAuth redirects)
            if (parsedUrl.hash) {
              const hash = parsedUrl.hash.substring(1);
              const hashParams = new URLSearchParams(hash);
              accessToken = hashParams.get('access_token');
              refreshToken = hashParams.get('refresh_token');
            }
            
            // If not in hash, check query params
            if (!accessToken || !refreshToken) {
              accessToken = parsedUrl.searchParams.get('access_token');
              refreshToken = parsedUrl.searchParams.get('refresh_token');
            }
          } catch (urlError) {
            console.error('Error parsing callback URL:', urlError);
          }
        }

        if (accessToken && refreshToken) {
          // Set the session with the tokens
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            console.error('Session error:', sessionError);
            router.replace('/(auth)/login');
            return;
          }

          if (data.session) {
            setSession(data.session);
            router.replace('/(tabs)');
          } else {
            console.error('No session returned after setting tokens');
            router.replace('/(auth)/login');
          }
        } else {
          console.error('No access token or refresh token found in callback');
          router.replace('/(auth)/login');
        }
      } catch (error) {
        console.error('Callback error:', error);
        router.replace('/(auth)/login');
      }
    };

    handleCallback();
  }, [params, router, setSession]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
      <Text style={{ marginTop: 16 }}>Completing sign in...</Text>
    </View>
  );
}
