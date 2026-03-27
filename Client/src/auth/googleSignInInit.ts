/**
 * Single-flight Google Sign-In initialization.
 * Native GoogleAuth init should complete before signIn().
 */
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';

import { GOOGLE_WEB_CLIENT_ID } from './googleSignInConstants';

/** Scopes: openid + profile + email (short names work with Google's OAuth endpoints). */
export const GOOGLE_SIGN_IN_SCOPES = [
  'profile',
  'email',
];

let initPromise: Promise<void> | null = null;
let lastError: Error | null = null;

export function getGoogleSignInInitError(): Error | null {
  return lastError;
}

/**
 * Must be called once early in app lifetime (see GoogleSignInBootstrap).
 * Safe to call multiple times — returns the same promise.
 */
export function ensureGoogleSignInInitialized(): Promise<void> {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    lastError = null;
    try {
      const platform = Capacitor.getPlatform();
      console.log('[GoogleSignIn] initialize() starting, platform=', platform);

      const base = {
        clientId: GOOGLE_WEB_CLIENT_ID,
        scopes: GOOGLE_SIGN_IN_SCOPES,
        grantOfflineAccess: true,
      };

      if (platform === 'web') {
        console.log('[GoogleSignIn] initialize() skipped on web');
        return;
      }

      await GoogleAuth.initialize(base);
      console.log('[GoogleSignIn] initialize() OK (native)');
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      console.error('[GoogleSignIn] initialize() FAILED:', e);
      initPromise = null;
      throw lastError;
    }
  })();

  return initPromise;
}

export function resetGoogleSignInInitForTests(): void {
  initPromise = null;
  lastError = null;
}
