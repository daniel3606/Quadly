'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { Header } from '@/components/Header';

interface Post {
  id: string;
  title: string;
  body: string;
  author: {
    id: string | null;
    nickname: string | null;
    anonymous_handle?: string;
  };
  is_anonymous: boolean;
  like_count: number;
  comment_count: number;
  view_count: number;
  created_at: string;
  board?: {
    key: string;
    name: string;
  };
  is_liked?: boolean;
}

interface Comment {
  id: string;
  body: string;
  author: {
    id: string | null;
    nickname: string | null;
    anonymous_handle?: string;
  };
  is_anonymous: boolean;
  created_at: string;
}

export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams();
  const boardKey = params.boardKey as string;
  const postId = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentBody, setCommentBody] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }

    apiClient.setToken(token);
    loadPost();
    loadComments();
  }, [postId]);

  const loadPost = async () => {
    try {
      const postData = await apiClient.get<Post>(`/boards/${boardKey}/posts/${postId}`);
      setPost(postData);
    } catch (error) {
      console.error('Failed to load post:', error);
      router.push(`/boards/${boardKey}`);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const commentsData = await apiClient.get<Comment[]>(`/posts/${postId}/comments`);
      setComments(commentsData);
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const handleLike = async () => {
    if (!post) return;
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
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentBody.trim()) return;

    try {
      setSubmittingComment(true);
      await apiClient.post(`/posts/${postId}/comments`, {
        body: commentBody.trim(),
      });
      setCommentBody('');
      loadComments();
      if (post) {
        setPost({ ...post, comment_count: post.comment_count + 1 });
      }
    } catch (error) {
      console.error('Failed to submit comment:', error);
      alert('Failed to post comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </main>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Header />
        
        <div className="mb-4">
          <Link
            href={`/boards/${boardKey}`}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Back to {post.board?.name || 'Board'}
          </Link>
        </div>

        {/* Post */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {post.title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-6">
            <span>
              {post.is_anonymous
                ? post.author.anonymous_handle || 'Anonymous'
                : post.author.nickname || 'Unknown'}
            </span>
            <span>·</span>
            <span>{formatDate(post.created_at)}</span>
            <span>·</span>
            <span>👁️ {post.view_count}</span>
          </div>
          <div className="prose dark:prose-invert max-w-none mb-6">
            <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
              {post.body}
            </p>
          </div>
          <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                post.is_liked
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              👍 {post.like_count}
            </button>
            <span className="text-gray-500 dark:text-gray-400">💬 {post.comment_count}</span>
          </div>
        </div>

        {/* Comments */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Comments ({comments.length})
          </h2>

          {/* Comment Form */}
          <form onSubmit={handleCommentSubmit} className="mb-6">
            <textarea
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              placeholder="Enter comment..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none mb-2"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submittingComment || !commentBody.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submittingComment ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No comments yet.
              </p>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {comment.is_anonymous
                        ? comment.author.anonymous_handle || 'Anonymous'
                        : comment.author.nickname || 'Unknown'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {comment.body}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
