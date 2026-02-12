'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for error in URL params
    const hashParams = new URLSearchParams(
      window.location.hash.startsWith('#') ? window.location.hash.substring(1) : ''
    );
    const queryParams = new URLSearchParams(window.location.search);

    const authError = hashParams.get('error') || queryParams.get('error');
    const errorDesc = hashParams.get('error_description') || queryParams.get('error_description');

    if (authError) {
      setError(errorDesc || authError);
      return;
    }

    // For PKCE flow: exchange code for session
    const code = queryParams.get('code');
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          setError(error.message);
        } else {
          router.push('/');
        }
      });
      return;
    }

    // For implicit flow: the browser client auto-detects tokens in the hash
    // Just wait for the session to be established
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.push('/');
      } else {
        // Listen for auth state change
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session) {
            subscription.unsubscribe();
            router.push('/');
          }
        });
        // Timeout fallback
        setTimeout(() => {
          subscription.unsubscribe();
          setError('Authentication timed out. Please try again.');
        }, 10000);
      }
    });
  }, [router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <p className="text-red-600 dark:text-red-400 text-lg font-medium mb-4">Login Failed</p>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-2 bg-umich-blue text-white rounded-lg hover:bg-blue-800 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-umich-blue mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Completing sign in...</p>
      </div>
    </div>
  );
}
