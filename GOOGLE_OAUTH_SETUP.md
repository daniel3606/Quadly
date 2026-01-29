7. Configure authorized redirect URIs:
   - Development: `http://localhost:8000/api/auth/google/callback`
   - Production: `https://your-api-domain.com/api/auth/google/callback`
8. Click **Create**
9. Copy the **Client ID** and **Client Secret**

### 2. Configure Environment Variables

Add the following to your `apps/api/.env` file:

```env
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:8000/api/auth/google/callback
API_URL=http://localhost:8000
WEB_URL=http://localhost:3000
```

For production, update these values accordingly:
- `GOOGLE_CALLBACK_URL` should match your production API URL
- `API_URL` should be your production API URL
- `WEB_URL` should be your production frontend URL

### 3. Run Database Migration

After fixing any existing Prisma schema issues, run:

```bash
cd apps/api
npx prisma migrate dev --name add_google_oauth
npx prisma generate
```

### 4. Test the Login Flow

1. Start the API server:
   ```bash
   cd apps/api
   npm run dev
   ```

2. Start the web app:
   ```bash
   cd apps/web
   npm run dev
   ```

3. Navigate to `http://localhost:3000/login`
4. Select "University of Michigan" from the dropdown
5. Click "Continue with Google"
6. Sign in with a `@umich.edu` email address
7. You should be redirected back to the app with authentication

## Important Notes

- **Email Restriction**: Only `@umich.edu` email addresses are allowed
- **University Selection**: Currently only "University of Michigan" is supported
- **Token Storage**: Tokens are stored in `localStorage` (consider using httpOnly cookies for production)

## Troubleshooting

### "Only University of Michigan email addresses are allowed"
- Make sure you're signing in with a `@umich.edu` email address
- The email validation happens on the backend

### Redirect URI mismatch
- Ensure the redirect URI in Google Cloud Console matches exactly with `GOOGLE_CALLBACK_URL`
- Check for trailing slashes and protocol (http vs https)

### CORS errors
- Verify `WEB_URL` in the API `.env` matches your frontend URL
- Check that CORS is enabled in `apps/api/src/main.ts`
