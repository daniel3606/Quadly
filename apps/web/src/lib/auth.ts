import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

/**
 * Get the current user session on the server side
 * Returns null if not authenticated
 */
export async function getSession() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

/**
 * Get the current user on the server side
 * Returns null if not authenticated
 */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Require authentication - redirects to login if not authenticated
 * Returns the user if authenticated
 */
export async function requireAuth() {
  const user = await getUser();
  if (!user) {
    redirect('/login');
  }
  return user;
}

/**
 * Get the access token for API calls
 * Returns null if not authenticated
 */
export async function getAccessToken() {
  const session = await getSession();
  return session?.access_token || null;
}
