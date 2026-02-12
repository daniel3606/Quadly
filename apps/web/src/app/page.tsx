'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/lib/useUser';
import { Header } from '@/components/Header';

interface Board {
  id: string;
  key: string;
  name: string;
  visibility: string;
  anon_mode: string;
  order_index: number;
}

interface Post {
  id: string;
  title: string;
  board_id: string;
  like_count: number;
  comment_count: number;
  view_count: number;
  created_at: string;
}

export default function Home() {
  const { user, loading: userLoading } = useUser();
  const [boards, setBoards] = useState<Board[]>([]);
  const [hotPosts, setHotPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoading) return;
    fetchData();
  }, [userLoading]);

  const fetchData = async () => {
    try {
      const [boardsRes, postsRes] = await Promise.all([
        supabase
          .from('boards')
          .select('*')
          .order('order_index', { ascending: true })
          .order('name', { ascending: true }),
        supabase
          .from('posts')
          .select('id, title, board_id, like_count, comment_count, view_count, created_at')
          .order('like_count', { ascending: false })
          .limit(5),
      ]);

      if (boardsRes.error) throw boardsRes.error;
      if (postsRes.error) throw postsRes.error;

      setBoards(boardsRes.data || []);
      setHotPosts(postsRes.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const boardKeyMap = Object.fromEntries(boards.map((b) => [b.id, b.key]));

  if (loading || userLoading) {
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mt-6 md:mt-8">
          {/* Boards - list on mobile, card grid on desktop */}
          <div className="lg:col-span-2">
            <section>
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h2 className="text-base md:text-lg lg:text-xl font-semibold text-text">
                  Boards
                </h2>
                <Link
                  href="/boards"
                  className="text-sm font-medium text-link hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
                >
                  View All
                </Link>
              </div>
              <div className="bg-background rounded-card shadow-card overflow-hidden dark:bg-white/5 border border-border/50">
                <div className="divide-y divide-border">
                  {boards.length === 0 ? (
                    <div className="p-6 md:p-8 text-center">
                      <p className="text-sm md:text-base text-text-light">No boards yet</p>
                      <p className="text-xs md:text-sm text-text-secondary mt-1">Boards will appear here</p>
                    </div>
                  ) : (
                    boards.slice(0, 6).map((board) => (
                      <Link
                        key={board.id}
                        href={`/boards/${board.key}`}
                        className="flex items-center px-4 md:px-6 py-3 md:py-4 hover:bg-background-secondary/50 dark:hover:bg-white/5 transition-colors"
                      >
                        <span className="text-sm md:text-base font-semibold text-text min-w-0 flex-1 md:max-w-[12rem] truncate">
                          {board.name}
                        </span>
                        <span className="text-xs md:text-sm text-text-secondary truncate ml-2 flex-shrink-0">
                          {board.anon_mode === 'forced' && 'Anonymous Only'}
                          {board.anon_mode === 'optional' && 'Anonymous Optional'}
                        </span>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Hot Posts - sidebar with readable typography */}
          <div className="lg:col-span-1">
            <section>
              <h2 className="text-base md:text-lg font-semibold text-text mb-3 md:mb-4">
                Hot Posts Today
              </h2>
              <div className="bg-background rounded-card shadow-card overflow-hidden dark:bg-white/5 border border-border/50">
                {hotPosts.length === 0 ? (
                  <div className="p-6 md:p-8 text-center">
                    <p className="text-sm md:text-base text-text-light">No hot posts today</p>
                    <p className="text-xs md:text-sm text-text-secondary mt-1">Check back later</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {hotPosts.map((post) => (
                      <Link
                        key={post.id}
                        href={`/boards/${boardKeyMap[post.board_id] || 'general'}/posts/${post.id}`}
                        className="flex items-center gap-3 md:gap-4 px-4 md:px-5 py-3 md:py-4 hover:bg-background-secondary/50 dark:hover:bg-white/5 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm md:text-base font-semibold text-text line-clamp-2 leading-snug">
                            {post.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-3 md:gap-4 shrink-0 text-text-light">
                          <span className="flex items-center gap-1.5" title="Views">
                            <Image src="/assets/view_icon.png" alt="" width={14} height={14} className="opacity-70" />
                            <span className="text-xs md:text-sm">{post.view_count}</span>
                          </span>
                          <span className="flex items-center gap-1.5" title="Likes">
                            <Image src="/assets/like_icon.png" alt="" width={14} height={14} className="opacity-70" />
                            <span className="text-xs md:text-sm">{post.like_count}</span>
                          </span>
                          <span className="flex items-center gap-1.5" title="Comments">
                            <Image src="/assets/comment_icon.png" alt="" width={14} height={14} className="opacity-70" />
                            <span className="text-xs md:text-sm">{post.comment_count}</span>
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
