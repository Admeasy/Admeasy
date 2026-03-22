/**
 * Google Sign-In for Admeasy (Capacitor native + web fallback).
 *
 * Native (Android/iOS): @capawesome/capacitor-google-sign-in — Credential Manager / Google Sign-In SDK.
 * Web: classic server redirect via GET /api/users/auth/google (Passport), not the plugin redirect.
 */
import { GoogleSignIn } from '@capawesome/capacitor-google-sign-in';
import { Capacitor } from '@capacitor/core';
import { toast } from 'react-toastify';
import type { NavigateFunction } from 'react-router-dom';
import { enableNotifications } from '../Firebase/enableNotifications';

/**
 * Google OAuth 2.0 **Web client ID** (public; safe to ship in the app).
 * Must match server `GOOGLE_CLIENT_ID` used to verify ID tokens.
 *
 * **Do not use `import.meta.env` here** — Capacitor Android/iOS bundles do not include Vite `.env`
 * the same way as local dev; env-based client ID is often empty in release builds.
 */
export const GOOGLE_WEB_CLIENT_ID =
  '131243298453-f8l1eud7gadl0mgap85smr5le64g7k95.apps.googleusercontent.com';

/** Use this instead of `import.meta.env.VITE_GOOGLE_CLIENT_ID` (unreliable on native). */
export function getWebClientId(): string {
  return GOOGLE_WEB_CLIENT_ID;
}

/** OAuth scopes so idToken includes profile/email claims for the backend. */
const GOOGLE_SCOPES = [
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

/** True on Android & iOS Capacitor shells — use native account picker + POST idToken. */
export function shouldUseCapacitorGooglePlugin(): boolean {
  return Capacitor.isNativePlatform();
}

/** Web: same-origin redirect your Express app already handles. */
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
 * Native flow: initialize plugin → signIn → POST idToken to /api/auth/google → session cookies.
 */
export async function runCapacitorGoogleSignIn(deps: GoogleLoginDeps): Promise<void> {
  try {
    await GoogleSignIn.initialize({
      clientId: getWebClientId(),
      scopes: GOOGLE_SCOPES,
    });

    const result = await GoogleSignIn.signIn();
    const idToken = result.idToken;
    if (!idToken) {
      toast.error('Could not get Google credentials. Please try again.');
      return;
    }

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
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (/cancel|dismiss|user denied|12501/i.test(msg)) {
      return;
    }
    console.error('Capacitor Google Sign-In failed:', error);
    toast.error('Google sign-in failed. Please try again.');
  }
}
