import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../../src/store/authStore';
import { apiClient } from '../../../src/lib/api';

interface Board {
  id: string;
  key: string;
  name: string;
  visibility: string;
  anon_mode: string;
}

interface Post {
  id: string;
  title: string;
  body: string;
  is_anonymous: boolean;
  author: {
    id: string | null;
    nickname: string | null;
    anonymous_handle?: string;
  };
  like_count: number;
  comment_count: number;
  view_count: number;
  created_at: string;
  is_liked?: boolean;
}

interface PostsResponse {
  data: Post[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

const BOARD_ICONS: { [key: string]: string } = {
  free: '💬',
  secret: '🔒',
  info: '📢',
  hot: '🔥',
  cs: '💻',
};

export default function BoardDetailScreen() {
  const router = useRouter();
  const { boardKey } = useLocalSearchParams<{ boardKey: string }>();
  const { token } = useAuthStore();

  const [board, setBoard] = useState<Board | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'new' | 'hot'>('new');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchBoard = useCallback(async () => {
    try {
      const boardResponse = await apiClient.get<Board>(`/boards/${boardKey}`);
      setBoard(boardResponse);

      // Check if pinned
      if (token) {
        try {
          const pinnedResponse = await apiClient.get<{ id: string; board: Board }[]>('/boards/pinned');
          setIsPinned(pinnedResponse.some(p => p.board.key === boardKey));
        } catch (e) {
          console.log('Failed to check pinned status');
        }
      }
    } catch (error) {
      console.error('Failed to fetch board:', error);
    }
  }, [boardKey, token]);

  const fetchPosts = useCallback(async (pageNum: number = 1, refresh: boolean = false) => {
    try {
      const response = await apiClient.get<PostsResponse>(
        `/boards/${boardKey}/posts?page=${pageNum}&pageSize=20&sort=${sortBy}`
      );

      if (refresh || pageNum === 1) {
        setPosts(response.data);
      } else {
        setPosts(prev => [...prev, ...response.data]);
      }

      setHasMore(pageNum < response.pagination.totalPages);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      // Mock data
      if (pageNum === 1) {
        setPosts([
          {
            id: '1',
            title: 'Welcome to the board!',
            body: 'This is a sample post. Start a discussion!',
            is_anonymous: false,
            author: { id: '1', nickname: 'Admin' },
            like_count: 5,
            comment_count: 2,
            view_count: 100,
            created_at: new Date().toISOString(),
          },
        ]);
      }
      setHasMore(false);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [boardKey, sortBy]);

  useEffect(() => {
    fetchBoard();
    fetchPosts(1, true);
  }, [fetchBoard, fetchPosts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPosts(1, true);
  }, [fetchPosts]);

  const handleTogglePin = async () => {
    if (!token) {
      Alert.alert('Login Required', 'Please login to pin boards.');
      return;
    }

    setPinLoading(true);
    try {
      if (isPinned) {
        await apiClient.delete(`/boards/${boardKey}/pin`);
        setIsPinned(false);
      } else {
        await apiClient.post(`/boards/${boardKey}/pin`);
        setIsPinned(true);
      }
    } catch (error) {
      console.error('Failed to toggle pin:', error);
      Alert.alert('Error', 'Failed to update pin status.');
    } finally {
      setPinLoading(false);
    }
  };

  const handleSortChange = (sort: 'new' | 'hot') => {
    if (sort !== sortBy) {
      setSortBy(sort);
      setIsLoading(true);
      fetchPosts(1, true);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (hours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const getAuthorName = (post: Post) => {
    if (post.is_anonymous) {
      return post.author.anonymous_handle || 'Anonymous';
    }
    return post.author.nickname || 'Unknown';
  };

  if (isLoading && posts.length === 0) {
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

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerIcon}>{BOARD_ICONS[boardKey || ''] || '📋'}</Text>
          <Text style={styles.headerTitle}>{board?.name || 'Board'}</Text>
        </View>
        <TouchableOpacity
          style={styles.pinButton}
          onPress={handleTogglePin}
          disabled={pinLoading}
        >
          {pinLoading ? (
            <ActivityIndicator size="small" color="#00274C" />
          ) : (
            <Text style={[styles.pinIcon, isPinned && styles.pinIconActive]}>
              {isPinned ? '📌' : '📍'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Sort Tabs */}
      <View style={styles.sortTabs}>
        <TouchableOpacity
          style={[styles.sortTab, sortBy === 'new' && styles.sortTabActive]}
          onPress={() => handleSortChange('new')}
        >
          <Text style={[styles.sortTabText, sortBy === 'new' && styles.sortTabTextActive]}>
            Newest
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortTab, sortBy === 'hot' && styles.sortTabActive]}
          onPress={() => handleSortChange('hot')}
        >
          <Text style={[styles.sortTabText, sortBy === 'hot' && styles.sortTabTextActive]}>
            Hot
          </Text>
        </TouchableOpacity>
      </View>

      {/* Posts List */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {posts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyTitle}>No posts yet</Text>
            <Text style={styles.emptyText}>Be the first to start a discussion!</Text>
          </View>
        ) : (
          posts.map((post) => (
            <TouchableOpacity
              key={post.id}
              style={styles.postCard}
              onPress={() => router.push(`/boards/${boardKey}/posts/${post.id}`)}
            >
              <Text style={styles.postTitle} numberOfLines={2}>{post.title}</Text>
              <Text style={styles.postBody} numberOfLines={2}>{post.body}</Text>
              <View style={styles.postMeta}>
                <Text style={styles.postAuthor}>
                  {post.is_anonymous ? '🔒 ' : ''}{getAuthorName(post)}
                </Text>
                <Text style={styles.postDot}>·</Text>
                <Text style={styles.postTime}>{formatDate(post.created_at)}</Text>
              </View>
              <View style={styles.postStats}>
                <Text style={styles.postStat}>❤️ {post.like_count}</Text>
                <Text style={styles.postStat}>💬 {post.comment_count}</Text>
                <Text style={styles.postStat}>👁 {post.view_count}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        {hasMore && posts.length > 0 && (
          <TouchableOpacity
            style={styles.loadMoreButton}
            onPress={() => fetchPosts(page + 1)}
          >
            <Text style={styles.loadMoreText}>Load More</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* New Post FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          if (!token) {
            Alert.alert('Login Required', 'Please login to create a post.');
            return;
          }
          router.push(`/boards/${boardKey}/new`);
        }}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#00274C',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  headerIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00274C',
  },
  pinButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinIcon: {
    fontSize: 20,
    opacity: 0.5,
  },
  pinIconActive: {
    opacity: 1,
  },
  sortTabs: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  sortTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  sortTabActive: {
    backgroundColor: '#00274C',
  },
  sortTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  sortTabTextActive: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666666',
  },
  postCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  postBody: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
    lineHeight: 20,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postAuthor: {
    fontSize: 13,
    color: '#00274C',
    fontWeight: '500',
  },
  postDot: {
    marginHorizontal: 6,
    color: '#cccccc',
  },
  postTime: {
    fontSize: 13,
    color: '#999999',
  },
  postStats: {
    flexDirection: 'row',
    gap: 16,
  },
  postStat: {
    fontSize: 13,
    color: '#666666',
  },
  loadMoreButton: {
    alignItems: 'center',
    padding: 16,
  },
  loadMoreText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#00274C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  fabIcon: {
    fontSize: 28,
    color: '#ffffff',
    fontWeight: '300',
  },
});
