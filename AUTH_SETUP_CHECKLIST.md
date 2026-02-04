# Authentication Setup Checklist

Use this checklist to verify your authentication setup is complete and working.

## Pre-Implementation Checklist

- [x] Supabase project created
- [x] Google OAuth credentials obtained
- [x] Domain `quadly.org` owned
- [x] Cloudflare Tunnel configured for `dev.quadly.org`
- [x] Vercel account ready

## Code Implementation Checklist

### Files Created

- [x] `apps/web/src/lib/supabase/client.ts` - Browser client
- [x] `apps/web/src/lib/supabase/server.ts` - Server client
- [x] `apps/web/src/lib/supabase/middleware.ts` - Middleware helper
- [x] `apps/web/src/middleware.ts` - Next.js middleware
- [x] `apps/web/src/lib/auth.ts` - Server auth utilities
- [x] `apps/web/src/lib/auth-client.ts` - Client auth hooks
- [x] `apps/web/src/lib/api-client.ts` - API client init
- [x] `apps/web/src/components/ApiProvider.tsx` - API provider
- [x] `apps/web/src/app/auth/callback/route.ts` - OAuth callback
- [x] `apps/web/env.example` - Environment template

### Files Updated

- [x] `apps/web/src/app/login/page.tsx` - Google OAuth login
- [x] `apps/web/src/app/page.tsx` - Use Supabase auth
- [x] `apps/web/src/components/Header.tsx` - Logout button
- [x] `apps/web/src/app/layout.tsx` - Add ApiProvider
- [x] `apps/web/src/lib/api.ts` - Supabase token support

### Files Removed

- [x] `apps/web/src/lib/supabase.ts` - Old client (replaced)
- [x] `apps/web/src/app/auth/callback/page.tsx` - Old callback (replaced)

## Supabase Dashboard Configuration

### URL Configuration

- [ ] Site URL set to `https://dev.quadly.org` (or `https://quadly.org`)
- [ ] Redirect URL added: `https://dev.quadly.org/auth/callback`
- [ ] Redirect URL added: `https://quadly.org/auth/callback`
- [ ] Redirect URL added: `http://localhost:3000/auth/callback` (optional)

### Google OAuth Provider

- [ ] Google provider enabled
- [ ] Google Client ID added
- [ ] Google Client Secret added
- [ ] Google Cloud Console redirect URI configured:
  - [ ] `https://waahgmnfykmrlxuvxerw.supabase.co/auth/v1/callback`

## Environment Variables

### Local Development (`apps/web/.env.local`)

- [ ] `NEXT_PUBLIC_SUPABASE_URL` set
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` set
- [ ] `NEXT_PUBLIC_SITE_URL=https://dev.quadly.org` set
- [ ] `NEXT_PUBLIC_API_URL` set (if using backend API)

### Production (Vercel Dashboard)

- [ ] `NEXT_PUBLIC_SUPABASE_URL` added to Vercel
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` added to Vercel
- [ ] `NEXT_PUBLIC_SITE_URL=https://quadly.org` added to Vercel
- [ ] `NEXT_PUBLIC_API_URL` added to Vercel (if using backend API)

## Local Testing

### Development Server

- [ ] Run `cd apps/web && npm run dev`
- [ ] Server starts without errors
- [ ] No TypeScript errors
- [ ] No linting errors

### OAuth Flow Testing

- [ ] Open `https://dev.quadly.org` (via Cloudflare Tunnel)
- [ ] Login page loads correctly
- [ ] University dropdown works (if applicable)
- [ ] Click "Sign in with Google" button
- [ ] Redirects to Google OAuth
- [ ] Can authenticate with Google account
- [ ] Redirects back to `/auth/callback`
- [ ] Redirects to home page (`/`)
- [ ] User email displayed in header
- [ ] Logout button visible

### Session Persistence Testing

- [ ] Refresh page - session persists
- [ ] Navigate to different pages - session persists
- [ ] Close browser and reopen - session persists (if cookies set correctly)
- [ ] Check browser DevTools → Application → Cookies
  - [ ] Supabase auth cookies present
  - [ ] Cookies have correct domain
  - [ ] Cookies are HttpOnly (secure)

### Logout Testing

- [ ] Click logout button
- [ ] Redirects to `/login`
- [ ] Session cleared (check cookies)
- [ ] Cannot access protected pages

## Production Deployment (Vercel)

### Pre-Deployment

- [ ] Code committed to GitHub
- [ ] No secrets in repository
- [ ] `.env.example` file present
- [ ] `.gitignore` includes `.env*` files

### Vercel Configuration

- [ ] Project connected to GitHub repository
- [ ] Root directory set to `apps/web`
- [ ] Build command configured correctly
- [ ] All environment variables set
- [ ] Custom domain `quadly.org` configured
- [ ] SSL certificate active

### Production Testing

- [ ] Deploy to Vercel successful
- [ ] Open `https://quadly.org`
- [ ] Login page loads
- [ ] OAuth flow works correctly
- [ ] Session persists after auth
- [ ] Logout works correctly
- [ ] No console errors
- [ ] No network errors

## Security Verification

- [ ] No secrets committed to git
- [ ] `.env.local` in `.gitignore`
- [ ] `SERVICE_ROLE_KEY` only in backend (never in web app)
- [ ] `ANON_KEY` is public (safe to expose)
- [ ] HTTPS enforced (Vercel default)
- [ ] Cookies are secure (HttpOnly, Secure, SameSite)
- [ ] RLS enabled on Supabase tables (if applicable)

## Documentation

- [ ] `SUPABASE.md` updated with new configuration
- [ ] `DEPLOYMENT.md` created with deployment steps
- [ ] `AUTH_IMPLEMENTATION.md` created with technical details
- [ ] `AUTH_SETUP_CHECKLIST.md` created (this file)
- [ ] `env.example` file present and complete

## Troubleshooting

If any step fails, check:

1. **OAuth redirect issues:**
   - Verify `NEXT_PUBLIC_SITE_URL` matches actual domain exactly
   - Check Supabase redirect URLs match exactly
   - Verify Google OAuth redirect URI includes Supabase callback

2. **Session not persisting:**
   - Check middleware is running (Vercel logs)
   - Verify cookies are being set (browser DevTools)
   - Ensure domain matches between env var and actual domain

3. **Build failures:**
   - Check Vercel build logs
   - Verify all environment variables are set
   - Run `npm run build` locally to catch errors

4. **API calls failing:**
   - Verify `ApiProvider` is in layout
   - Check Supabase token in Authorization header
   - Ensure backend accepts Supabase JWT tokens

## Final Verification

After completing all checkboxes:

- [ ] Can sign in locally at `https://dev.quadly.org`
- [ ] Can sign in in production at `https://quadly.org`
- [ ] Session persists correctly in both environments
- [ ] Logout works in both environments
- [ ] No errors in browser console
- [ ] No errors in Vercel logs
- [ ] All documentation is up to date

## Success Criteria

✅ **Complete when:**
- User can sign in with Google on both dev and prod
- Session persists correctly
- Logout works
- No authentication errors
- Code is ready for GitHub
- Documentation is complete

---

**Last Updated:** After implementation completion
**Status:** Ready for testing
