import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/store/authStore';
import { colors, spacing, borderRadius, fontSize, cardShadow } from '../../src/constants';

interface Comment {
  id: string;
  post_id: string;
  author_id: string | null;
  is_anonymous: boolean;
  content: string;
  like_count: number;
  created_at: string;
  updated_at: string;
}

export default function PostDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [viewCount, setViewCount] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    if (id) {
      loadPost();
      loadComments();
      checkLikeStatus();
      incrementView();
    }
  }, [id]);

  const loadPost = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setPost(data);
      setLikeCount(data.like_count);
      setViewCount(data.view_count);
    } catch (error) {
      console.error('Failed to load post:', error);
      Alert.alert('Error', 'Failed to load post');
    } finally {
      setIsLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setComments(data || []);
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const checkLikeStatus = async () => {
    if (!user?.id) return;

    try {
      const { data } = await supabase
        .from('post_likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', id)
        .single();

      setIsLiked(!!data);
    } catch (error) {
      // No like found, which is fine
    }
  };

  const incrementView = async () => {
    if (!user?.id) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: existingView } = await supabase
        .from('post_views')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', id)
        .eq('viewed_date', today)
        .single();

      if (!existingView) {
        await supabase.from('post_views').insert({
          user_id: user.id,
          post_id: id,
          viewed_date: today,
        });

        setViewCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error('Failed to increment view:', error);
    }
  };

  const handleLike = async () => {
    if (!user?.id) {
      Alert.alert('Login Required', 'Please login to like posts');
      return;
    }

    try {
      if (isLiked) {
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', id);

        if (error) throw error;

        setIsLiked(false);
        setLikeCount((prev) => Math.max(0, prev - 1));
      } else {
        const { error } = await supabase.from('post_likes').insert({
          user_id: user.id,
          post_id: id,
        });

        if (error) throw error;

        setIsLiked(true);
        setLikeCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
      Alert.alert('Error', 'Failed to update like');
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;
    if (!user?.id) {
      Alert.alert('Login Required', 'Please login to comment');
      return;
    }

    setIsSubmittingComment(true);

    try {
      const { error } = await supabase.from('comments').insert({
        post_id: id,
        author_id: user.id,
        is_anonymous: false,
        content: commentText.trim(),
      });

      if (error) throw error;

      setCommentText('');
      
      // Update comment count on post
      await supabase
        .from('posts')
        .update({ comment_count: comments.length + 1 })
        .eq('id', id);
      
      await loadComments();
    } catch (error) {
      console.error('Failed to submit comment:', error);
      Alert.alert('Error', 'Failed to submit comment');
    } finally {
      setIsSubmittingComment(false);
    }
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

  if (isLoading) {
    return (
      <LinearGradient
        colors={['#ffffff', '#f6f6f6']}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!post) {
    return (
      <LinearGradient
        colors={['#ffffff', '#f6f6f6']}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>Post not found</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#ffffff', '#f6f6f6']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar style="dark" />

        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.postCard}>
              <View style={styles.postHeader}>
                <Text style={styles.postTitle}>{post.title}</Text>
                <Text style={styles.postTime}>{formatDate(post.created_at)}</Text>
              </View>

              <Text style={styles.postBody}>{post.body}</Text>

              <View style={styles.postFooter}>
                <View style={styles.stats}>
                  <View style={styles.statItem}>
                    <Image
                      source={require('../../assets/view_icon.png')}
                      style={styles.statIcon}
                    />
                    <Text style={styles.statText}>{viewCount}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.statItem}
                    onPress={handleLike}
                  >
                    <Image
                      source={require('../../assets/like_icon.png')}
                      style={[
                        styles.statIcon,
                        isLiked && styles.statIconLiked,
                      ]}
                    />
                    <Text
                      style={[
                        styles.statText,
                        isLiked && styles.statTextLiked,
                      ]}
                    >
                      {likeCount}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.statItem}>
                    <Image
                      source={require('../../assets/comment_icon.png')}
                      style={styles.statIcon}
                    />
                    <Text style={styles.statText}>{comments.length}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.commentsSection}>
              <Text style={styles.commentsTitle}>Comments ({comments.length})</Text>

              {comments.map((comment) => (
                <View key={comment.id} style={styles.commentCard}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentAuthor}>
                      {comment.is_anonymous ? 'Anonymous' : 'User'}
                    </Text>
                    <Text style={styles.commentTime}>
                      {formatDate(comment.created_at)}
                    </Text>
                  </View>
                  <Text style={styles.commentContent}>{comment.content}</Text>
                </View>
              ))}

              {comments.length === 0 && (
                <Text style={styles.noComments}>No comments yet</Text>
              )}
            </View>
          </ScrollView>

          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Write a comment..."
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={5000}
            />
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!commentText.trim() || isSubmittingComment) &&
                  styles.submitButtonDisabled,
              ]}
              onPress={handleSubmitComment}
              disabled={!commentText.trim() || isSubmittingComment}
            >
              {isSubmittingComment ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <Text style={styles.submitButtonText}>Post</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    paddingVertical: spacing.sm,
  },
  backButtonText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: '600',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  postCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...cardShadow,
  },
  postHeader: {
    marginBottom: spacing.md,
  },
  postTitle: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  postTime: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  postBody: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  postFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statIcon: {
    width: 18,
    height: 18,
    tintColor: colors.textSecondary,
  },
  statIconLiked: {
    tintColor: colors.error,
  },
  statText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  statTextLiked: {
    color: colors.error,
    fontWeight: '600',
  },
  commentsSection: {
    marginTop: spacing.md,
  },
  commentsTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  commentCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...cardShadow,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  commentAuthor: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
  },
  commentTime: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  commentContent: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 20,
  },
  noComments: {
    fontSize: fontSize.md,
    color: colors.textLight,
    textAlign: 'center',
    padding: spacing.lg,
  },
  commentInputContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  commentInput: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    fontSize: fontSize.md,
    maxHeight: 100,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: colors.background,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  errorText: {
    fontSize: fontSize.lg,
    color: colors.textLight,
  },
});
