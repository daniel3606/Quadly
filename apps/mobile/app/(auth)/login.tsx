import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Modal,
  FlatList,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { makeRedirectUri } from 'expo-auth-session';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/store/authStore';

WebBrowser.maybeCompleteAuthSession();

// Supabase cloud does not support non-HTTPS redirect URLs (exp://, quadly://).
// Workaround: redirect to an HTTPS page on quadly.org that then redirects
// to the mobile app's deep link. ASWebAuthenticationSession intercepts
// the custom-scheme redirect before the browser navigates.
const nativeRedirect = makeRedirectUri(); // e.g. exp://10.0.0.128:8081 or quadly://
const schemeEnd = nativeRedirect.indexOf('://');
const mobileScheme = nativeRedirect.substring(0, schemeEnd); // 'exp' or 'quadly'
const mobileHost = nativeRedirect.substring(schemeEnd + 3); // '10.0.0.128:8081' or ''

// Tell Supabase to redirect to our HTTPS callback page, passing the mobile scheme info
const redirectTo = `https://quadly.org/auth/mobile-callback?mobile_scheme=${encodeURIComponent(mobileScheme)}&mobile_host=${encodeURIComponent(mobileHost)}`;
console.log('[Auth] Native redirect:', nativeRedirect);
console.log('[Auth] Supabase redirectTo:', redirectTo);

interface University {
  id: string;
  name: string;
  short_name: string | null;
  domain: string;
}

const SELECTED_UNIVERSITY_KEY = 'quadly_selected_university';

const createSessionFromUrl = async (url: string) => {
  const { params, errorCode } = QueryParams.getQueryParams(url);

  if (errorCode) {
    console.error('[Auth] OAuth error code:', errorCode);
    throw new Error(errorCode);
  }

  const { access_token, refresh_token } = params;
  console.log('[Auth] Tokens in URL:', { hasAccessToken: !!access_token, hasRefreshToken: !!refresh_token });

  if (!access_token) return null;

  const { data, error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });

  if (error) {
    console.error('[Auth] setSession error:', error.message);
    throw error;
  }

  console.log('[Auth] Session established:', !!data.session);
  return data.session;
};

