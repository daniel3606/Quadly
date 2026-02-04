# Authentication Implementation Summary

This document provides a complete overview of the Supabase Auth + Google OAuth implementation.

## File Structure

```
apps/web/src/
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Browser Supabase client (useClient)
│   │   ├── server.ts              # Server Supabase client (useServer)
│   │   └── middleware.ts          # Middleware helper for session refresh
│   ├── auth.ts                    # Server-side auth utilities
│   ├── auth-client.ts             # Client-side auth hooks (useUser, useSignOut)
│   ├── api.ts                     # API client (updated for Supabase tokens)
│   └── api-client.ts              # API client initialization helper
├── app/
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts           # OAuth callback handler (App Router)
│   ├── login/
│   │   └── page.tsx               # Login page with Google OAuth button
│   ├── page.tsx                   # Home page (updated for Supabase auth)
│   └── layout.tsx                 # Root layout with ApiProvider
├── components/
│   ├── ApiProvider.tsx            # Initializes API client with Supabase tokens
│   └── Header.tsx                 # Header component with logout button
└── middleware.ts                  # Next.js middleware for session refresh
```

## Key Components

### 1. Supabase Clients

**`lib/supabase/client.ts`** - Browser client
- Uses `@supabase/ssr` for SSR compatibility
- Safe to use in `'use client'` components
- Handles cookie management automatically

**`lib/supabase/server.ts`** - Server client
- Uses Next.js `cookies()` API
- Safe to use in Server Components and Route Handlers
- Handles cookie read/write securely

**`lib/supabase/middleware.ts`** - Middleware helper
- Refreshes expired sessions automatically
- Updates cookies on each request
- Required for SSR session management

### 2. Auth Utilities

**`lib/auth.ts`** - Server-side utilities
- `getSession()` - Get current session
- `getUser()` - Get current user
- `requireAuth()` - Require auth (redirects if not)
- `getAccessToken()` - Get access token for API calls

**`lib/auth-client.ts`** - Client-side hooks
- `useUser()` - React hook for current user
- `useSignOut()` - React hook for logout

### 3. OAuth Flow

**Login Page** (`app/login/page.tsx`)
1. User clicks "Sign in with Google"
2. Calls `supabase.auth.signInWithOAuth({ provider: 'google' })`
3. Redirects to Google OAuth
4. Google redirects to Supabase callback
5. Supabase redirects to `/auth/callback` with code

**Callback Route** (`app/auth/callback/route.ts`)
1. Receives `code` query parameter
2. Exchanges code for session via `exchangeCodeForSession()`
3. Redirects to home page (`/`)

### 4. Session Management

**Middleware** (`middleware.ts`)
- Runs on every request
- Refreshes expired sessions automatically
- Updates cookies
- Required for SSR to work correctly

**ApiProvider** (`components/ApiProvider.tsx`)
- Initializes API client with Supabase token getter
- Ensures API calls include Authorization header
- Runs once on app initialization

## Environment Variables

### Required Variables

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://waahgmnfykmrlxuvxerw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_L--eGWYoL2TKOsUgfBaA1Q_KeTiC96_

# Site URL - CRITICAL for OAuth redirects
NEXT_PUBLIC_SITE_URL=https://dev.quadly.org  # or https://quadly.org
```

### Optional Variables

```env
# API Configuration (if using backend API)
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## Authentication Flow

```
1. User visits /login
   ↓
2. Clicks "Sign in with Google"
   ↓
3. signInWithOAuth() called
   ↓
4. Redirects to Google OAuth
   ↓
5. User authenticates with Google
   ↓
6. Google redirects to Supabase callback
   ↓
7. Supabase redirects to /auth/callback?code=xxx
   ↓
8. route.ts exchanges code for session
   ↓
9. Session stored in HTTP-only cookies
   ↓
10. Redirects to home page (/)
   ↓
11. Middleware refreshes session on each request
   ↓
12. User sees their email in header
```

## Usage Examples

### Check Authentication (Server Component)

```tsx
import { requireAuth } from '@/lib/auth';

export default async function ProtectedPage() {
  const user = await requireAuth(); // Redirects to /login if not authenticated
  return <div>Hello {user.email}</div>;
}
```

### Check Authentication (Client Component)

```tsx
'use client';

import { useUser } from '@/lib/auth-client';

export default function ProtectedPage() {
  const { user, loading } = useUser();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not authenticated</div>;
  
  return <div>Hello {user.email}</div>;
}
```

### Sign Out

```tsx
'use client';

import { useSignOut } from '@/lib/auth-client';

export default function LogoutButton() {
  const signOut = useSignOut();
  return <button onClick={signOut}>Logout</button>;
}
```

### Make API Call with Auth Token

```tsx
'use client';

import { apiClient } from '@/lib/api';
import { useUser } from '@/lib/auth-client';

export default function ApiExample() {
  const { user } = useUser();
  
  const fetchData = async () => {
    // API client automatically includes Supabase token in Authorization header
    const data = await apiClient.get('/some-endpoint');
    return data;
  };
  
  return <button onClick={fetchData}>Fetch Data</button>;
}
```

## Supabase Dashboard Configuration

### URL Configuration

**Site URL:**
- Development: `https://dev.quadly.org`
- Production: `https://quadly.org`

**Redirect URLs:**
- `https://dev.quadly.org/auth/callback`
- `https://quadly.org/auth/callback`
- `http://localhost:3000/auth/callback` (optional)

### Google OAuth Provider

1. Enable Google provider
2. Add Client ID and Secret
3. In Google Cloud Console, add redirect URI:
   ```
   https://waahgmnfykmrlxuvxerw.supabase.co/auth/v1/callback
   ```

## Testing Checklist

### Local Development

- [ ] `.env.local` file created with correct variables
- [ ] `NEXT_PUBLIC_SITE_URL` matches Cloudflare Tunnel domain
- [ ] Supabase redirect URLs configured
- [ ] Google OAuth credentials configured
- [ ] Can sign in with Google
- [ ] Redirects back to home page after auth
- [ ] Email displayed in header
- [ ] Logout button works
- [ ] Session persists on page refresh

### Production (Vercel)

- [ ] Environment variables set in Vercel Dashboard
- [ ] `NEXT_PUBLIC_SITE_URL` set to `https://quadly.org`
- [ ] Domain configured in Vercel
- [ ] SSL certificate active
- [ ] Can sign in with Google
- [ ] OAuth flow completes successfully
- [ ] Session persists correctly
- [ ] No console errors

## Common Issues & Solutions

### Issue: OAuth redirect fails

**Solution:**
- Verify `NEXT_PUBLIC_SITE_URL` matches actual domain exactly
- Check Supabase redirect URLs match exactly
- Ensure Google OAuth redirect URI includes Supabase callback

### Issue: Session not persisting

**Solution:**
- Check middleware is running
- Verify cookies are being set (browser DevTools)
- Ensure domain matches between env var and actual domain

### Issue: API calls return 401

**Solution:**
- Verify `ApiProvider` is in layout
- Check Supabase token is in Authorization header
- Ensure backend accepts Supabase JWT tokens

## Security Notes

- ✅ Sessions stored in HTTP-only cookies (secure)
- ✅ Middleware refreshes expired sessions automatically
- ✅ No tokens stored in localStorage
- ✅ All auth state managed server-side
- ✅ RLS should be enabled on Supabase tables
- ✅ `SERVICE_ROLE_KEY` never exposed to client

## Next Steps

1. Test authentication flow end-to-end
2. Configure email templates in Supabase (if needed)
3. Set up error tracking
4. Add loading states for better UX
5. Implement protected route middleware (if needed)
6. Add user profile management
