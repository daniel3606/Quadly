import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '../src/store/authStore';

function useProtectedRoute() {
  const { session, isLoading, isInitialized, initialize } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // Initialize auth state on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Handle navigation based on auth state
  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';

    // Small delay to ensure navigation is ready
    const timer = setTimeout(() => {
      if (!session && !inAuthGroup) {
        // Not authenticated, redirect to login
        router.replace('/(auth)/login');
      } else if (session && inAuthGroup) {
        // Authenticated, redirect to tabs
        router.replace('/(tabs)');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [session, isInitialized, segments, router]);

  return { isLoading, isInitialized };
}

export default function RootLayout() {
  const { isInitialized } = useProtectedRoute();

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
