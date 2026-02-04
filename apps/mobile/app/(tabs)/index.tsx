import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { apiClient } from '../../src/lib/api';

const notificationIcon = require('../../assets/notification_icon.png');

const SCHOOL_NAMES: { [key: string]: string } = {
  UMICH: 'University of Michigan',
  MSU: 'Michigan State University',
  OSU: 'Ohio State University',
};

const BOARD_ICONS: { [key: string]: string } = {
  free: '💬',
  secret: '🔒',
  info: '📢',
  hot: '🔥',
  cs: '💻',
};

interface Board {
  id: string;
  key: string;
  name: string;
}

interface PinnedBoard {
  id: string;
  board: Board;
  latest_post?: {
    id: string;
    title: string;
    is_new: boolean;
  };
}

interface HotPost {
  id: string;
  title: string;
  board: { key: string; name: string };
  like_count: number;
  comment_count: number;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [pinnedBoards, setPinnedBoards] = useState<PinnedBoard[]>([]);
  const [hotPosts, setHotPosts] = useState<HotPost[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Mock user for preview mode
  const displayUser = user || {
    nickname: 'Preview User',
    email: 'preview@umich.edu',
    school: 'UMICH',
    major: 'Computer Science',
    graduation_year: 2026,
    profile_image_url: null,
  };

  const schoolName = displayUser.school ? SCHOOL_NAMES[displayUser.school] || displayUser.school : 'Your University';
  const userInitial = displayUser.nickname?.charAt(0).toUpperCase() || 'U';

  const fetchData = useCallback(async () => {
    // Fetch pinned boards if logged in
    if (token) {
      try {
        const pinnedResponse = await apiClient.get<PinnedBoard[]>('/boards/pinned');
        setPinnedBoards(pinnedResponse);
      } catch (e) {
        console.log('Failed to fetch pinned boards');
      }
    }

    // Fetch hot posts
    try {
      const hotResponse = await apiClient.get<{ data: HotPost[] }>('/boards/hot/posts?pageSize=3');
      setHotPosts(hotResponse.data || []);
    } catch (e) {
      console.log('Failed to fetch hot posts');
    }

    setRefreshing(false);
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>Q</Text>
          </View>
          <View style={styles.headerTitles}>
            <Text style={styles.appName}>Quadly</Text>
            <Text style={styles.schoolName}>{schoolName}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.notificationButton}>
            <Image source={notificationIcon} style={styles.notificationIcon} resizeMode="contain" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push('/(tabs)/settings')}
          >
            {displayUser.profile_image_url ? (
              <Image
                source={{ uri: displayUser.profile_image_url }}
                style={styles.profileImage}
              />
            ) : (
              <Text style={styles.profileInitial}>{userInitial}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>
            Welcome back{user?.nickname ? `, ${user.nickname}` : ''}! 👋
          </Text>
          <Text style={styles.welcomeSubtitle}>
            What would you like to do today?
          </Text>
        </View>

        {/* Pinned Boards Section */}
        {pinnedBoards.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pinned Boards</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/community')}>
                <Text style={styles.viewAllLink}>View All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.pinnedList}>
              {pinnedBoards.slice(0, 3).map((pinned) => (
                <TouchableOpacity
                  key={pinned.id}
                  style={styles.pinnedCard}
                  onPress={() => router.push(`/boards/${pinned.board.key}`)}
                >
                  <View style={styles.pinnedLeft}>
                    <Text style={styles.pinnedIcon}>
                      {BOARD_ICONS[pinned.board.key] || '📋'}
                    </Text>
                    <Text style={styles.pinnedName}>{pinned.board.name}</Text>
                  </View>
                  {pinned.latest_post?.is_new && (
                    <View style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>New!</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Hot Today Section */}
        {hotPosts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🔥 Hot Today</Text>
            </View>
            <View style={styles.hotList}>
              {hotPosts.map((post, index) => (
                <TouchableOpacity
                  key={post.id}
                  style={styles.hotCard}
                  onPress={() => router.push(`/boards/${post.board.key}/posts/${post.id}`)}
                >
                  <Text style={styles.hotRank}>{index + 1}</Text>
                  <View style={styles.hotInfo}>
                    <Text style={styles.hotTitle} numberOfLines={1}>{post.title}</Text>
                    <Text style={styles.hotBoard}>{post.board.name}</Text>
                  </View>
                  <View style={styles.hotStats}>
                    <Text style={styles.hotStat}>❤️ {post.like_count}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/schedule')}
            >
              <Text style={styles.actionIcon}>📅</Text>
              <Text style={styles.actionTitle}>Schedule</Text>
              <Text style={styles.actionSubtitle}>View your classes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/community')}
            >
              <Text style={styles.actionIcon}>💬</Text>
              <Text style={styles.actionTitle}>Community</Text>
              <Text style={styles.actionSubtitle}>Join discussions</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/classes')}
            >
              <Text style={styles.actionIcon}>📚</Text>
              <Text style={styles.actionTitle}>Classes</Text>
              <Text style={styles.actionSubtitle}>Find courses</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* User Profile Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Profile</Text>
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={styles.profileAvatar}>
                {displayUser.profile_image_url ? (
                  <Image
                    source={{ uri: displayUser.profile_image_url }}
                    style={styles.profileAvatarImage}
                  />
                ) : (
                  <Text style={styles.profileAvatarText}>{userInitial}</Text>
                )}
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{displayUser.nickname || 'User'}</Text>
                <Text style={styles.profileEmail}>{displayUser.email}</Text>
              </View>
            </View>

            <View style={styles.profileDetails}>
              {displayUser.major && (
                <View style={styles.profileDetailItem}>
                  <Text style={styles.profileDetailLabel}>Major</Text>
                  <Text style={styles.profileDetailValue}>{displayUser.major}</Text>
                </View>
              )}
              {displayUser.graduation_year && (
                <View style={styles.profileDetailItem}>
                  <Text style={styles.profileDetailLabel}>Class of</Text>
                  <Text style={styles.profileDetailValue}>{displayUser.graduation_year}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Bottom padding for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 36,
    height: 36,
    backgroundColor: '#00274C',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerTitles: {
    marginLeft: 10,
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00274C',
  },
  schoolName: {
    fontSize: 11,
    color: '#666666',
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationIcon: {
    width: 20,
    height: 20,
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00274C',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileInitial: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  welcomeCard: {
    backgroundColor: '#00274C',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  viewAllLink: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  pinnedList: {
    gap: 8,
  },
  pinnedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  pinnedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pinnedIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  pinnedName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  newBadge: {
    backgroundColor: '#ff3b30',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  newBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  hotList: {
    gap: 8,
  },
  hotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  hotRank: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff9500',
    width: 24,
  },
  hotInfo: {
    flex: 1,
    marginLeft: 4,
  },
  hotTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  hotBoard: {
    fontSize: 12,
    color: '#999999',
    marginTop: 2,
  },
  hotStats: {
    flexDirection: 'row',
  },
  hotStat: {
    fontSize: 12,
    color: '#666666',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 11,
    color: '#666666',
    textAlign: 'center',
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#00274C',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileAvatarImage: {
    width: '100%',
    height: '100%',
  },
  profileAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  profileInfo: {
    marginLeft: 14,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  profileEmail: {
    fontSize: 13,
    color: '#666666',
    marginTop: 2,
  },
  profileDetails: {
    gap: 12,
  },
  profileDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileDetailLabel: {
    fontSize: 14,
    color: '#666666',
  },
  profileDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
});
