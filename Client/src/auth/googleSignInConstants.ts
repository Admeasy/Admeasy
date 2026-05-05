/**
 * Public OAuth 2.0 Web Client ID for Google Sign-In
 * 
 * This is the "Web application" OAuth client from Google Cloud Console.
 * Public (not a secret) — safe to commit to version control.
 * 
 * Used for:
 * - Browser/web platform login (Passport flow)
 * - Server verification of web login tokens (GOOGLE_CLIENT_ID env var)
 * 
 * Can be overridden at build time via VITE_GOOGLE_CLIENT_ID env var,
 * but this constant is the default fallback.
 */
export const GOOGLE_WEB_CLIENT_ID =
  '131243298453-f8l1eud7gadl0mgap85smr5le64g7k95.apps.googleusercontent.com';

/**
 * Android OAuth 2.0 Client ID for Google Sign-In
 * 
 * This is the "Android" OAuth client from Google Cloud Console.
 * Used ONLY for native Android app sign-in via Capacitor GoogleSignIn plugin.
 * Public (not a secret) — safe to commit to version control.
 * 
 * IMPORTANT: This is different from Web Client ID and must NOT be used for browser login.
 */
export const GOOGLE_ANDROID_CLIENT_ID =
  '30534383626-qqo5jaejamspravl66odf2m4i5aejtf9.apps.googleusercontent.com';
