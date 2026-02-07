'use client';

import { useEffect, useState } from 'react';

const ALLOWED_SCHEMES = ['exp', 'quadly'];

export default function MobileCallbackPage() {
  const [error, setError] = useState<string | null>(null);
  const [debugUrl, setDebugUrl] = useState<string>('');

  useEffect(() => {
    const fullUrl = window.location.href;
    setDebugUrl(fullUrl);

    try {
      const queryParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(
        window.location.hash.startsWith('#')
          ? window.location.hash.substring(1)
          : ''
      );

      // --- Read mobile routing params ---
      const mobileScheme = queryParams.get('mobile_scheme');
      const mobileHost = queryParams.get('mobile_host') || '';

      if (!mobileScheme) {
        setError('Missing mobile_scheme parameter.');
        return;
      }

      if (!ALLOWED_SCHEMES.includes(mobileScheme)) {
        setError(`Invalid mobile_scheme "${mobileScheme}". Allowed: ${ALLOWED_SCHEMES.join(', ')}`);
        return;
      }

      // --- Read auth params (Supabase appends these) ---
      // Implicit flow: tokens in hash fragment
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      // PKCE flow: code in query string
      const code = queryParams.get('code');

      // Error from Supabase
      const authError = queryParams.get('error') || hashParams.get('error');
      const authErrorDesc =
        queryParams.get('error_description') || hashParams.get('error_description');

      const hasImplicitTokens = accessToken && refreshToken;
      const hasPkceCode = !!code;
      const hasError = !!authError;

      if (!hasImplicitTokens && !hasPkceCode && !hasError) {
        setError('No auth tokens, code, or error found in the callback URL.');
        return;
      }

      // --- Build the deep link URL ---
      // Expo Go uses /--/ separator before path; production builds do not.
      let deepLink: string;
      if (mobileHost) {
        // Expo Go: exp://10.0.0.128:8081/--/callback
        deepLink = `${mobileScheme}://${mobileHost}/--/callback`;
      } else {
        // Production: quadly://callback
        deepLink = `${mobileScheme}://callback`;
      }

      if (hasError) {
        // Forward the error to the mobile app
        const errorParams = new URLSearchParams();
        errorParams.set('error', authError!);
        if (authErrorDesc) errorParams.set('error_description', authErrorDesc);
        deepLink += `?${errorParams.toString()}`;
      } else if (hasPkceCode) {
        // PKCE flow: pass code as query param
        deepLink += `?code=${encodeURIComponent(code!)}`;
      } else if (hasImplicitTokens) {
        // Implicit flow: pass tokens as hash fragment (preserve all hash params)
        deepLink += `#${window.location.hash.substring(1)}`;
      }

      // Redirect — ASWebAuthenticationSession / Chrome Custom Tabs will intercept this
      window.location.href = deepLink;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  if (error) {
    return (
      <div style={{ padding: 32, fontFamily: 'system-ui, sans-serif', maxWidth: 600, margin: '0 auto' }}>
        <h2 style={{ color: '#c00' }}>Mobile Auth Redirect Error</h2>
        <p>{error}</p>
        <details style={{ marginTop: 16 }}>
          <summary>Debug: raw URL</summary>
          <pre style={{ wordBreak: 'break-all', whiteSpace: 'pre-wrap', fontSize: 12, background: '#f5f5f5', padding: 12, borderRadius: 8 }}>
            {debugUrl}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <p>Redirecting to app&hellip;</p>
    </div>
  );
}
