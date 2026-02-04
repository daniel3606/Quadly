'use client';

import { apiClient } from './api';
import { createClient } from './supabase/client';

/**
 * Initialize API client with Supabase token support
 * Call this once in your app initialization
 */
export function initializeApiClient() {
  const supabase = createClient();
  
  apiClient.setSupabaseTokenGetter(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  });
}
