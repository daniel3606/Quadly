import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useCommunityStore } from '../../store/communityStore';
import { PostCard } from './PostCard';
import { colors, spacing, fontSize } from '../../constants';

export function PostList() {
  const { posts, isLoading, selectedBoardId, refreshPosts } = useCommunityStore();

  useEffect(() => {
    if (selectedBoardId) {
      refreshPosts();
    }
  }, [selectedBoardId]);

  if (isLoading && posts.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (posts.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No posts yet</Text>
        <Text style={styles.emptySubtext}>
          Be the first to post in this board!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  centerContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: fontSize.md,
    color: colors.textLight,
    textAlign: 'center',
  },
});
