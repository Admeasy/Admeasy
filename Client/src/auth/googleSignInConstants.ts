/**
 * Public OAuth 2.0 Web Client ID for Google Sign-In
 * 
 * This is the "Web application" OAuth client from Google Cloud Console.
 * Public (not a secret) — safe to commit to version control.
 * 
 * Must match:
 * - Server GOOGLE_CLIENT_ID environment variable (same Web OAuth client)
 * - Android app's OAuth configuration
 * 
 * Can be overridden at build time via VITE_GOOGLE_CLIENT_ID env var,
 * but this constant is the default fallback.
 */
export const GOOGLE_WEB_CLIENT_ID =
  '131243298453-f8l1eud7gadl0mgap85smr5le64g7k95.apps.googleusercontent.com';
