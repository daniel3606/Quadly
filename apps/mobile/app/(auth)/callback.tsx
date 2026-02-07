import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, ActivityIndicator, Text } from 'react-native';
import * as Linking from 'expo-linking';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/store/authStore';

function parseParamsFromUrl(url: string | null) {
  let code: string | undefined;
  let accessToken: string | undefined;
  let refreshToken: string | undefined;

  if (!url) return { code, accessToken, refreshToken };

  const qIndex = url.indexOf('?');
  const hIndex = url.indexOf('#');

  const queryString =
    qIndex >= 0 ? url.substring(qIndex + 1, hIndex >= 0 ? hIndex : undefined) : '';
  const hashString = hIndex >= 0 ? url.substring(hIndex + 1) : '';

  if (queryString) {
    const q = new URLSearchParams(queryString);
    code = q.get('code') || undefined;
  }

  if (hashString) {
    const h = new URLSearchParams(hashString);
    accessToken = h.get('access_token') || undefined;
    refreshToken = h.get('refresh_token') || undefined;
  }

  return { code, accessToken, refreshToken };
}

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const setSession = useAuthStore(s => s.setSession);

  const [initialUrl, setInitialUrl] = useState<string | null>(null);

  const lastHandledKeyRef = useRef<string>('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const url = await Linking.getInitialURL();
        if (!mounted) return;
        setInitialUrl(url);
        console.log('[Auth Callback] Initial URL:', url);
      } catch (e: any) {
        console.warn('[Auth Callback] Linking.getInitialURL error:', e?.message ?? e);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const paramsKey = useMemo(() => JSON.stringify(params ?? {}), [params]);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('[Auth Callback] Params received:', paramsKey);

        const parsed = parseParamsFromUrl(initialUrl);

        const code =
          parsed.code ?? (params.code as string | undefined) ?? undefined;

        const accessToken =
          parsed.accessToken ?? (params.access_token as string | undefined) ?? undefined;

        const refreshToken =
          parsed.refreshToken ?? (params.refresh_token as string | undefined) ?? undefined;

        const handledKey = [
          initialUrl ?? '',
          code ?? '',
          accessToken ?? '',
          refreshToken ?? '',
        ].join('|');

        if (handledKey === lastHandledKeyRef.current) {
          return;
        }

        if (!code && !(accessToken && refreshToken)) {
          if (!initialUrl && (!params || Object.keys(params).length === 0)) {
            console.log('[Auth Callback] Waiting for callback data...');
            return;
          }

          console.warn('[Auth Callback] No tokens or code found yet, waiting...');
          lastHandledKeyRef.current = handledKey;
          return;
        }

        lastHandledKeyRef.current = handledKey;

        if (accessToken && refreshToken) {
          console.log('[Auth Callback] Setting session with tokens');
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('[Auth Callback] setSession error:', error.message);
            router.replace('/(auth)/login');
            return;
          }

          if (data.session) {
            console.log('[Auth Callback] Session established via tokens');
            setSession(data.session);
            router.replace('/(tabs)');
            return;
          }
        }

        if (code) {
          console.log('[Auth Callback] Exchanging code for session');
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error('[Auth Callback] exchangeCode error:', error.message);
            router.replace('/(auth)/login');
            return;
          }

          if (data.session) {
            console.log('[Auth Callback] Session established via code exchange');
            setSession(data.session);
            router.replace('/(tabs)');
            return;
          }
        }

        console.warn('[Auth Callback] Callback handled but no session, returning to login');
        router.replace('/(auth)/login');
      } catch (error: any) {
        console.error('[Auth Callback] Error:', error?.message ?? error);
        router.replace('/(auth)/login');
      }
    };

    handleCallback();
  }, [paramsKey, initialUrl, router, setSession]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
      <Text style={{ marginTop: 16 }}>Completing sign in...</Text>
    </View>
  );
}