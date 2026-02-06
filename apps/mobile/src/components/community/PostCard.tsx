import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Post } from '../../store/communityStore';
import { useCommunityStore } from '../../store/communityStore';
import { colors, spacing, borderRadius, fontSize, cardShadow } from '../../constants';

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const router = useRouter();
  const { likePost, incrementViewCount } = useCommunityStore();

  const handlePress = () => {
    incrementViewCount(post.id);
    router.push({
      pathname: '/post/[id]',
      params: { id: post.id },
    });
  };

  const handleLikePress = async () => {
    await likePost(post.id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>
          {post.title}
        </Text>
        <Text style={styles.time}>{formatDate(post.created_at)}</Text>
      </View>

      <Text style={styles.body} numberOfLines={3}>
        {post.body}
      </Text>

      <View style={styles.footer}>
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Image
              source={require('../../../assets/view_icon.png')}
              style={styles.statIcon}
            />
            <Text style={styles.statText}>{post.view_count}</Text>
          </View>

          <TouchableOpacity
            style={styles.statItem}
            onPress={() => handleLikePress()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Image
              source={require('../../../assets/like_icon.png')}
              style={[
                styles.statIcon,
                post.is_liked && styles.statIconLiked,
              ]}
            />
            <Text
              style={[
                styles.statText,
                post.is_liked && styles.statTextLiked,
              ]}
            >
              {post.like_count}
            </Text>
          </TouchableOpacity>

          <View style={styles.statItem}>
            <Image
              source={require('../../../assets/comment_icon.png')}
              style={styles.statIcon}
            />
            <Text style={styles.statText}>{post.comment_count}</Text>
          </View>
        </View>

        {post.is_anonymous && (
          <View style={styles.anonymousBadge}>
            <Text style={styles.anonymousText}>Anonymous</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...cardShadow,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginRight: spacing.sm,
  },
  time: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  body: {
    fontSize: fontSize.md,
    color: colors.textLight,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statIcon: {
    width: 16,
    height: 16,
    tintColor: colors.textSecondary,
  },
  statIconLiked: {
    tintColor: colors.error,
  },
  statText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  statTextLiked: {
    color: colors.error,
    fontWeight: '600',
  },
  anonymousBadge: {
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  anonymousText: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    fontWeight: '500',
  },
});
