'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { Header } from '@/components/Header';
import { DotPattern } from '@/components/ui/dot-pattern';
import { cn } from '@/lib/utils';

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
    if (typeof window === 'undefined') return;
    let cancelled = false;
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      setLoading(false);
      return;
    }
    apiClient.setToken(token);
    apiClient.get<Board[]>('/boards')
      .then((boardsData) => {
        if (!cancelled) {
          setBoards(boardsData);
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error('Failed to fetch data:', error);
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [router]);

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-umich-blue mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 relative">
      <DotPattern className="opacity-70" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Header />

        <div className="mt-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
            Community
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Explore discussion boards and join conversations
          </p>
        </div>

        <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                All Boards
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {boards.length} board{boards.length !== 1 ? 's' : ''} available
              </p>
            </div>
          </div>
          {boards.length === 0 ? (
            <div className="text-center py-12 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <p className="text-gray-500 dark:text-gray-400">
                No boards available at the moment.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {boards.map((board, index) => (
                <div
                  key={board.id}
                  className={cn(
                    'opacity-0 animate-fade-in-up',
                    'group relative overflow-hidden rounded-xl',
                    'bg-white dark:bg-gray-800/80',
                    'border-0 shadow-lg hover:shadow-xl',
                    'outline-none ring-0',
                    'transition-all duration-300 ease-out'
                  )}
                  style={{ animationDelay: `${index * 0.06}s`, animationFillMode: 'forwards' }}
                >
                  <Link href={`/boards/${board.key}`} className="block p-5 outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-umich-blue dark:group-hover:text-umich-blue transition-colors">
                      {board.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      View discussions →
                    </p>
                  </Link>
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl"
                    style={{
                      background: 'linear-gradient(105deg, transparent 40%, rgba(0, 39, 76, 0.03) 45%, rgba(0, 39, 76, 0.06) 50%, transparent 55%)',
                      backgroundSize: '200% 100%',
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
