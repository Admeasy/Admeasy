import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';

export const GOOGLE_SIGN_IN_SCOPES = ['profile', 'email'];

let googleInitialized = false;

export const ensureGoogleSignInInitialized = async (): Promise<void> => {
  if (googleInitialized) return;

  try {
    const platform = Capacitor.getPlatform();
    console.log('[GoogleSignIn] initialize() starting, platform=', platform);
    console.log('[GoogleSignIn] clientId:', import.meta.env.VITE_GOOGLE_CLIENT_ID);

    if (platform === 'web') {
      console.log('[GoogleSignIn] initialize() skipped on web');
      // For web, we are using server-side Passport flow, so no-op.
      return;
    }

    await GoogleAuth.initialize({
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      scopes: GOOGLE_SIGN_IN_SCOPES,
      grantOfflineAccess: true,
    });

    console.log('[GoogleSignIn] initialize() OK (native)');
    googleInitialized = true;
  } catch (error) {
    console.error('[GoogleSignIn] initialize() FAILED:', error);
    throw error;
  }
};

export function resetGoogleSignInInitForTests(): void {
  googleInitialized = false;
}
