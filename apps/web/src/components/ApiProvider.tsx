'use client';

import { useEffect } from 'react';
import { initializeApiClient } from '@/lib/api-client';

export function ApiProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize API client with Supabase token support
    initializeApiClient();
  }, []);

  return <>{children}</>;
}
