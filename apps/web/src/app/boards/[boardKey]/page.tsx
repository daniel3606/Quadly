'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { Header } from '@/components/Header';

interface Board {
  id: string;
  key: string;
  name: string;
  visibility: string;
  anon_mode: string;
}

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
}

export default function BoardPage() {
  const router = useRouter();
  const params = useParams();
  const boardKey = params.boardKey as string;

  const [board, setBoard] = useState<Board | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState<'new' | 'hot'>('new');
  const [isPinned, setIsPinned] = useState(false);
  const [pinning, setPinning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }

    apiClient.setToken(token);

    const loadBoard = async () => {
      try {
        const boardData = await apiClient.get<Board>(`/boards/${boardKey}`);
        setBoard(boardData);
      } catch (error) {
        console.error('Failed to load board:', error);
      }
    };

    const checkPinnedStatus = async () => {
      try {
        const pinnedBoards = await apiClient.get<Array<{ board: { key: string } }>>('/boards/pinned');
        const pinned = pinnedBoards.some((pb) => pb.board.key === boardKey);
        setIsPinned(pinned);
        setError(null);
      } catch (error: any) {
        console.error('Failed to check pinned status:', error);
        // Don't show error for pinned status check - it's not critical
        setError(null);
      }
    };

    const loadPosts = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get<{
          data: Post[];
          pagination: { page: number; pageSize: number; total: number; totalPages: number };
        }>(`/boards/${boardKey}/posts?page=${page}&pageSize=20&sort=${sort}`);
        setPosts(response.data);
        setTotalPages(response.pagination.totalPages);
      } catch (error) {
        console.error('Failed to load posts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBoard();
    checkPinnedStatus();
    loadPosts();
  }, [boardKey, page, sort, router]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US');
  };

  const togglePin = async () => {
    if (pinning) return;

    setPinning(true);
    setError(null);
    const previousPinnedState = isPinned;

    // Optimistic update for better UX
    setIsPinned(!isPinned);

    try {
      if (previousPinnedState) {
        await apiClient.delete(`/boards/${boardKey}/pin`);
      } else {
        await apiClient.post(`/boards/${boardKey}/pin`);
      }
      // Refresh pinned status to ensure consistency with server
      const pinnedBoards = await apiClient.get<Array<{ board: { key: string } }>>('/boards/pinned');
      const pinned = pinnedBoards.some((pb) => pb.board.key === boardKey);
      setIsPinned(pinned);
    } catch (error: any) {
      console.error('Failed to toggle pin:', error);
      setError(error.message || 'Failed to update pin status. Please try again.');
      // Revert optimistic update on error
      setIsPinned(previousPinnedState);
    } finally {
      setPinning(false);
    }
  };

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Header />
        
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {board?.name || 'Board'}
              </h1>
              <button
                onClick={togglePin}
                disabled={pinning}
                className={`p-2 rounded-lg transition-colors ${
                  isPinned
                    ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-800'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                } ${pinning ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={isPinned ? 'Unpin board' : 'Pin board'}
              >
                {pinning ? '⏳' : isPinned ? '📌' : '📍'}
              </button>
            </div>
            {error && (
              <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}
            {board && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {board.anon_mode === 'forced' && '🔒 Anonymous Only Board'}
                {board.anon_mode === 'optional' && '👤 Anonymous Optional'}
              </p>
            )}
          </div>
          <Link
            href={`/boards/${boardKey}/new`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center font-medium whitespace-nowrap"
          >
            + New Post
          </Link>
        </div>

        {/* Sort Options */}
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setSort('new')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              sort === 'new'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Newest
          </button>
          <button
            onClick={() => setSort('hot')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              sort === 'hot'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Hot
          </button>
        </div>

        {/* Posts List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {loading && posts.length === 0 ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No posts yet. Be the first to post!
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/boards/${boardKey}/posts/${post.id}`}
                  className="block p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                    {post.body}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>
                      {post.is_anonymous
                        ? post.author.anonymous_handle || 'Anonymous'
                        : post.author.nickname || 'Unknown'}
                    </span>
                    <span>·</span>
                    <span>{formatDate(post.created_at)}</span>
                    <span>·</span>
                    <span>👍 {post.like_count}</span>
                    <span>💬 {post.comment_count}</span>
                    <span>👁️ {post.view_count}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 flex justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
