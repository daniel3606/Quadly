'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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

export default function BoardsPage() {
  const router = useRouter();
  const [boards, setBoards] = useState<Board[]>([]);
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

    // Fetch boards
    apiClient.get<Board[]>('/boards')
      .then((boardsData) => {
        if (!cancelled) {
          setBoards(boardsData);
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

        {/* Page Header */}
        <div className="mt-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            All Boards
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Explore discussion boards and join conversations
          </p>
        </div>

        {/* All Boards Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                All Boards
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {boards.length} board{boards.length !== 1 ? 's' : ''} available
              </p>
            </div>
          </div>
          {boards.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                No boards available at the moment.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {boards.map((board) => (
                <div
                  key={board.id}
                  className="group block p-5 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 transition-all"
                >
                  <Link href={`/boards/${board.key}`}>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {board.name}
                    </h3>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
