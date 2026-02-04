'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import UniversityDropdown from '@/components/UniversityDropdown';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function LoginPage() {
  const [selectedUniversity, setSelectedUniversity] = useState<string | null>(null);
  const [universities, setUniversities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.push('/');
      }
    });

    // Fetch universities (if still needed for your app logic)
    // You can remove this if not needed for Supabase auth
    // For now, keeping it for potential future use
  }, [router, supabase.auth]);

  const handleGoogleLogin = async () => {
    if (!selectedUniversity) {
      alert('Please select a university first');
      return;
    }
    
    setLoading(true);

    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const redirectTo = `${siteUrl}/auth/callback`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('Error signing in:', error);
        alert('Failed to sign in. Please try again.');
        setLoading(false);
      }
      // Note: If successful, user will be redirected to Google, so we don't need to handle success here
    } catch (error) {
      console.error('Unexpected error:', error);
      alert('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-white dark:bg-gray-900">
      <div className="absolute top-8 right-8">
        <ThemeToggle />
      </div>
      <div className="z-10 max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-white">
            Welcome to Quadly
          </h1>
          
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
            Please select your university to continue
          </p>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              University
            </label>
            <UniversityDropdown
              universities={universities}
              selectedUniversity={selectedUniversity}
              onSelect={setSelectedUniversity}
            />
          </div>

          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              disabled={!selectedUniversity || loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {loading ? 'Signing in...' : 'Continue with Google'}
            </button>
          </div>

          <p className="mt-6 text-xs text-center text-gray-500 dark:text-gray-400">
            Only @umich.edu email addresses are allowed
          </p>
        </div>
      </div>
    </div>
  );
}
