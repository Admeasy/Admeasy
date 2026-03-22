/**
 * Single-flight Google Sign-In initialization.
 * Android Credential Manager + Play Services expect initialize() to complete BEFORE signIn();
 * calling both back-to-back on button click can leave the native flow hanging after account pick.
 */
import { GoogleSignIn } from '@capawesome/capacitor-google-sign-in';
import { Capacitor } from '@capacitor/core';

import { GOOGLE_WEB_CLIENT_ID } from './googleSignInConstants';

/** Scopes: openid + profile + email (short names work with Google's OAuth endpoints). */
export const GOOGLE_SIGN_IN_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
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
      };

      // Web (browser): implicit flow needs redirect_uri + handleRedirectCallback on return.
      if (platform === 'web') {
        const redirectUrl = `${window.location.origin}/login`;
        await GoogleSignIn.initialize({
          ...base,
          redirectUrl,
        });
        console.log('[GoogleSignIn] initialize() OK (web), redirectUrl=', redirectUrl);
        return;
      }

      await GoogleSignIn.initialize(base);
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
