import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';
import { GOOGLE_WEB_CLIENT_ID } from './googleSignInConstants';

export const GOOGLE_SIGN_IN_SCOPES = ['profile', 'email'];

let googleInitialized = false;

/**
 * Get the Web OAuth client ID with validation.
 * Prioritizes env variable override, falls back to constant.
 */
function getGoogleClientId(): string {
  // Try env variable first (can be overridden in build)
  const envClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
  if (envClientId) {
    return envClientId;
  }

  // Use the hardcoded constant as fallback
  const constantClientId = GOOGLE_WEB_CLIENT_ID?.trim();
  if (constantClientId) {
    return constantClientId;
  }

  // No fallback available
  throw new Error(
    '[GoogleSignIn] FATAL: Missing Web OAuth Client ID. ' +
    'Set VITE_GOOGLE_CLIENT_ID env var or update googleSignInConstants.ts'
  );
}

export const ensureGoogleSignInInitialized = async (): Promise<void> => {
  if (googleInitialized) return;

  try {
    const platform = Capacitor.getPlatform();
    console.log('[GoogleSignIn] initialize() starting, platform=' + platform);

    if (platform === 'web') {
      console.log('[GoogleSignIn] initialize() skipped on web (using Passport flow)');
      googleInitialized = true;
      return;
    }

    // Validate clientId
    const clientId = getGoogleClientId();
    console.log('[GoogleSignIn] clientId present: true');

    // Initialize native GoogleAuth
    await GoogleAuth.initialize({
      clientId,
      scopes: GOOGLE_SIGN_IN_SCOPES,
      grantOfflineAccess: true,
    });

    console.log('[GoogleSignIn] initialize() OK (native)');
    googleInitialized = true;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[GoogleSignIn] initialize() FAILED: ' + msg);
    googleInitialized = false;
    throw error;
  }
};

export function resetGoogleSignInInitForTests(): void {
  googleInitialized = false;
}
