'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { Header } from '@/components/Header';

interface Post {
  id: string;
  title: string;
  board_id: string;
  board?: {
    key: string;
    name: string;
  };
  like_count: number;
  comment_count: number;
  view_count: number;
  created_at: string;
}

interface User {
  id: string;
  email: string;
  nickname: string;
  email_verified: boolean;
  role: string;
  school: string;
}

interface University {
  id: string;
  name: string;
  domain: string;
}

interface PinnedBoard {
  id: string;
  board: {
    id: string;
    key: string;
    name: string;
    visibility: string;
    anon_mode: string;
  };
  created_at: string;
}

export default function Home() {
  const router = useRouter();
  const [hotPosts, setHotPosts] = useState<Post[]>([]);
  const [pinnedBoards, setPinnedBoards] = useState<PinnedBoard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    let cancelled = false;
    
    // Check if user is authenticated
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      setLoading(false);
      return;
    }

    // Set token for API client
    apiClient.setToken(token);

    // Fetch hot posts and pinned boards in parallel
    Promise.all([
      apiClient.get<{ data: Post[] }>('/boards/hot/posts?pageSize=5'),
      apiClient.get<PinnedBoard[]>('/boards/pinned'),
    ])
      .then(([postsData, pinnedData]) => {
        if (!cancelled) {
          setHotPosts(postsData.data || []);
          setPinnedBoards(pinnedData || []);
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error('Failed to fetch data:', error);
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Header />

        {/* Welcome Section */}
        <div className="mt-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your campus community hub for discussions, course reviews, and more.
          </p>
        </div>

        {/* Pinned Boards Section */}
        <div className="mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              📌 Pinned Boards
            </h2>
            {pinnedBoards.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  No pinned boards yet.
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Pin boards from board pages to see them here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {pinnedBoards.map((pinnedBoard) => (
                  <Link
                    key={pinnedBoard.id}
                    href={`/boards/${pinnedBoard.board.key}`}
                    className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all"
                  >
                    <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1 hover:text-blue-600 dark:hover:text-blue-400">
                      {pinnedBoard.board.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      /{pinnedBoard.board.key}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Schedule Section */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                📅 Schedule
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Manage your class schedule and track your credits.
              </p>
              <Link
                href="/schedule"
                className="inline-block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                View Schedule →
              </Link>
            </div>
          </div>

          {/* Hot Posts Section */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  🔥 Hot Posts
                </h2>
                <Link
                  href="/boards/hot/posts"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View All
                </Link>
              </div>
              {hotPosts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No hot posts yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {hotPosts.map((post) => (
                    <Link
                      key={post.id}
                      href={`/boards/${post.board?.key || 'free'}/posts/${post.id}`}
                      className="block p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all"
                    >
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2 line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400">
                        {post.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span>👍 {post.like_count}</span>
                        <span>💬 {post.comment_count}</span>
                        <span>👁️ {post.view_count}</span>
                      </div>
                      {post.board && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {post.board.name}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
