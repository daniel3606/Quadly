import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCommunityStore } from '../src/store/communityStore';
import { PostCard } from '../src/components/community';
import { colors, spacing, fontSize } from '../src/constants';

const FILTER_TITLES: Record<string, string> = {
  'my-posts': 'My Posts',
  liked: 'Liked Posts',
  'my-comments': 'My Comments',
};

export default function FilteredPostsScreen() {
  const router = useRouter();
  const { filter } = useLocalSearchParams<{ filter: string }>();
  const {
    initialize,
    isInitialized,
    filteredPosts,
    filteredPostsLoading,
    fetchMyPosts,
    fetchLikedPosts,
    fetchMyCommentedPosts,
  } = useCommunityStore();

  const title = FILTER_TITLES[filter || ''] || 'Posts';

  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized]);

  useEffect(() => {
    if (!isInitialized || !filter) return;
    if (filter === 'my-posts') fetchMyPosts();
    else if (filter === 'liked') fetchLikedPosts();
    else if (filter === 'my-comments') fetchMyCommentedPosts();
  }, [isInitialized, filter]);

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
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Image source={require('../assets/back_icon.png')} style={styles.backIcon} resizeMode="contain" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title}</Text>
        </View>

        {filteredPostsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {filteredPosts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No posts found</Text>
                <Text style={styles.emptySubtext}>
                  {filter === 'my-posts'
                    ? "You haven't created any posts yet"
                    : filter === 'liked'
                    ? "You haven't liked any posts yet"
                    : "You haven't commented on any posts yet"}
                </Text>
              </View>
            ) : (
              <View style={styles.resultsList}>
                {filteredPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </View>
            )}
          </ScrollView>
        )}
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  backButton: {
    padding: spacing.xs,
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.textLight,
  },
  resultsList: {
    padding: spacing.md,
    paddingBottom: 100,
  },
});
