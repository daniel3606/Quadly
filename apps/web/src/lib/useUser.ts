'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

export function useUser() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user);
        setLoading(false);
      } else {
        // Fallback: check legacy auth token
        const token = localStorage.getItem('auth_token');
        if (!token) {
          router.push('/login');
        }
        setLoading(false);
      }
    });
  }, [router]);

  return { user, loading };
}
