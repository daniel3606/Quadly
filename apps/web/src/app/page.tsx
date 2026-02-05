'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

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

export default function Home() {
  const router = useRouter();
  const [boards, setBoards] = useState<Board[]>([]);
  const [hotPosts, setHotPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Set token for API client
    apiClient.setToken(token);

    // Fetch boards and hot posts
    Promise.all([
      apiClient.get<Board[]>('/boards'),
      apiClient.get<{ data: Post[] }>('/boards/hot/posts?pageSize=5'),
    ])
      .then(([boardsData, postsData]) => {
        setBoards(boardsData);
        setHotPosts(postsData.data || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to fetch data:', error);
        setLoading(false);
      });
  }, [router]);

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Quadly
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            UMich Campus Community Platform
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Boards Section */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Boards
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {boards.map((board) => (
                  <Link
                    key={board.id}
                    href={`/boards/${board.key}`}
                    className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                      {board.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {board.anon_mode === 'forced' && '🔒 Anonymous Only'}
                      {board.anon_mode === 'optional' && '👤 Anonymous Optional'}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Hot Posts Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                🔥 Hot Posts
              </h2>
              {hotPosts.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  No hot posts yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {hotPosts.map((post) => (
                    <Link
                      key={post.id}
                      href={`/boards/${post.board?.key || 'free'}/posts/${post.id}`}
                      className="block p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2 line-clamp-2">
                        {post.title}
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>👍 {post.like_count}</span>
                        <span>💬 {post.comment_count}</span>
                        <span>👁️ {post.view_count}</span>
                      </div>
                    </Link>
                  ))}
                  <Link
                    href="/boards/hot/posts"
                    className="block text-center text-sm text-blue-600 dark:text-blue-400 hover:underline mt-4"
                  >
                    View More →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
