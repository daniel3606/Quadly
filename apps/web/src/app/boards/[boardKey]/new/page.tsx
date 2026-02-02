'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { createPostSchema, CreatePostInput } from '@quadly/shared';
import { Header } from '@/components/Header';

interface Board {
  id: string;
  key: string;
  name: string;
  anon_mode: string;
}

export default function NewPostPage() {
  const router = useRouter();
  const params = useParams();
  const boardKey = params.boardKey as string;

  const [board, setBoard] = useState<Board | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }

    apiClient.setToken(token);
    loadBoard();
  }, [boardKey]);

  const loadBoard = async () => {
    try {
      const boardData = await apiClient.get<Board>(`/boards/${boardKey}`);
      setBoard(boardData);
      // Force anonymous if board requires it
      if (boardData.anon_mode === 'forced') {
        setIsAnonymous(true);
      }
    } catch (error) {
      console.error('Failed to load board:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !body.trim()) {
      alert('Please enter title and content.');
      return;
    }

    try {
      setSubmitting(true);
      const input: CreatePostInput = {
        title: title.trim(),
        body: body.trim(),
        is_anonymous: isAnonymous,
      };

      const post = await apiClient.post<{ id: string }>(`/boards/${boardKey}/posts`, input);
      router.push(`/boards/${boardKey}/posts/${post.id}`);
    } catch (error: any) {
      console.error('Failed to create post:', error);
      alert(error.message || 'Failed to create post.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!board) {
    return (
      <main className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Header />
        
        <div className="mb-6">
          <Link
            href={`/boards/${boardKey}`}
            className="text-blue-600 dark:text-blue-400 hover:underline mb-2 inline-block"
          >
            ← Back to {board.name}
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            New Post
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          {/* Anonymous Toggle */}
          {board.anon_mode === 'forced' ? (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                🔒 This board is anonymous only.
              </p>
            </div>
          ) : board.anon_mode === 'optional' ? (
            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Post anonymously
                </span>
              </label>
            </div>
          ) : null}

          {/* Title */}
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter title"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {title.length} / 200
            </p>
          </div>

          {/* Body */}
          <div className="mb-6">
            <label htmlFor="body" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Content
            </label>
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={10000}
              required
              rows={15}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              placeholder="Enter content"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {body.length} / 10,000
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end">
            <Link
              href={`/boards/${boardKey}`}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || !title.trim() || !body.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
