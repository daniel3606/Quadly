'use client';

import { useState, useEffect, useRef } from 'react';
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

export default function CommunitySearchPage() {
  const { loading: userLoading } = useUser();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Post[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      setHasSearched(true);
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .or(`title.ilike.%${query}%,body.ilike.%${query}%`)
          .order('created_at', { ascending: false })
          .limit(50);
        if (error) throw error;
        setResults(data || []);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    if (diffHours < 1) return `${Math.floor(diffHours * 60)}m ago`;
    if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (userLoading) {
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
            Search Posts
          </h2>
        </div>

        {/* Search Input */}
        <div className="mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts by title or content..."
            autoFocus
            className="w-full px-5 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-lg"
          />
        </div>

        {/* Results */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg">
          {searching ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-umich-blue mx-auto" />
            </div>
          ) : hasSearched && results.length === 0 ? (
            <div className="text-center py-12 px-6">
              <p className="text-gray-500 dark:text-gray-400">No posts found for &ldquo;{query}&rdquo;</p>
            </div>
          ) : results.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {results.map((post) => (
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
          ) : !hasSearched ? (
            <div className="text-center py-12 px-6">
              <p className="text-gray-400 dark:text-gray-500">Start typing to search posts</p>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
