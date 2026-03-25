/**
 * Google Sign-In for Admeasy.
 *
 * Native: Codetrix plugin (GoogleAuth) + idToken exchange with backend.
 * Web: existing Passport redirect flow stays unchanged.
 */
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';
import { toast } from 'react-toastify';
import type { NavigateFunction } from 'react-router-dom';
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
  result: { idToken?: string | null; email?: string | null; userId?: string | null },
  deps: GoogleLoginDeps
): Promise<void> {
  const idToken = result.idToken ?? null;
  if (!idToken) {
    toast.error('Could not get Google credentials. Please try again.');
    return;
  }
  console.log('[GoogleSignIn] idToken received, userId=', result.userId, 'email=', result.email);
  await completeGoogleSessionFromIdToken(idToken, deps, { email: result.email });
}

/** Web flow is server-redirect based; no plugin redirect callback to consume. */
export async function tryConsumeGoogleWebRedirect(deps: GoogleLoginDeps): Promise<boolean> {
  void deps;
  if (Capacitor.isNativePlatform()) return false;
  return false;
}

/**
 * Native Android/iOS: assumes initialize() already ran at app start.
 */
export async function runCapacitorGoogleSignIn(deps: GoogleLoginDeps): Promise<void> {
  try {
    console.log('[GoogleSignIn] runCapacitorGoogleSignIn: awaiting prior initialize…');
    await ensureGoogleSignInInitialized();
    console.log('[GoogleSignIn] signIn() starting (native)');

    const nativeUser = await GoogleAuth.signIn();
    const idToken = nativeUser?.authentication?.idToken ?? null;
    const email = nativeUser?.email ?? null;

    console.log('[GoogleSignIn] signIn() resolved, has idToken:', !!idToken);
    await completeGoogleSessionFromSignInResult(
      {
        idToken,
        email,
        userId: nativeUser?.id ?? null,
      },
      deps
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[GoogleSignIn] signIn error:', error);
    if (/cancel|dismiss|user denied|12501|16|Canceled|abort/i.test(msg)) {
      return;
    }
    toast.error(msg || 'Google sign-in failed. Please try again.');
  }
}

/** Legacy web-plugin entrypoint retained for compatibility; no-op on current web flow. */
export async function runWebGoogleSignInWithPlugin(): Promise<void> {
  await ensureGoogleSignInInitialized();
}
