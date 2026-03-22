/**
 * Mount once inside Router + UserProvider: initializes Google Sign-In early
 * and completes web implicit redirect (hash id_token) if present.
 */
import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { useUser } from '../context/UserContext';
import { useMentor } from '../context/MentorContext';
import {
  ensureGoogleSignInInitialized,
  tryConsumeGoogleWebRedirect,
} from '../auth/googleSignIn';

export default function GoogleSignInBootstrap() {
  const { fetchUser } = useUser();
  const { setMentor } = useMentor();
  const navigate = useNavigate();
  const location = useLocation();
  const initStarted = useRef(false);
  const redirectHandled = useRef(false);

  // 1) Eager init — native MUST complete before user taps Continue with Google
  useEffect(() => {
    if (initStarted.current) return;
    initStarted.current = true;
    console.log('[GoogleSignInBootstrap] Eager ensureGoogleSignInInitialized()');
    ensureGoogleSignInInitialized().catch((err) => {
      console.error('[GoogleSignInBootstrap] Eager init failed:', err);
    });
  }, []);

  // 2) Web: Capawesome redirect return → hash contains id_token
  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;
    if (redirectHandled.current) return;
    if (!location.pathname.startsWith('/login')) return;

    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    if (!hash.includes('id_token')) return;

    redirectHandled.current = true;
    void Promise.resolve().then(async () => {
      await tryConsumeGoogleWebRedirect({
        fetchUser,
        setMentor,
        navigate,
      });
    });
  }, [location.pathname, fetchUser, setMentor, navigate]);

  return null;
}
