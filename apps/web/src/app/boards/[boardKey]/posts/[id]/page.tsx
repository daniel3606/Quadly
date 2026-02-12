'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { apiClient } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/lib/useUser';
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
  const [showReportMenu, setShowReportMenu] = useState(false);
  const [reportStatus, setReportStatus] = useState<'idle' | 'submitting' | 'done' | 'duplicate'>('idle');
  const { user: supabaseUser } = useUser();

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

  const handleReport = async (reason: string) => {
    if (!supabaseUser || !post) return;
    setReportStatus('submitting');
    try {
      const { error } = await supabase.from('post_reports').insert({
        post_id: post.id,
        reporter_id: supabaseUser.id,
        reason,
      });
      if (error) {
        if (error.code === '23505') {
          setReportStatus('duplicate');
        } else {
          throw error;
        }
      } else {
        setReportStatus('done');
      }
    } catch (error) {
      console.error('Failed to report post:', error);
      alert('Failed to submit report.');
      setReportStatus('idle');
    }
    setShowReportMenu(false);
  };

  const handleCoffeeChat = async () => {
    if (!supabaseUser || !post?.author?.id) return;
    try {
      const { data, error } = await supabase.rpc('get_or_create_post_conversation', {
        p_post_id: post.id,
        p_other_user_id: post.author.id,
      });
      if (error) throw error;
      router.push(`/messages/${data}`);
    } catch (error) {
      console.error('Failed to start coffee chat:', error);
      alert('Failed to start conversation.');
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
      <main className="min-h-screen bg-gradient-to-b from-background to-background-subtle dark:from-[#1a1a1a] dark:to-[#0d0d0d] flex items-center justify-center p-8 md:p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-border border-t-primary mx-auto mb-4"></div>
          <p className="text-sm md:text-base text-text-secondary">Loading...</p>
        </div>
      </main>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-background-subtle dark:from-[#1a1a1a] dark:to-[#0d0d0d]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <Header />

        <div className="mb-4 md:mb-6">
          <Link
            href={`/boards/${boardKey}`}
            className="text-link hover:underline text-sm md:text-base font-medium inline-flex items-center gap-2 rounded focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <Image src="/assets/back_icon.png" alt="" width={16} height={16} className="dark:invert" />
            Back to {post.board?.name || 'Board'}
          </Link>
        </div>

        {/* Post card - readable width and padding on desktop */}
        <article className="bg-background dark:bg-white/5 rounded-card shadow-card border border-border/50 p-6 md:p-8 mb-6 md:mb-8">
          <h1 className="text-xl md:text-2xl font-semibold text-text mb-3 md:mb-4 leading-tight">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs md:text-sm text-text-secondary mb-4 md:mb-6">
            <span>
              {post.is_anonymous
                ? post.author.anonymous_handle || 'Anonymous'
                : post.author.nickname || 'Unknown'}
            </span>
            <span>·</span>
            <span>{formatDate(post.created_at)}</span>
            <span className="flex items-center gap-1">
              <Image src="/assets/view_icon.png" alt="" width={12} height={12} className="opacity-70 dark:invert" />
              {post.view_count}
            </span>
          </div>
          <div className="prose dark:prose-invert max-w-none mb-6 md:mb-8">
            <p className="whitespace-pre-wrap text-sm md:text-base text-text-light leading-relaxed max-w-none">
              {post.body}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 md:gap-4 pt-4 md:pt-6 border-t border-border">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                post.is_liked
                  ? 'text-error font-semibold'
                  : 'text-text-secondary hover:text-text'
              }`}
            >
              <img
                src="/assets/like_icon.png"
                alt=""
                width={14}
                height={14}
                className={post.is_liked ? 'opacity-100' : 'opacity-70'}
                style={post.is_liked ? { filter: 'brightness(0) saturate(100%) invert(27%) sepia(98%) saturate(2947%) hue-rotate(346deg)' } : undefined}
              />
              {post.like_count}
            </button>
            <span className="flex items-center gap-2 text-text-secondary text-sm">
              <Image src="/assets/comment_icon.png" alt="" width={14} height={14} className="opacity-70 dark:invert" />
              {post.comment_count}
            </span>

            <div className="ml-auto flex items-center gap-2">
              {/* Coffee Chat */}
              {!post.is_anonymous && post.author?.id && supabaseUser?.id !== post.author.id && (
                <button
                  onClick={handleCoffeeChat}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-background-secondary dark:bg-white/10 text-text hover:opacity-90 text-sm font-medium"
                >
                  <Image src="/assets/coffee_chat_icon.png" alt="" width={16} height={16} />
                  Coffee Chat
                </button>
              )}

              {/* Report */}
              <div className="relative">
                {reportStatus === 'done' ? (
                  <span className="px-3 py-2 text-sm text-success font-medium">Reported</span>
                ) : reportStatus === 'duplicate' ? (
                  <span className="px-3 py-2 text-sm text-text-secondary">Already reported</span>
                ) : (
                  <>
                    <button
                      onClick={() => setShowReportMenu(!showReportMenu)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-background-secondary dark:bg-white/10 text-text-secondary hover:text-text text-sm"
                    >
                      <Image src="/assets/report_icon.png" alt="" width={14} height={14} className="opacity-80 dark:invert" />
                      Report
                    </button>
                    {showReportMenu && (
                      <div className="absolute right-0 bottom-full mb-2 w-48 bg-background dark:bg-white/10 rounded-card shadow-card border border-border py-1 z-10">
                        {['Spam', 'Harassment', 'Inappropriate', 'Misinformation', 'Other'].map((reason) => (
                          <button
                            key={reason}
                            onClick={() => handleReport(reason)}
                            disabled={reportStatus === 'submitting'}
                            className="w-full text-left px-4 py-2 text-sm text-text hover:bg-background-secondary dark:hover:bg-white/10 transition-colors"
                          >
                            {reason}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </article>

        {/* Comments */}
        <section className="bg-background dark:bg-white/5 rounded-card shadow-card border border-border/50 p-6 md:p-8">
          <h2 className="text-base md:text-lg font-semibold text-text mb-4 md:mb-6">
            Comments ({comments.length})
          </h2>

          <form onSubmit={handleCommentSubmit} className="mb-6 md:mb-8">
            <textarea
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              placeholder="Enter comment..."
              rows={3}
              className="w-full px-4 py-3 md:py-3.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background dark:bg-white/5 text-text dark:text-white resize-none mb-3 text-sm md:text-base"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submittingComment || !commentBody.trim()}
                className="px-4 py-2.5 md:px-5 md:py-3 bg-primary text-background rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity font-medium text-sm md:text-base"
              >
                {submittingComment ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </form>

          <div className="space-y-3 md:space-y-4">
            {comments.length === 0 ? (
              <p className="text-text-secondary text-sm md:text-base text-center py-8 md:py-10">
                No comments yet.
              </p>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className="p-4 md:p-5 border border-border rounded-card bg-background-secondary/30 dark:bg-white/5"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm md:text-base font-medium text-text">
                      {comment.is_anonymous
                        ? comment.author.anonymous_handle || 'Anonymous'
                        : comment.author.nickname || 'Unknown'}
                    </span>
                    <span className="text-xs md:text-sm text-text-secondary">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-sm md:text-base text-text-light whitespace-pre-wrap leading-relaxed">
                    {comment.body}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
