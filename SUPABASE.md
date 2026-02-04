# Supabase Setup

## Credentials

- **Project URL**: `https://waahgmnfykmrlxuvxerw.supabase.co`
- **Anon Key**: `sb_publishable_L--eGWYoL2TKOsUgfBaA1Q_KeTiC96_`
- **Service Role Key**: ✅ Configured in backend `.env`
- **Database URL**: ✅ Configured in backend `.env`

## Setup Status

✅ **Complete**: All Supabase clients configured and credentials set

## Environment Variables

### Web (`apps/web/.env.local`)

**Required Variables:**
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://waahgmnfykmrlxuvxerw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_L--eGWYoL2TKOsUgfBaA1Q_KeTiC96_

# Site URL - CRITICAL for OAuth redirects
# For local dev with Cloudflare Tunnel: https://dev.quadly.org
# For production: https://quadly.org
NEXT_PUBLIC_SITE_URL=https://dev.quadly.org

# API Configuration (if still using backend API)
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

**Important Notes:**
- `NEXT_PUBLIC_SITE_URL` must match your actual domain (not localhost)
- For local development with Cloudflare Tunnel, use `https://dev.quadly.org`
- For production on Vercel, use `https://quadly.org`

### Backend (`apps/api/.env`)
✅ **Configured** - All credentials set
```env
SUPABASE_URL=https://waahgmnfykmrlxuvxerw.supabase.co
SUPABASE_ANON_KEY=sb_publishable_L--eGWYoL2TKOsUgfBaA1Q_KeTiC96_
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:2382232Kim*@db.waahgmnfykmrlxuvxerw.supabase.co:5432/postgres
```

### Mobile (`apps/mobile/app.json`)
✅ Already configured in `extra` section

## Supabase Dashboard Configuration

### Authentication → URL Configuration

**Site URL:**
- `https://dev.quadly.org` (for local development)
- `https://quadly.org` (for production)

**Redirect URLs (add all of these):**
- `https://dev.quadly.org/auth/callback`
- `https://quadly.org/auth/callback`
- `http://localhost:3000/auth/callback` (optional, for direct localhost testing)

### Authentication → Providers

**Google OAuth:**
1. Enable **Google** provider
2. Add your Google OAuth Client ID and Secret
3. Authorized redirect URIs in Google Console should include:
   - `https://waahgmnfykmrlxuvxerw.supabase.co/auth/v1/callback`

**Email Provider:**
- Enable **Email** provider (if needed)

## Architecture

### Client-Side Auth Flow

1. User clicks "Sign in with Google" on `/login`
2. `signInWithOAuth()` redirects to Google
3. Google redirects back to Supabase
4. Supabase redirects to `/auth/callback` with code
5. `route.ts` exchanges code for session
6. User is redirected to home page

### File Structure

```
apps/web/src/
├── lib/
│   ├── supabase/
│   │   ├── client.ts          # Browser client (useClient)
│   │   ├── server.ts          # Server client (useServer)
│   │   └── middleware.ts      # Middleware helper
│   ├── auth.ts                # Server-side auth utilities
│   ├── auth-client.ts         # Client-side auth hooks
│   ├── api.ts                 # API client (updated for Supabase tokens)
│   └── api-client.ts          # API client initialization
├── app/
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts       # OAuth callback handler
│   ├── login/
│   │   └── page.tsx           # Login page with Google OAuth
│   └── layout.tsx             # Root layout with ApiProvider
├── components/
│   ├── ApiProvider.tsx        # Initializes API client
│   └── Header.tsx             # Header with logout
└── middleware.ts              # Next.js middleware for session refresh
```

## Testing

### Local Development

```bash
# Web
cd apps/web
npm run dev

# Ensure .env.local has:
# NEXT_PUBLIC_SITE_URL=https://dev.quadly.org
```

1. Open `https://dev.quadly.org` (via Cloudflare Tunnel)
2. Click "Sign in with Google"
3. Complete OAuth flow
4. Should redirect back to home page with session

### Production (Vercel)

1. Set environment variables in Vercel Dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL=https://quadly.org`
   - `NEXT_PUBLIC_API_URL` (if needed)

2. Deploy to Vercel
3. Test OAuth flow on `https://quadly.org`

## Security

- ✅ Never expose `SERVICE_ROLE_KEY` in client code
- ✅ Use `ANON_KEY` in web/mobile only
- ✅ Enable RLS on user data tables
- ✅ All auth state managed server-side via cookies
- ✅ Middleware refreshes expired sessions automatically

## Troubleshooting

### OAuth redirect not working

1. Check `NEXT_PUBLIC_SITE_URL` matches your actual domain
2. Verify redirect URLs in Supabase Dashboard match exactly
3. Check browser console for errors
4. Verify Google OAuth credentials are correct

### Session not persisting

1. Check middleware is running (should see logs)
2. Verify cookies are being set (check browser DevTools)
3. Ensure `NEXT_PUBLIC_SITE_URL` is correct

### API calls failing

1. Verify API client is initialized (check `ApiProvider`)
2. Check Supabase token is being passed in Authorization header
3. Verify backend accepts Supabase JWT tokens
