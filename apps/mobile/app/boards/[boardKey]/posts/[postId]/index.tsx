import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../../../../src/store/authStore';
import { apiClient } from '../../../../../src/lib/api';

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

interface Comment {
  id: string;
  body: string;
  is_anonymous: boolean;
  author: {
    id: string | null;
    nickname: string | null;
    anonymous_handle?: string;
  };
  created_at: string;
}

export default function PostDetailScreen() {
  const router = useRouter();
  const { boardKey, postId } = useLocalSearchParams<{ boardKey: string; postId: string }>();
  const { token, user } = useAuthStore();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchPost = useCallback(async () => {
    try {
      const postResponse = await apiClient.get<Post>(`/boards/${boardKey}/posts/${postId}`);
      setPost(postResponse);
    } catch (error) {
      console.error('Failed to fetch post:', error);
      // Mock data
      setPost({
        id: postId || '1',
        title: 'Sample Post',
        body: 'This is a sample post content. The API might be unavailable.',
        is_anonymous: false,
        author: { id: '1', nickname: 'User' },
        like_count: 0,
        comment_count: 0,
        view_count: 1,
        created_at: new Date().toISOString(),
      });
    }
  }, [boardKey, postId]);

  const fetchComments = useCallback(async () => {
    try {
      const commentsResponse = await apiClient.get<Comment[]>(`/posts/${postId}/comments`);
      setComments(commentsResponse);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      setComments([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [fetchPost, fetchComments]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPost();
    fetchComments();
  }, [fetchPost, fetchComments]);

  const handleLike = async () => {
    if (!token) {
      Alert.alert('Login Required', 'Please login to like posts.');
      return;
    }

    if (!post) return;

    setLikeLoading(true);
    try {
      if (post.is_liked) {
        await apiClient.delete(`/boards/${boardKey}/posts/${postId}/like`);
        setPost({ ...post, is_liked: false, like_count: post.like_count - 1 });
      } else {
        await apiClient.post(`/boards/${boardKey}/posts/${postId}/like`);
        setPost({ ...post, is_liked: true, like_count: post.like_count + 1 });
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;

    if (!token) {
      Alert.alert('Login Required', 'Please login to comment.');
      return;
    }

    setSubmittingComment(true);
    try {
      const newComment = await apiClient.post<Comment>(`/posts/${postId}/comments`, {
        body: commentText.trim(),
      });

      setComments([...comments, newComment]);
      setCommentText('');

      if (post) {
        setPost({ ...post, comment_count: post.comment_count + 1 });
      }
    } catch (error) {
      console.error('Failed to submit comment:', error);
      Alert.alert('Error', 'Failed to submit comment. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAuthorName = (item: { is_anonymous: boolean; author: { nickname: string | null; anonymous_handle?: string } }) => {
    if (item.is_anonymous) {
      return item.author.anonymous_handle || 'Anonymous';
    }
    return item.author.nickname || 'Unknown';
  };

  if (isLoading && !post) {
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
        <Text style={styles.headerTitle}>Post</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {post && (
            <>
              {/* Post Content */}
              <View style={styles.postCard}>
                <Text style={styles.postTitle}>{post.title}</Text>

                <View style={styles.postMeta}>
                  <Text style={styles.postAuthor}>
                    {post.is_anonymous ? '🔒 ' : ''}{getAuthorName(post)}
                  </Text>
                  <Text style={styles.postDot}>·</Text>
                  <Text style={styles.postTime}>{formatDate(post.created_at)}</Text>
                </View>

                <Text style={styles.postBody}>{post.body}</Text>

                <View style={styles.postActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, post.is_liked && styles.actionButtonActive]}
                    onPress={handleLike}
                    disabled={likeLoading}
                  >
                    {likeLoading ? (
                      <ActivityIndicator size="small" color="#00274C" />
                    ) : (
                      <>
                        <Text style={[styles.actionIcon, post.is_liked && styles.actionIconActive]}>
                          {post.is_liked ? '❤️' : '🤍'}
                        </Text>
                        <Text style={[styles.actionText, post.is_liked && styles.actionTextActive]}>
                          {post.like_count}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <View style={styles.actionButton}>
                    <Text style={styles.actionIcon}>💬</Text>
                    <Text style={styles.actionText}>{post.comment_count}</Text>
                  </View>

                  <View style={styles.actionButton}>
                    <Text style={styles.actionIcon}>👁</Text>
                    <Text style={styles.actionText}>{post.view_count}</Text>
                  </View>
                </View>
              </View>

              {/* Comments Section */}
              <View style={styles.commentsSection}>
                <Text style={styles.commentsTitle}>
                  Comments ({comments.length})
                </Text>

                {comments.length === 0 ? (
                  <View style={styles.emptyComments}>
                    <Text style={styles.emptyCommentsText}>
                      No comments yet. Be the first to comment!
                    </Text>
                  </View>
                ) : (
                  comments.map((comment) => (
                    <View key={comment.id} style={styles.commentCard}>
                      <View style={styles.commentHeader}>
                        <Text style={styles.commentAuthor}>
                          {comment.is_anonymous ? '🔒 ' : ''}{getAuthorName(comment)}
                        </Text>
                        <Text style={styles.commentTime}>
                          {formatDate(comment.created_at)}
                        </Text>
                      </View>
                      <Text style={styles.commentBody}>{comment.body}</Text>
                    </View>
                  ))
                )}
              </View>

              <View style={{ height: 100 }} />
            </>
          )}
        </ScrollView>

        {/* Comment Input */}
        <View style={styles.commentInputContainer}>
          <TextInput
            style={styles.commentInput}
            placeholder="Write a comment..."
            placeholderTextColor="#999999"
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!commentText.trim() || submittingComment) && styles.sendButtonDisabled]}
            onPress={handleSubmitComment}
            disabled={!commentText.trim() || submittingComment}
          >
            {submittingComment ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.sendButtonText}>Send</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  postCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginBottom: 8,
  },
  postTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
    lineHeight: 28,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  postAuthor: {
    fontSize: 14,
    color: '#00274C',
    fontWeight: '500',
  },
  postDot: {
    marginHorizontal: 8,
    color: '#cccccc',
  },
  postTime: {
    fontSize: 14,
    color: '#999999',
  },
  postBody: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
    marginBottom: 20,
  },
  postActions: {
    flexDirection: 'row',
    gap: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionButtonActive: {
    opacity: 1,
  },
  actionIcon: {
    fontSize: 18,
  },
  actionIconActive: {
    opacity: 1,
  },
  actionText: {
    fontSize: 14,
    color: '#666666',
  },
  actionTextActive: {
    color: '#00274C',
    fontWeight: '500',
  },
  commentsSection: {
    backgroundColor: '#ffffff',
    padding: 20,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  emptyComments: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyCommentsText: {
    fontSize: 14,
    color: '#999999',
  },
  commentCard: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '500',
    color: '#00274C',
  },
  commentTime: {
    fontSize: 12,
    color: '#999999',
  },
  commentBody: {
    fontSize: 15,
    color: '#333333',
    lineHeight: 22,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingBottom: 24,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 10,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: '#1a1a1a',
  },
  sendButton: {
    backgroundColor: '#00274C',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500',
  },
});
