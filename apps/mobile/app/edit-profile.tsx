import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import { useAuthStore } from '../src/store/authStore';
import { supabase } from '../src/lib/supabase';

const GRADUATION_YEARS = Array.from({ length: 12 }, (_, i) => 2024 + i);

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [graduationYear, setGraduationYear] = useState<number | null>(null);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const avatarUrl = (user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture) as string | undefined;
  const userInitial = (user?.email ?? '?').charAt(0).toUpperCase();

  useEffect(() => {
    const meta = user?.user_metadata || {};
    setFullName((meta.full_name ?? meta.name ?? '') as string);
    setGraduationYear((meta.graduation_year as number) ?? null);
  }, [user]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (localUri: string): Promise<string | null> => {
    const userId = user?.id;
    if (!userId) return null;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('No session');

      const fileExt = 'jpg';
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      const supabaseUrl =
        Constants.expoConfig?.extra?.supabaseUrl ||
        'https://waahgmnfykmrlxuvxerw.supabase.co';

      const formData = new FormData();
      formData.append('', {
        uri: localUri,
        name: fileName.split('/').pop(),
        type: 'image/jpeg',
      } as any);

      const response = await fetch(
        `${supabaseUrl}/storage/v1/object/avatars/${fileName}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Avatar upload error:', response.status, errorBody);
        throw new Error(`Upload failed: ${response.status}`);
      }

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      return null;
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const meta = { ...(user?.user_metadata || {}) };

      if (avatarUri) {
        const url = await uploadAvatar(avatarUri);
        if (url) {
          meta.avatar_url = url;
          meta.picture = url;
        }
      }
      if (fullName.trim()) meta.full_name = fullName.trim();
      if (graduationYear) meta.graduation_year = graduationYear;

      const { error } = await supabase.auth.updateUser({ data: meta });
      if (error) throw error;

      Alert.alert('Saved', 'Your profile has been updated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const displayAvatar = avatarUri ?? avatarUrl;

  return (
    <LinearGradient
      colors={['#ffffff', '#f6f6f6']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar style="dark" />

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#00274C" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile Picture */}
          <View style={styles.avatarSection}>
            <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
              {displayAvatar ? (
                <Image source={{ uri: displayAvatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarPlaceholderText}>{userInitial}</Text>
                </View>
              )}
              <View style={styles.avatarEditBadge}>
                <Text style={styles.avatarEditBadgeText}>📷</Text>
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>Tap to change photo</Text>
          </View>

          {/* Full Name */}
          <View style={styles.field}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your name"
              placeholderTextColor="#999"
              autoCapitalize="words"
            />
          </View>

          {/* Graduation Year */}
          <View style={styles.field}>
            <Text style={styles.label}>Graduation Year</Text>
            <TouchableOpacity
              style={styles.pickerTrigger}
              onPress={() => setShowYearPicker(!showYearPicker)}
            >
              <Text style={graduationYear ? styles.pickerValue : styles.pickerPlaceholder}>
                {graduationYear ?? 'Select year'}
              </Text>
              <Text style={styles.chevron}>{showYearPicker ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {showYearPicker && (
              <View style={styles.yearPicker}>
                {GRADUATION_YEARS.map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.yearOption,
                      graduationYear === year && styles.yearOptionSelected,
                    ]}
                    onPress={() => {
                      setGraduationYear(year);
                      setShowYearPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.yearOptionText,
                        graduationYear === year && styles.yearOptionTextSelected,
                      ]}
                    >
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Email (read-only) */}
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.readOnlyValue}>{user?.email ?? ''}</Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 24,
    color: '#000000',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  saveButton: {
    minWidth: 60,
    alignItems: 'flex-end',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00274C',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00274C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditBadgeText: {
    fontSize: 16,
  },
  avatarHint: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  pickerTrigger: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  pickerValue: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  pickerPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  chevron: {
    fontSize: 10,
    color: '#666',
  },
  yearPicker: {
    marginTop: 8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    maxHeight: 200,
  },
  yearOption: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  yearOptionSelected: {
    backgroundColor: '#f0f4ff',
  },
  yearOptionText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  yearOptionTextSelected: {
    fontWeight: '600',
    color: '#00274C',
  },
  readOnlyValue: {
    fontSize: 16,
    color: '#666',
    paddingVertical: 14,
  },
});
