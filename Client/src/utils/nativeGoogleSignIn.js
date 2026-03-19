import { Capacitor } from '@capacitor/core';
import { toast } from 'react-toastify';
import { enableNotifications } from '../Firebase/enableNotifications';

/**
 * Use native Google Sign-In (Android account picker) instead of browser OAuth redirect.
 */
export function shouldUseNativeGoogleSignIn() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

function getWebClientId() {
  return import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID || '';
}

/**
 * @param {object} deps
 * @param {function} deps.fetchUser - from UserContext
 * @param {function} [deps.setMentor] - clear mentor session when logging in as user
 * @param {function} deps.navigate - react-router navigate
 */
export async function runNativeGoogleSignIn({ fetchUser, setMentor, navigate }) {
  const webClientId = getWebClientId();
  if (!webClientId) {
    toast.error('Google Sign-In is not configured in this app build (missing VITE_GOOGLE_WEB_CLIENT_ID).');
    return;
  }

  try {
    const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');

    await GoogleAuth.initialize({
      clientId: webClientId,
      scopes: ['profile', 'email', 'openid'],
      grantOfflineAccess: true,
    });

    const googleUser = await GoogleAuth.signIn();
    const idToken = googleUser?.authentication?.idToken;
    if (!idToken) {
      toast.error('Could not get Google credentials. Please try again.');
      return;
    }

    const res = await fetch('/api/users/auth/google/native', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
      credentials: 'include',
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.message || 'Google sign-in failed');
      return;
    }

    if (typeof setMentor === 'function') {
      setMentor(null);
    }

    const loggedInUser = await fetchUser(data.switchToken);
    if (loggedInUser) {
      enableNotifications(loggedInUser._id, 'user', true);
    }

    const requiresOnboarding =
      data.requiresOnboarding ||
      !data.hasCompletedOnboarding ||
      (data.onboardingStatus && !data.onboardingStatus.isComplete);

    if (requiresOnboarding && loggedInUser) {
      toast.info('Please complete your profile to continue');
      navigate(`/onboarding/${loggedInUser._id}`, { replace: true });
    } else {
      toast.success("You're all set!");
      navigate('/', { replace: true });
    }
  } catch (error) {
    const msg = error?.message || String(error);
    if (
      error?.error === 'popup_closed_by_user' ||
      msg.toLowerCase().includes('cancel') ||
      msg.toLowerCase().includes('canceled')
    ) {
      return;
    }
    console.error('Native Google Sign-In failed:', error);
    toast.error('Google sign-in failed. Please try again.');
  }
}
