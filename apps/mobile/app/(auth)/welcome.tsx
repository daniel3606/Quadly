import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { supabase } from '../../src/lib/supabase';

// Ensure WebBrowser auth session completes properly
WebBrowser.maybeCompleteAuthSession();

// Get API URL - prefer quadly.org in production, fallback to IP for development
const getApiUrl = () => {
  const configUrl = Constants.expoConfig?.extra?.apiUrl;
  if (configUrl) return configUrl;

  // In production, use quadly.org domain
  const isProduction = __DEV__ === false;
  if (isProduction) {
    return 'https://quadly.org/api';
  }

  // For development, use the Expo host IP
  const debuggerHost = Constants.expoConfig?.hostUri?.split(':')[0];
  if (debuggerHost) {
    return `http://${debuggerHost}:8000/api`;
  }

  return 'http://localhost:8000/api';
};

const API_URL = getApiUrl();
console.log('Welcome Screen API URL:', API_URL);

// Fetch with timeout helper
const fetchWithTimeout = async (url: string, timeout = 8000): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
};

interface University {
  id: string;
  name: string;
  short_name: string;
  domain: string;
  logo_url: string;
  color: string;
}

// Mock universities for when API is unavailable
const MOCK_UNIVERSITIES: University[] = [
  {
    id: 'UMICH',
    name: 'University of Michigan',
    short_name: 'UMich',
    domain: 'umich.edu',
    logo_url: '',
    color: '#00274C',
  },
  {
    id: 'MSU',
    name: 'Michigan State University',
    short_name: 'MSU',
    domain: 'msu.edu',
    logo_url: '',
    color: '#18453B',
  },
  {
    id: 'OSU',
    name: 'Ohio State University',
    short_name: 'OSU',
    domain: 'osu.edu',
    logo_url: '',
    color: '#BB0000',
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const { setToken, fetchUser } = useAuthStore();
  const [universities, setUniversities] = useState<University[]>([]);
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingUniversities, setLoadingUniversities] = useState(true);

  useEffect(() => {
    fetchUniversities();
  }, []);

  const fetchUniversities = async () => {
    console.log('Fetching universities from:', `${API_URL}/auth/universities`);
    try {
      const response = await fetchWithTimeout(`${API_URL}/auth/universities`, 8000);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('Universities fetched:', data.universities?.length);

      if (data.universities && data.universities.length > 0) {
        setUniversities(data.universities);
        setSelectedUniversity(data.universities[0]);
      } else {
        throw new Error('No universities returned');
      }
    } catch (error: any) {
      console.log('Failed to fetch universities:', error.message);
      console.log('Using mock data');
      // Use mock data if API fails
      setUniversities(MOCK_UNIVERSITIES);
      setSelectedUniversity(MOCK_UNIVERSITIES[0]);
    } finally {
      setLoadingUniversities(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!selectedUniversity) {
      Alert.alert('Select School', 'Please select your school before signing in.');
      return;
    }

    setIsLoading(true);
    try {
      // Create the redirect URL that works with Expo Go
      const redirectUri = Linking.createURL('auth/callback');
      console.log('Redirect URI:', redirectUri);

      // Use Supabase OAuth for Google sign-in
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('Supabase OAuth error:', error);
        Alert.alert('Sign In Failed', error.message || 'Unable to sign in. Please try again.');
        setIsLoading(false);
        return;
      }

      if (data?.url) {
        // Open the OAuth URL in browser
        // The deep link handler in _layout.tsx will handle the callback
        await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUri
        );
      }
    } catch (error: any) {
      console.error('Google sign in error:', error);
      Alert.alert('Sign In Failed', error.message || 'Unable to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Logo Section */}
      <View style={styles.logoSection}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>Q</Text>
        </View>
        <Text style={styles.title}>Quadly</Text>
        <Text style={styles.subtitle}>The best college community application</Text>
      </View>

      {/* School Selection */}
      <View style={styles.schoolSection}>
        <Text style={styles.sectionLabel}>Select Your School</Text>
        {loadingUniversities ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#00274C" />
            <Text style={styles.loadingText}>Loading schools...</Text>
          </View>
        ) : (
          <View style={styles.schoolList}>
            {universities.map((uni) => (
              <TouchableOpacity
                key={uni.id}
                style={[
                  styles.schoolItem,
                  selectedUniversity?.id === uni.id && styles.schoolItemSelected,
                  { borderColor: selectedUniversity?.id === uni.id ? uni.color : '#e0e0e0' },
                ]}
                onPress={() => setSelectedUniversity(uni)}
              >
                <View style={[styles.schoolLogo, { backgroundColor: uni.color }]}>
                  <Text style={styles.schoolLogoText}>{uni.short_name.charAt(0)}</Text>
                </View>
                <View style={styles.schoolInfo}>
                  <Text style={styles.schoolName}>{uni.short_name}</Text>
                  <Text style={styles.schoolFullName}>{uni.name}</Text>
                </View>
                {selectedUniversity?.id === uni.id && (
                  <View style={[styles.checkmark, { backgroundColor: uni.color }]}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Sign In Button */}
      <View style={styles.authSection}>
        <TouchableOpacity
          style={[styles.googleButton, isLoading && styles.buttonDisabled]}
          onPress={handleGoogleSignIn}
          disabled={isLoading || !selectedUniversity}
        >
          {isLoading ? (
            <ActivityIndicator color="#333" />
          ) : (
            <>
              <View style={styles.googleIcon}>
                <Text style={styles.googleIconText}>G</Text>
              </View>
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Dev Mode - Skip Login */}
      <TouchableOpacity
        style={styles.skipButton}
        onPress={() => router.push('/(auth)/onboarding')}
      >
        <Text style={styles.skipButtonText}>Skip for Preview</Text>
      </TouchableOpacity>

      {/* Footer */}
      <Text style={styles.footerText}>
        By continuing, you agree to our Terms of Service and Privacy Policy
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    backgroundColor: '#00274C',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00274C',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  schoolSection: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666666',
  },
  schoolList: {
    gap: 10,
  },
  schoolItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  schoolItemSelected: {
    backgroundColor: '#f8f9fa',
  },
  schoolLogo: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  schoolLogoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  schoolInfo: {
    flex: 1,
    marginLeft: 12,
  },
  schoolName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  schoolFullName: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  authSection: {
    marginBottom: 24,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  googleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4285f4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  googleIconText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  footerText: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 18,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 16,
  },
  skipButtonText: {
    fontSize: 14,
    color: '#666666',
    textDecorationLine: 'underline',
  },
});
