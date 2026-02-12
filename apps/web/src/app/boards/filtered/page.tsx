'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/lib/useUser';
import { Header } from '@/components/Header';
import { DotPattern } from '@/components/ui/dot-pattern';

interface Post {
  id: string;
  board_id: string;
  title: string;
  body: string;
  is_anonymous: boolean;
  like_count: number;
  comment_count: number;
  view_count: number;
  created_at: string;
}

const FILTER_LABELS: Record<string, string> = {
  'my-posts': 'My Posts',
  'liked': 'Liked Posts',
  'my-comments': 'My Comments',
};

function FilteredContent() {
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter') || 'my-posts';
  const { user, loading: userLoading } = useUser();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoading || !user) return;
    fetchPosts();
  }, [filter, userLoading, user]);

  const fetchPosts = async () => {
    if (!user) return;
    setLoading(true);

    try {
      let data: Post[] = [];

      if (filter === 'my-posts') {
        const { data: result, error } = await supabase
          .from('posts')
          .select('*')
          .eq('author_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);
        if (error) throw error;
        data = result || [];
      } else if (filter === 'liked') {
        const { data: likes, error } = await supabase
          .from('post_likes')
          .select('post_id, posts(*)')
          .eq('user_id', user.id);
        if (error) throw error;
        data = (likes || [])
          .map((l: any) => l.posts)
          .filter(Boolean)
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      } else if (filter === 'my-comments') {
        const { data: comments, error } = await supabase
          .from('comments')
          .select('post_id')
          .eq('author_id', user.id);
        if (error) throw error;
        const postIds = [...new Set((comments || []).map((c: { post_id: string }) => c.post_id))];
        if (postIds.length > 0) {
          const { data: result, error: postsError } = await supabase
            .from('posts')
            .select('*')
            .in('id', postIds)
            .order('created_at', { ascending: false });
          if (postsError) throw postsError;
          data = result || [];
        }
      }

      setPosts(data);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    if (diffHours < 1) return `${Math.floor(diffHours * 60)}m ago`;
    if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading || userLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-umich-blue mx-auto" />
      </div>
    );
  }

  return (
    <>
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {Object.entries(FILTER_LABELS).map(([key, label]) => (
          <Link
            key={key}
            href={`/boards/filtered?filter=${key}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === key
                ? 'bg-umich-blue text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Posts */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg">
        {posts.length === 0 ? (
          <div className="text-center py-12 px-6">
            <p className="text-gray-500 dark:text-gray-400">No posts found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/boards/${post.board_id}/posts/${post.id}`}
                className="block px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {post.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                  {post.body}
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
                  <span>👍 {post.like_count}</span>
                  <span>💬 {post.comment_count}</span>
                  <span>👁️ {post.view_count}</span>
                  <span>{formatDate(post.created_at)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function FilteredPostsPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 relative">
      <DotPattern className="opacity-70" />
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Header />

        <div className="mb-6">
          <Link
            href="/boards"
            className="text-blue-600 dark:text-blue-400 hover:underline mb-2 inline-block"
          >
            ← Back to Boards
          </Link>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Your Posts
          </h2>
        </div>

        <Suspense fallback={
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-umich-blue mx-auto" />
          </div>
        }>
          <FilteredContent />
        </Suspense>
      </div>
    </main>
  );
}