export default function LoginScreen() {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [universities, setUniversities] = useState<University[]>([]);
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const setSession = useAuthStore(s => s.setSession);

  useEffect(() => {
    fetchUniversities();
  }, []);

  const fetchUniversities = async () => {
    const { data, error } = await supabase
      .from('universities')
      .select('id, name, short_name, domain')
      .eq('enabled', true)
      .order('name');

    if (data && !error) {
      setUniversities(data);
      try {
        const savedId = await AsyncStorage.getItem(SELECTED_UNIVERSITY_KEY);
        if (savedId) {
          const saved = data.find((u: University) => u.id === savedId);
          if (saved) setSelectedUniversity(saved);
        }
      } catch {}
    }
  };

  const handleSelectUniversity = async (university: University) => {
    setSelectedUniversity(university);
    setShowPicker(false);
    try {
      await AsyncStorage.setItem(SELECTED_UNIVERSITY_KEY, university.id);
    } catch {}
  };

  const handleGoogleLogin = async () => {
    if (!selectedUniversity) {
      Alert.alert('Select School', 'Please select your university first.');
      return;
    }

    if (isGoogleLoading) return;
    setIsGoogleLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error('No OAuth URL returned from Supabase');

      console.log('[Auth] OAuth URL:', data.url);
      console.log('[Auth] Opening browser, listening for scheme:', nativeRedirect);

      // Listen for the NATIVE scheme (exp:// or quadly://), not the HTTPS redirect.
      // The web page at quadly.org/auth/mobile-callback will redirect to this scheme.
      const res = await WebBrowser.openAuthSessionAsync(data.url, nativeRedirect);

      console.log('[Auth] Browser result:', res.type);

      if (res.type === 'success' && res.url) {
        console.log('[Auth] Callback URL:', res.url);
        const session = await createSessionFromUrl(res.url);
        if (session) {
          // Validate email domain matches selected university
          const email = session.user.email ?? '';
          const expectedDomain = selectedUniversity.domain;
          if (!email.endsWith(`@${expectedDomain}`)) {
            await supabase.auth.signOut();
            Alert.alert(
              'Wrong Email',
              `Please use your @${expectedDomain} email to sign in.`
            );
            return;
          }

          // Store university info in user metadata
          await supabase.auth.updateUser({
            data: {
              school: selectedUniversity.name,
              university_id: selectedUniversity.id,
            },
          });

          // Re-fetch session so metadata is up to date
          const { data: { session: updatedSession } } = await supabase.auth.getSession();
          setSession(updatedSession);
        }
      }
    } catch (error: any) {
      console.error('Google Sign In Error:', error);
      Alert.alert('Google Sign In Failed', error.message || 'An error occurred during sign in');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.logoSection}>
          <Image
            source={require('../../assets/QuadlyIcon.jpg')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Quadly</Text>
          <Text style={styles.subtitle}>Sign in with your school email</Text>
        </View>

        <View style={styles.selectorContainer}>
          <Text style={styles.label}>Your School</Text>
          <TouchableOpacity
            style={[styles.schoolSelector, selectedUniversity && styles.schoolSelectorSelected]}
            onPress={() => setShowPicker(true)}
          >
            <Text
              style={[
                styles.schoolSelectorText,
                !selectedUniversity && styles.schoolSelectorPlaceholder,
              ]}
            >
              {selectedUniversity ? selectedUniversity.name : 'Select your university'}
            </Text>
            <Text style={styles.chevron}>&#x25BC;</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.googleButton,
            (isGoogleLoading || !selectedUniversity) && styles.buttonDisabled,
          ]}
          onPress={handleGoogleLogin}
          disabled={isGoogleLoading || !selectedUniversity}
        >
          {isGoogleLoading ? (
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

        {selectedUniversity && (
          <Text style={styles.domainNote}>
            Use your @{selectedUniversity.domain} email to sign in
          </Text>
        )}
      </ScrollView>

      <Modal
        visible={showPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPicker(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Your School</Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Text style={styles.modalClose}>Done</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={universities}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.universityItem,
                    selectedUniversity?.id === item.id && styles.universityItemSelected,
                  ]}
                  onPress={() => handleSelectUniversity(item)}
                >
                  <View>
                    <Text
                      style={[
                        styles.universityName,
                        selectedUniversity?.id === item.id && styles.universityNameSelected,
                      ]}
                    >
                      {item.name}
                    </Text>
                    <Text style={styles.universityDomain}>@{item.domain}</Text>
                  </View>
                  {selectedUniversity?.id === item.id && (
                    <Text style={styles.checkmark}>&#x2713;</Text>
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyList}>
                  <ActivityIndicator color="#00274C" />
                  <Text style={styles.emptyText}>Loading schools...</Text>
                </View>
              }
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 100,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00274C',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginTop: 4,
  },
  selectorContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  schoolSelector: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  schoolSelectorSelected: {
    borderColor: '#00274C',
    backgroundColor: '#f8faff',
  },
  schoolSelectorText: {
    fontSize: 16,
    color: '#1a1a1a',
    flex: 1,
  },
  schoolSelectorPlaceholder: {
    color: '#999',
  },
  chevron: {
    fontSize: 10,
    color: '#999',
    marginLeft: 8,
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
  domainNote: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  modalClose: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00274C',
  },
  universityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  universityItemSelected: {
    backgroundColor: '#f0f4ff',
  },
  universityName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  universityNameSelected: {
    color: '#00274C',
    fontWeight: '600',
  },
  universityDomain: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  checkmark: {
    fontSize: 18,
    color: '#00274C',
    fontWeight: 'bold',
  },
  emptyList: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
});
