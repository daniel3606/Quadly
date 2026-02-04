import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { apiClient } from '../../src/lib/api';

interface Board {
  id: string;
  key: string;
  name: string;
  visibility: string;
  anon_mode: string;
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
  view_count: number;
}

const BOARD_ICONS: { [key: string]: string } = {
  free: '💬',
  secret: '🔒',
  info: '📢',
  hot: '🔥',
  cs: '💻',
};

export default function CommunityScreen() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [boards, setBoards] = useState<Board[]>([]);
  const [pinnedBoards, setPinnedBoards] = useState<PinnedBoard[]>([]);
  const [hotPosts, setHotPosts] = useState<HotPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // Fetch all boards
      const boardsResponse = await apiClient.get<Board[]>('/boards');
      setBoards(boardsResponse);

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
        const hotResponse = await apiClient.get<{ data: HotPost[] }>('/boards/hot/posts?pageSize=5');
        setHotPosts(hotResponse.data || []);
      } catch (e) {
        console.log('Failed to fetch hot posts');
      }
    } catch (error) {
      console.error('Failed to fetch boards:', error);
      // Use mock data if API fails
      setBoards([
        { id: '1', key: 'free', name: 'General Board', visibility: 'school_only', anon_mode: 'optional' },
        { id: '2', key: 'secret', name: 'Private Board', visibility: 'school_only', anon_mode: 'forced' },
        { id: '3', key: 'info', name: 'Info Board', visibility: 'school_only', anon_mode: 'optional' },
        { id: '4', key: 'hot', name: 'Hot Board', visibility: 'school_only', anon_mode: 'optional' },
        { id: '5', key: 'cs', name: 'CS Board', visibility: 'school_only', anon_mode: 'optional' },
      ]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const pinnedBoardKeys = pinnedBoards.map(pb => pb.board.key);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00274C" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community</Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Pinned Boards Section */}
        {pinnedBoards.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pinned Boards</Text>
            </View>
            <View style={styles.pinnedList}>
              {pinnedBoards.map((pinned) => (
                <TouchableOpacity
                  key={pinned.id}
                  style={styles.pinnedCard}
                  onPress={() => router.push(`/boards/${pinned.board.key}`)}
                >
                  <View style={styles.pinnedLeft}>
                    <Text style={styles.pinnedIcon}>
                      {BOARD_ICONS[pinned.board.key] || '📋'}
                    </Text>
                    <View style={styles.pinnedInfo}>
                      <Text style={styles.pinnedName}>{pinned.board.name}</Text>
                      {pinned.latest_post && (
                        <Text style={styles.pinnedLatest} numberOfLines={1}>
                          {pinned.latest_post.title}
                        </Text>
                      )}
                    </View>
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

        {/* Hot Posts Section */}
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
                    <Text style={styles.hotTitle} numberOfLines={2}>{post.title}</Text>
                    <Text style={styles.hotBoard}>{post.board.name}</Text>
                  </View>
                  <View style={styles.hotStats}>
                    <Text style={styles.hotStat}>❤️ {post.like_count}</Text>
                    <Text style={styles.hotStat}>💬 {post.comment_count}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* All Boards Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All Boards</Text>
          </View>
          <View style={styles.boardsGrid}>
            {boards.map((board) => (
              <TouchableOpacity
                key={board.id}
                style={styles.boardCard}
                onPress={() => router.push(`/boards/${board.key}`)}
              >
                <View style={styles.boardCardTop}>
                  <Text style={styles.boardIcon}>
                    {BOARD_ICONS[board.key] || '📋'}
                  </Text>
                  {pinnedBoardKeys.includes(board.key) && (
                    <Text style={styles.pinnedIndicator}>📌</Text>
                  )}
                </View>
                <Text style={styles.boardName}>{board.name}</Text>
                <Text style={styles.boardMeta}>
                  {board.anon_mode === 'forced' ? '🔒 Anonymous' : 'Open'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00274C',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    paddingBottom: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  pinnedList: {
    gap: 10,
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
    fontSize: 24,
    marginRight: 12,
  },
  pinnedInfo: {
    flex: 1,
  },
  pinnedName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  pinnedLatest: {
    fontSize: 13,
    color: '#999999',
    marginTop: 2,
  },
  newBadge: {
    backgroundColor: '#ff3b30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  newBadgeText: {
    color: '#ffffff',
    fontSize: 11,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff9500',
    width: 28,
  },
  hotInfo: {
    flex: 1,
  },
  hotTitle: {
    fontSize: 15,
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
    gap: 8,
  },
  hotStat: {
    fontSize: 12,
    color: '#666666',
  },
  boardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  boardCard: {
    width: '47%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  boardCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  boardIcon: {
    fontSize: 28,
  },
  pinnedIndicator: {
    fontSize: 14,
  },
  boardName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  boardMeta: {
    fontSize: 12,
    color: '#999999',
  },
});
