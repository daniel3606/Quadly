import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, shadowStyle, borderRadius, fontSize, spacing } from '../../constants';

interface HotPost {
  id: string;
  title: string;
  view_count: number;
  like_count: number;
  board_key: string;
}

interface HotTodayProps {
  post: HotPost | null;
  onPress: (postId: string, boardKey: string) => void;
}

export function HotToday({ post, onPress }: HotTodayProps) {
  if (!post) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Hot Today</Text>
        <Text style={styles.emptyText}>No hot posts today</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(post.id, post.board_key)}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Hot Today 🔥</Text>
      </View>

      <Text style={styles.postTitle} numberOfLines={2}>
        {post.title}
      </Text>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statIcon}>👁</Text>
          <Text style={styles.statText}>{post.view_count}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statIcon}>❤️</Text>
          <Text style={styles.statText}>{post.like_count}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    ...shadowStyle,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  header: {
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  postTitle: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statIcon: {
    fontSize: fontSize.sm,
  },
  statText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
});
