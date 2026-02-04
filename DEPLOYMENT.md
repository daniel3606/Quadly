# Deployment Guide - Quadly Authentication Setup

This guide covers the complete setup for deploying Quadly with Supabase Auth and Google OAuth.

## Prerequisites

- ✅ Supabase project created
- ✅ Google OAuth credentials configured
- ✅ Domain `quadly.org` owned and configured
- ✅ Cloudflare Tunnel set up for `dev.quadly.org`
- ✅ Vercel account ready

## Step 1: Supabase Dashboard Configuration

### 1.1 Authentication → URL Configuration

**Site URL:**
- Set to: `https://dev.quadly.org` (for development)
- Or: `https://quadly.org` (for production)

**Redirect URLs (add ALL of these):**
```
https://dev.quadly.org/auth/callback
https://quadly.org/auth/callback
http://localhost:3000/auth/callback
```

### 1.2 Authentication → Providers → Google

1. Enable Google provider
2. Add Google OAuth Client ID
3. Add Google OAuth Client Secret
4. **Important:** In Google Cloud Console, add this authorized redirect URI:
   ```
   https://waahgmnfykmrlxuvxerw.supabase.co/auth/v1/callback
   ```

## Step 2: Local Development Setup

### 2.1 Environment Variables

Create `apps/web/.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://waahgmnfykmrlxuvxerw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_L--eGWYoL2TKOsUgfBaA1Q_KeTiC96_

# Site URL - MUST match your Cloudflare Tunnel domain
NEXT_PUBLIC_SITE_URL=https://dev.quadly.org

# API Configuration (if using backend API)
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### 2.2 Run Development Server

```bash
cd apps/web
npm install
npm run dev
```

### 2.3 Test Locally

1. Ensure Cloudflare Tunnel is running and pointing to `localhost:3000`
2. Open `https://dev.quadly.org`
3. Click "Sign in with Google"
4. Complete OAuth flow
5. Should redirect back to home page with your email displayed

## Step 3: Vercel Production Deployment

### 3.1 Connect Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository
4. Set root directory: `apps/web`

### 3.2 Configure Build Settings

- **Framework Preset:** Next.js
- **Root Directory:** `apps/web`
- **Build Command:** `npm run build` (or `cd apps/web && npm run build`)
- **Output Directory:** `.next` (default)

### 3.3 Set Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables, add:

**Production Environment:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://waahgmnfykmrlxuvxerw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_L--eGWYoL2TKOsUgfBaA1Q_KeTiC96_
NEXT_PUBLIC_SITE_URL=https://quadly.org
NEXT_PUBLIC_API_URL=https://api.quadly.org/api
```

**Preview/Development Environment:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://waahgmnfykmrlxuvxerw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_L--eGWYoL2TKOsUgfBaA1Q_KeTiC96_
NEXT_PUBLIC_SITE_URL=https://dev.quadly.org
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### 3.4 Configure Domain

1. In Vercel Dashboard → Project Settings → Domains
2. Add custom domain: `quadly.org`
3. Follow DNS configuration instructions
4. Wait for SSL certificate provisioning

### 3.5 Deploy

1. Push to main branch (or trigger manual deployment)
2. Vercel will automatically build and deploy
3. Check deployment logs for any errors

## Step 4: Post-Deployment Verification

### 4.1 Test Production OAuth Flow

1. Open `https://quadly.org`
2. Click "Sign in with Google"
3. Complete OAuth flow
4. Verify redirect back to home page
5. Check that your email is displayed in header

### 4.2 Verify Environment Variables

- ✅ All `NEXT_PUBLIC_*` variables are set correctly
- ✅ `NEXT_PUBLIC_SITE_URL` matches actual domain
- ✅ No secrets committed to repository

### 4.3 Check Browser Console

- No authentication errors
- Session cookies are being set
- API calls include Authorization header

## Step 5: GitHub Repository Setup

### 5.1 Verify .gitignore

Ensure `.gitignore` includes:
```
.env
.env.local
.env*.local
**/.env
**/.env.*
**/.env.local
```

### 5.2 Verify .env.example

Ensure `apps/web/env.example` exists with:
- All required variables
- Example values (not real secrets)
- Clear comments

### 5.3 Commit and Push

```bash
git add .
git commit -m "feat: implement Supabase Auth with Google OAuth"
git push origin main
```

## Troubleshooting

### OAuth Redirect Issues

**Problem:** Redirect goes to wrong URL or fails

**Solutions:**
1. Verify `NEXT_PUBLIC_SITE_URL` matches actual domain exactly
2. Check Supabase Dashboard redirect URLs match exactly
3. Ensure Google OAuth redirect URI includes Supabase callback URL
4. Clear browser cookies and try again

### Session Not Persisting

**Problem:** User logged out after page refresh

**Solutions:**
1. Check middleware is running (should see logs in Vercel)
2. Verify cookies are being set (check browser DevTools)
3. Ensure domain matches between `NEXT_PUBLIC_SITE_URL` and actual domain
4. Check SameSite cookie settings (should be Lax)

### Build Failures

**Problem:** Vercel build fails

**Solutions:**
1. Check build logs for specific errors
2. Verify all environment variables are set
3. Ensure `package.json` has correct scripts
4. Check TypeScript errors locally first

### API Calls Failing

**Problem:** API requests return 401 Unauthorized

**Solutions:**
1. Verify `ApiProvider` is initialized in layout
2. Check Supabase token is being passed in Authorization header
3. Verify backend accepts Supabase JWT tokens
4. Check token expiration (should auto-refresh)

## Environment-Specific Configuration

### Development (dev.quadly.org)
- Uses Cloudflare Tunnel → localhost:3000
- `NEXT_PUBLIC_SITE_URL=https://dev.quadly.org`
- Supabase redirect: `https://dev.quadly.org/auth/callback`

### Production (quadly.org)
- Hosted on Vercel
- `NEXT_PUBLIC_SITE_URL=https://quadly.org`
- Supabase redirect: `https://quadly.org/auth/callback`

## Security Checklist

- ✅ No secrets in repository
- ✅ `.env.local` in `.gitignore`
- ✅ `SERVICE_ROLE_KEY` only in backend
- ✅ `ANON_KEY` is public (safe to expose)
- ✅ RLS enabled on Supabase tables
- ✅ HTTPS enforced (Vercel default)
- ✅ Secure cookies configured (Supabase default)

## Next Steps

After successful deployment:

1. Test all authentication flows
2. Verify user sessions persist correctly
3. Test logout functionality
4. Monitor Vercel logs for errors
5. Set up error tracking (Sentry, etc.)
6. Configure email templates in Supabase (if needed)
