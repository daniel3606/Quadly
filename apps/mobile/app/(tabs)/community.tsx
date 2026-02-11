import React, { useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { useCommunityStore } from '../../src/store/communityStore';
import { BoardSelector } from '../../src/components/community';
import { colors, spacing, fontSize } from '../../src/constants';

export default function CommunityScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { initialize, isInitialized } = useCommunityStore();

  const schoolName = (user?.user_metadata?.school as string) || 'Your University';

  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized]);

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
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Community</Text>
            <Text style={styles.schoolName} numberOfLines={1}>{schoolName}</Text>
          </View>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => router.push('/community-search')}
            activeOpacity={0.7}
          >
            <Image source={require('../../assets/search_icon.png')} style={styles.searchIcon} resizeMode="contain" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <BoardSelector />
        </ScrollView>

        <View style={{ height: 85 }} />
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  headerTitle: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: '#000000',
  },
  schoolName: {
    fontSize: fontSize.sm,
    color: colors.textSecondary ?? colors.text,
    marginTop: 2,
  },
  searchButton: {
    padding: spacing.sm,
    marginLeft: spacing.sm,
  },
  searchIcon: {
    width: 24,
    height: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  boardsSection: {
    backgroundColor: colors.background,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
  },
});
