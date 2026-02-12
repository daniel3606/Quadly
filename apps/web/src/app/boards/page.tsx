'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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
      <main className="flex min-h-screen flex-col items-center justify-center p-8 md:p-12 bg-gradient-to-b from-background to-background-subtle dark:from-[#1a1a1a] dark:to-[#0d0d0d]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-border border-t-primary mx-auto mb-4" />
          <p className="text-sm md:text-base text-text-secondary">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-background-subtle dark:from-[#1a1a1a] dark:to-[#0d0d0d]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <Header />

        <div className="mt-6 md:mt-8 mb-6 md:mb-8">
          <h1 className="text-xl md:text-2xl font-semibold text-text mb-1 md:mb-2">
            Community
          </h1>
          <p className="text-sm md:text-base text-text-secondary max-w-2xl">
            Explore discussion boards and join conversations
          </p>
        </div>

        {/* Quick actions - web-friendly button group */}
        <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-6 md:mb-8">
          <Link
            href="/boards/search"
            className="inline-flex items-center gap-2 px-4 py-2.5 md:px-5 md:py-3 bg-background-secondary dark:bg-white/10 text-text rounded-lg hover:bg-background-secondary/80 dark:hover:bg-white/15 transition-colors text-sm font-medium border border-border/50"
          >
            <Image src="/assets/search_icon.png" alt="" width={18} height={18} className="opacity-80" />
            Search Posts
          </Link>
          <Link
            href="/boards/filtered?filter=my-posts"
            className="inline-flex items-center gap-2 px-4 py-2.5 md:px-5 md:py-3 bg-background-secondary dark:bg-white/10 text-text rounded-lg hover:bg-background-secondary/80 dark:hover:bg-white/15 transition-colors text-sm font-medium border border-border/50"
          >
            My Posts
          </Link>
          <Link
            href="/boards/filtered?filter=liked"
            className="inline-flex items-center gap-2 px-4 py-2.5 md:px-5 md:py-3 bg-background-secondary dark:bg-white/10 text-text rounded-lg hover:bg-background-secondary/80 dark:hover:bg-white/15 transition-colors text-sm font-medium border border-border/50"
          >
            Liked Posts
          </Link>
          <Link
            href="/boards/filtered?filter=my-comments"
            className="inline-flex items-center gap-2 px-4 py-2.5 md:px-5 md:py-3 bg-background-secondary dark:bg-white/10 text-text rounded-lg hover:bg-background-secondary/80 dark:hover:bg-white/15 transition-colors text-sm font-medium border border-border/50"
          >
            My Comments
          </Link>
        </div>

        {/* Boards - list on mobile, card grid on desktop */}
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base md:text-lg font-semibold text-text">
            All Boards
          </h2>
          <p className="text-xs md:text-sm text-text-secondary">
            {boards.length} board{boards.length !== 1 ? 's' : ''} available
          </p>
        </div>

        {boards.length === 0 ? (
          <div className="bg-background dark:bg-white/5 rounded-card shadow-card border border-border/50 p-8 md:p-12 text-center">
            <p className="text-sm md:text-base text-text-secondary">
              No boards available at the moment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
            {boards.map((board) => (
              <Link
                key={board.id}
                href={`/boards/${board.key}`}
                className="group flex items-center justify-between gap-4 p-4 md:p-5 bg-background dark:bg-white/5 rounded-card shadow-card border border-border/50 hover:border-border hover:shadow-card-lg transition-all"
              >
                <span className="text-sm md:text-base font-semibold text-text group-hover:text-primary truncate">
                  {board.name}
                </span>
                <span className="text-xs md:text-sm text-text-secondary shrink-0">
                  View discussions →
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
