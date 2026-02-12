import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Image, Alert, RefreshControl } from 'react-native';
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
  const { initialize, isInitialized, fetchBoards } = useCommunityStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const schoolName = (user?.user_metadata?.school as string) || 'Your University';

  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchBoards();
    setIsRefreshing(false);
  }, []);

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

        <View style={styles.quickAccessGrid}>
          <View style={styles.quickAccessRow}>
            <TouchableOpacity
              style={[styles.quickAccessButton, { backgroundColor: '#81A4E5' }]}
              onPress={() => router.push('/filtered-posts?filter=my-posts')}
              activeOpacity={0.7}
            >
              <Text style={styles.quickAccessText}>My Posts</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickAccessButton, { backgroundColor: '#E18B7A' }]}
              onPress={() => router.push('/filtered-posts?filter=liked')}
              activeOpacity={0.7}
            >
              <Text style={styles.quickAccessText}>Liked Posts</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.quickAccessRow}>
            <TouchableOpacity
              style={[styles.quickAccessButton, { backgroundColor: '#AEC97C' }]}
              onPress={() => router.push('/filtered-posts?filter=my-comments')}
              activeOpacity={0.7}
            >
              <Text style={styles.quickAccessText}>My Comments</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickAccessButton, { backgroundColor: '#9B88D9' }]}
              onPress={() => Alert.alert('Saved Posts', 'This feature is coming soon!')}
              activeOpacity={0.7}
            >
              <Text style={styles.quickAccessText}>Saved Posts</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
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
    paddingHorizontal: spacing.md + 8,
    paddingVertical: spacing.md,
    backgroundColor: 'transparent',
  },
  headerLeft: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  headerTitle: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: '#121212',
  },
  schoolName: {
    fontSize: fontSize.sm,
    color: '#606060',
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
  quickAccessGrid: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  quickAccessRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickAccessButton: {
    flex: 1,
    aspectRatio: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  quickAccessText: {
    color: '#ffffff',
    fontSize: fontSize.sm,
    fontWeight: '600',
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
