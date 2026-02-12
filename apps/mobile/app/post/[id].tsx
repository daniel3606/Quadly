import React, { useEffect, useState, useCallback } from 'react';
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
  RefreshControl,
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
  const [board, setBoard] = useState<{ name: string } | null>(null);
  const [authorDisplayName, setAuthorDisplayName] = useState<string | null>(null);
  const [authorAvatarUrl, setAuthorAvatarUrl] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [viewCount, setViewCount] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const schoolName = (user?.user_metadata?.school as string) || 'Your University';

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

      if (data.board_id) {
        try {
          const { data: boardData } = await supabase
            .from('boards')
            .select('name')
            .eq('id', data.board_id)
            .single();
          setBoard(boardData);
        } catch (_) {
          // Board fetch optional
        }
      }

      if (!data.is_anonymous && data.author_id) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('id', data.author_id)
            .single();
          if (profile) {
            setAuthorDisplayName(profile.display_name ?? null);
            setAuthorAvatarUrl(profile.avatar_url ?? null);
          }
        } catch (_) {
          // Profiles optional; will show "User" and placeholder avatar
        }
      }
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

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([loadPost(), loadComments(), checkLikeStatus()]);
    setIsRefreshing(false);
  }, [id]);

  const handleReport = () => {
    if (!user?.id) {
      Alert.alert('Login Required', 'Please login to report posts');
      return;
    }

    Alert.alert('Report Post', 'Select a reason for reporting this post:', [
      { text: 'Spam', onPress: () => submitReport('spam') },
      { text: 'Harassment', onPress: () => submitReport('harassment') },
      { text: 'Inappropriate Content', onPress: () => submitReport('inappropriate') },
      { text: 'Misinformation', onPress: () => submitReport('misinformation') },
      { text: 'Other', onPress: () => submitReport('other') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const submitReport = async (reason: string) => {
    if (isReporting) return;
    setIsReporting(true);

    try {
      const { error } = await supabase.from('post_reports').insert({
        post_id: id,
        reporter_id: user!.id,
        reason,
      });

      if (error) {
        if (error.code === '23505') {
          Alert.alert('Already Reported', 'You have already reported this post.');
        } else {
          throw error;
        }
      } else {
        Alert.alert('Report Submitted', 'Thank you for your report. We will review it shortly.');
      }
    } catch (error) {
      console.error('Failed to submit report:', error);
      Alert.alert('Error', 'Failed to submit report');
    } finally {
      setIsReporting(false);
    }
  };

  const handleCoffeeChat = async () => {
    if (!user?.id || !post) return;

    try {
      const { data, error } = await supabase.rpc('get_or_create_post_conversation', {
        p_post_id: post.id,
        p_other_user_id: post.author_id,
      });

      if (error) throw error;

      router.push({ pathname: '/chat/[id]', params: { id: data } });
    } catch (error) {
      console.error('Failed to start coffee chat:', error);
      Alert.alert('Error', 'Failed to start conversation');
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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
      hour: 'numeric',
      minute: '2-digit',
    });
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
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Image
                source={require('../../assets/back_icon.png')}
                style={styles.backIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <View style={styles.headerTitles}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {board?.name ?? 'Discussion'}
              </Text>
              <Text style={styles.schoolName} numberOfLines={1}>
                {schoolName}
              </Text>
            </View>
          </View>
          <View style={styles.headerSide}>
            <TouchableOpacity
              onPress={handleReport}
              style={styles.reportButtonHeader}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Image
                source={require('../../assets/report_icon.png')}
                style={styles.reportIconHeader}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
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
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
            }
          >
            <View style={styles.postCard}>
              <View style={styles.authorRow}>
                {post.is_anonymous ? (
                  <Image
                    source={require('../../assets/anon_profile_icon.png')}
                    style={styles.authorAvatar}
                  />
                ) : authorAvatarUrl ? (
                  <Image
                    source={{ uri: authorAvatarUrl }}
                    style={styles.authorAvatar}
                  />
                ) : (
                  <View style={styles.authorAvatarPlaceholder}>
                    <Text style={styles.authorAvatarPlaceholderText}>
                      {(authorDisplayName || 'U').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.authorInfo}>
                  <Text style={styles.authorName}>
                    {post.is_anonymous ? 'Anonymous' : (authorDisplayName || 'User')}
                  </Text>
                  <Text style={styles.postTime}>
                    {formatDateTime(post.created_at)}
                  </Text>
                </View>
              </View>

              <Text style={styles.postTitle}>{post.title}</Text>
              <Text style={styles.postBody}>{post.body}</Text>

              <View style={styles.postFooter}>
                <View style={styles.statsContainer}>
                  <View style={styles.stats}>
                    <View style={[styles.statItem, styles.statItemSection]}>
                      <Image
                        source={require('../../assets/view_icon.png')}
                        style={styles.statIcon}
                      />
                      <Text style={styles.statText}>{viewCount}</Text>
                    </View>

                    <TouchableOpacity
                      style={[styles.statItem, styles.statItemSection]}
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

                    <View style={[styles.statItem, styles.statItemSection]}>
                      <Image
                        source={require('../../assets/comment_icon.png')}
                        style={styles.statIcon}
                      />
                      <Text style={styles.statText}>{comments.length}</Text>
                    </View>
                  </View>
                </View>
                {!post.is_anonymous && post.author_id !== user?.id && (
                  <TouchableOpacity style={styles.statItem} onPress={handleCoffeeChat}>
                    <Image
                      source={require('../../assets/coffee_chat_icon.png')}
                      style={styles.coffeeChatIcon}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.commentsSection}>
              <Text style={styles.commentsTitle}>Comments ({comments.length})</Text>

              {comments.map((comment) => (
                <View key={comment.id} style={styles.commentCard}>
                  <View style={styles.commentHeader}>
                    <View style={styles.commentAuthorRow}>
                      {comment.is_anonymous ? (
                        <Image
                          source={require('../../assets/anon_profile_icon.png')}
                          style={styles.commentAuthorIcon}
                        />
                      ) : null}
                      <Text style={styles.commentAuthor}>
                        {comment.is_anonymous ? 'Anonymous' : 'User'}
                      </Text>
                    </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: 'transparent',
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    gap: spacing.sm,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  headerTitles: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.primary,
  },
  schoolName: {
    fontSize: fontSize.sm,
    color: '#606060',
    marginTop: 1,
  },
  headerSide: {
    width: 44,
    justifyContent: 'center',
  },
  reportButtonHeader: {
    alignSelf: 'flex-end',
    padding: spacing.sm,
  },
  reportIconHeader: {
    width: 22,
    height: 22,
    tintColor: colors.textSecondary,
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
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing.sm,
  },
  authorAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing.sm,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorAvatarPlaceholderText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  authorInfo: {
    flex: 1,
    minWidth: 0,
  },
  authorName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  postTime: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  postTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  postBody: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 14,
    marginBottom: spacing.md,
  },
  postFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  stats: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statItemSection: {
    flex: 1,
    justifyContent: 'center',
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
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  statTextLiked: {
    color: colors.error,
    fontWeight: '600',
  },
  coffeeChatIcon: {
    width: 22,
    height: 22,
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
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  commentAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  commentAuthorIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
