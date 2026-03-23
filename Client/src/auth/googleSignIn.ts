/**
 * Google Sign-In for Admeasy — @capawesome/capacitor-google-sign-in
 *
 * Native: init runs once at app start (GoogleSignInBootstrap); button only calls signIn().
 * Web: Passport redirect (link) OR plugin implicit flow + handleRedirectCallback (hash).
 */
import { GoogleSignIn } from '@capawesome/capacitor-google-sign-in';
import { Capacitor } from '@capacitor/core';
import { toast } from 'react-toastify';
import type { NavigateFunction } from 'react-router-dom';
import type { SignInResult } from '@capawesome/capacitor-google-sign-in';
import { enableNotifications } from '../Firebase/enableNotifications';

import { GOOGLE_WEB_CLIENT_ID } from './googleSignInConstants';
import { ensureGoogleSignInInitialized } from './googleSignInInit';

export { GOOGLE_WEB_CLIENT_ID } from './googleSignInConstants';
export { ensureGoogleSignInInitialized, GOOGLE_SIGN_IN_SCOPES } from './googleSignInInit';

export function getWebClientId(): string {
  return GOOGLE_WEB_CLIENT_ID;
}

/** True on Android & iOS — native account picker + POST idToken. */
export function shouldUseCapacitorGooglePlugin(): boolean {
  return Capacitor.isNativePlatform();
}

/** Web: classic server redirect (Passport). */
export const WEB_GOOGLE_OAUTH_PATH = '/api/users/auth/google';

export interface GoogleLoginDeps {
  fetchUser: (switchToken?: string | null) => Promise<unknown>;
  setMentor: (value: null) => void;
  navigate: NavigateFunction;
}

interface BackendLoginResponse {
  success?: boolean;
  message?: string;
  switchToken?: string;
  requiresOnboarding?: boolean;
  hasCompletedOnboarding?: boolean;
  onboardingStatus?: { isComplete?: boolean };
}

interface UserLike {
  _id?: string;
}

function randomNonce(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * POST idToken to API, set cookies via fetchUser, navigate (shared native + web plugin).
 */
export async function completeGoogleSessionFromIdToken(
  idToken: string,
  deps: GoogleLoginDeps,
  meta?: { email?: string | null }
): Promise<void> {
  console.log('[GoogleSignIn] POST /api/auth/google …', meta?.email ?? '(no email yet)');

  const res = await fetch('/api/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
    credentials: 'include',
  });

  const data = (await res.json().catch(() => ({}))) as BackendLoginResponse;
  if (!res.ok) {
    toast.error(data.message || 'Google sign-in failed');
    return;
  }

  deps.setMentor(null);

  const loggedInUser = (await deps.fetchUser(data.switchToken)) as UserLike | null;
  if (loggedInUser?._id) {
    enableNotifications(loggedInUser._id, 'user', true);
  }

  const requiresOnboarding =
    data.requiresOnboarding ||
    !data.hasCompletedOnboarding ||
    (data.onboardingStatus && !data.onboardingStatus.isComplete);

  if (requiresOnboarding && loggedInUser?._id) {
    toast.info('Please complete your profile to continue');
    deps.navigate(`/onboarding/${loggedInUser._id}`, { replace: true });
  } else {
    toast.success("You're all set!");
    deps.navigate('/', { replace: true });
  }
}

async function completeGoogleSessionFromSignInResult(
  result: SignInResult,
  deps: GoogleLoginDeps
): Promise<void> {
  const idToken = result.idToken;
  if (!idToken) {
    toast.error('Could not get Google credentials. Please try again.');
    return;
  }
  console.log('[GoogleSignIn] idToken received, userId=', result.userId, 'email=', result.email);
  await completeGoogleSessionFromIdToken(idToken, deps, { email: result.email });
}

/**
 * After plugin web redirect: URL hash contains id_token. Call once on /login load.
 */
export async function tryConsumeGoogleWebRedirect(deps: GoogleLoginDeps): Promise<boolean> {
  if (Capacitor.isNativePlatform()) return false;
  const hash = typeof window !== 'undefined' ? window.location.hash : '';
  if (!hash || !hash.includes('id_token')) return false;

  try {
    console.log('[GoogleSignIn] Web OAuth hash detected, handleRedirectCallback()');
    await ensureGoogleSignInInitialized();
    const result = await GoogleSignIn.handleRedirectCallback();
    await completeGoogleSessionFromSignInResult(result, deps);
    return true;
  } catch (e) {
    console.error('[GoogleSignIn] handleRedirectCallback failed:', e);
    const msg = e instanceof Error ? e.message : String(e);
    toast.error(msg || 'Google sign-in failed');
    window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
    return true;
  }
}

/**
 * Native Android/iOS: assumes initialize() already ran at app start.
 */
export async function runCapacitorGoogleSignIn(deps: GoogleLoginDeps): Promise<void> {
  try {
    console.log('[GoogleSignIn] runCapacitorGoogleSignIn: awaiting prior initialize…');
    await ensureGoogleSignInInitialized();
    console.log('[GoogleSignIn] signIn() starting (native)');

    const result = await GoogleSignIn.signIn({
      nonce: randomNonce(),
    });

    console.log('[GoogleSignIn] signIn() resolved, has idToken:', !!result.idToken);
    await completeGoogleSessionFromSignInResult(result, deps);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[GoogleSignIn] signIn error:', error);
    if (/cancel|dismiss|user denied|12501|16|Canceled|abort/i.test(msg)) {
      return;
    }
    toast.error(msg || 'Google sign-in failed. Please try again.');
  }
}

/**
 * Web: start Capawesome implicit flow (redirect). Promise does not resolve.
 * Add `https://admeasy.in/login` (and localhost) as authorized redirect in Google Cloud if you use this.
 */
export async function runWebGoogleSignInWithPlugin(): Promise<void> {
  await ensureGoogleSignInInitialized();
  console.log('[GoogleSignIn] signIn() — browser will redirect to Google');
  await GoogleSignIn.signIn({ nonce: randomNonce() });
}
