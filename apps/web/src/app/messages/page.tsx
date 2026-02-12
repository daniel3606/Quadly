'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/lib/useUser';
import { Header } from '@/components/Header';
import { DotPattern } from '@/components/ui/dot-pattern';

interface Conversation {
  id: string;
  listing_id: string;
  listing_title: string;
  listing_image?: string;
  last_message?: string;
  last_message_at: string;
  unread_count: number;
}

export default function MessagesPage() {
  const { user, loading: userLoading } = useUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoading || !user) return;
    fetchConversations();
  }, [userLoading, user]);

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_conversations');
      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    if (diffHours < 48) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading || userLoading) {
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

        <div className="mt-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
            Messages
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your conversations
          </p>
        </div>

        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
          {conversations.length === 0 ? (
            <div className="text-center py-16 px-6">
              <p className="text-4xl mb-4">💬</p>
              <p className="text-gray-500 dark:text-gray-400 text-lg">No messages yet</p>
              <p className="text-gray-400 dark:text-gray-500 mt-1">
                Start a conversation by messaging a seller in the marketplace
              </p>
              <Link
                href="/marketplace"
                className="inline-block mt-4 px-5 py-2.5 bg-umich-blue text-white rounded-lg hover:bg-blue-800 transition-colors"
              >
                Browse Marketplace
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {conversations.map((convo) => (
                <Link
                  key={convo.id}
                  href={`/messages/${convo.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  {/* Listing thumbnail */}
                  <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex-shrink-0 overflow-hidden">
                    {convo.listing_image ? (
                      <img
                        src={convo.listing_image}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg">
                        🛍️
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-sm font-semibold truncate ${
                        convo.unread_count > 0
                          ? 'text-gray-900 dark:text-white'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {convo.listing_title || 'Chat'}
                      </h3>
                      <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 ml-2">
                        {formatTime(convo.last_message_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className={`text-sm truncate ${
                        convo.unread_count > 0
                          ? 'text-gray-700 dark:text-gray-300 font-medium'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {convo.last_message || 'No messages yet'}
                      </p>
                      {convo.unread_count > 0 && (
                        <span className="ml-2 flex-shrink-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                          {convo.unread_count > 9 ? '9+' : convo.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
