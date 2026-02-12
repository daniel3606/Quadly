'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Header } from '@/components/Header';
import { ProfileIcon } from '@/components/ProfileIcon';

interface ProfileUser {
  id: string;
  email: string;
  nickname: string;
  email_verified: boolean;
  role: string;
  school: string;
}

interface University {
  id: string;
  name: string;
  domain: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [collegeName, setCollegeName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push('/login');
        return;
      }

      const meta = authUser.user_metadata || {};
      const universityId = meta.university_id ?? meta.school ?? '';

      const profile: ProfileUser = {
        id: authUser.id,
        email: authUser.email ?? '',
        nickname: meta.full_name || meta.nickname || authUser.email?.split('@')[0] || 'User',
        email_verified: !!authUser.email_confirmed_at,
        role: meta.role || 'user',
        school: universityId,
      };
      setUser(profile);

      if (universityId) {
        const { data: universities } = await supabase
          .from('universities')
          .select('id, name, domain');
        const university = (universities ?? []).find(
          (u) => u.id === universityId
        );
        if (university) setCollegeName(university.name);
      }
      setLoading(false);
    }
    loadProfile();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('auth_token');
    router.push('/login');
  };

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

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Header />

        {/* Page Content */}
        <div className="mb-6">
          <Link
            href="/"
            className="text-blue-600 dark:text-blue-400 hover:underline mb-2 inline-block"
          >
            ← Home
          </Link>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Profile
          </h2>
        </div>

        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <ProfileIcon
                className="w-12 h-12 text-gray-400 dark:text-gray-500"
                size={48}
              />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {user.nickname}
              </h3>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                  <p className="text-gray-900 dark:text-white">{user.email}</p>
                  {user.email_verified ? (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 mt-1">
                      ✓ Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                      ⚠ Not verified
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">University</p>
                  <p className="text-gray-900 dark:text-white">{collegeName || user.school}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Role</p>
                  <p className="text-gray-900 dark:text-white capitalize">{user.role.toLowerCase()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Account Actions
          </h3>
          <div className="space-y-3">
            <Link
              href="/profile/edit"
              className="block w-full px-4 py-2 bg-umich-blue text-white rounded-lg hover:bg-blue-800 transition-colors text-left"
            >
              Edit Profile
            </Link>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-left"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
