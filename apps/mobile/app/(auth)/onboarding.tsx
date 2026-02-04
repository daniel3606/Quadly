import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 7 }, (_, i) => currentYear + i);

const genders = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Non-binary', value: 'nonbinary' },
];

const majors = [
  'Computer Science',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Business Administration',
  'Economics',
  'Psychology',
  'Biology',
  'Data Science',
  'Information Science',
  'Other',
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, completeOnboarding } = useAuthStore();
  const [graduationYear, setGraduationYear] = useState<number | null>(null);
  const [gender, setGender] = useState<string | null>(null);
  const [major, setMajor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (!graduationYear || !gender || !major) {
      Alert.alert('Missing Information', 'Please fill in all fields to continue.');
      return;
    }

    setIsLoading(true);
    try {
      await completeOnboarding({
        graduation_year: graduationYear,
        gender,
        major,
      });
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Onboarding error:', error);
      // If API fails, still navigate to tabs for preview
      router.replace('/(tabs)');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoSmall}>
            <Text style={styles.logoText}>Q</Text>
          </View>
          <Text style={styles.title}>Welcome{user?.nickname ? `, ${user.nickname}` : ''}!</Text>
          <Text style={styles.subtitle}>Tell us a bit about yourself</Text>
        </View>

        {/* Graduation Year */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expected Graduation Year</Text>
          <View style={styles.optionGrid}>
            {years.map((year) => (
              <TouchableOpacity
                key={year}
                style={[
                  styles.optionButton,
                  graduationYear === year && styles.optionButtonSelected,
                ]}
                onPress={() => setGraduationYear(year)}
              >
                <Text
                  style={[
                    styles.optionText,
                    graduationYear === year && styles.optionTextSelected,
                  ]}
                >
                  {year}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Gender */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gender</Text>
          <View style={styles.optionRow}>
            {genders.map((g) => (
              <TouchableOpacity
                key={g.value}
                style={[
                  styles.optionButton,
                  styles.optionButtonFlex,
                  gender === g.value && styles.optionButtonSelected,
                ]}
                onPress={() => setGender(g.value)}
              >
                <Text
                  style={[
                    styles.optionText,
                    gender === g.value && styles.optionTextSelected,
                  ]}
                >
                  {g.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Major */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Major</Text>
          <View style={styles.majorList}>
            {majors.map((m) => (
              <TouchableOpacity
                key={m}
                style={[
                  styles.majorButton,
                  major === m && styles.majorButtonSelected,
                ]}
                onPress={() => setMajor(m)}
              >
                <Text
                  style={[
                    styles.majorText,
                    major === m && styles.majorTextSelected,
                  ]}
                >
                  {m}
                </Text>
                {major === m && <Text style={styles.majorCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[styles.continueButton, isLoading && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.continueButtonText}>Continue</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  logoSmall: {
    width: 50,
    height: 50,
    backgroundColor: '#00274C',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00274C',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonFlex: {
    flex: 1,
    alignItems: 'center',
  },
  optionButtonSelected: {
    backgroundColor: '#e8f0fe',
    borderColor: '#00274C',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  optionTextSelected: {
    color: '#00274C',
    fontWeight: '600',
  },
  majorList: {
    gap: 8,
  },
  majorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  majorButtonSelected: {
    backgroundColor: '#e8f0fe',
    borderColor: '#00274C',
  },
  majorText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  majorTextSelected: {
    color: '#00274C',
    fontWeight: '600',
  },
  majorCheck: {
    fontSize: 16,
    color: '#00274C',
    fontWeight: 'bold',
  },
  continueButton: {
    marginHorizontal: 24,
    marginTop: 8,
    backgroundColor: '#00274C',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
