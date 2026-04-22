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
import { toast } from 'react-toastify';

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

  // 2) Web: Capawesome redirect return (hash) OR Passport redirect return (query)
  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;
    if (redirectHandled.current) return;

    const query = new URLSearchParams(location.search);
    const hash = typeof window !== 'undefined' ? window.location.hash : '';

    const isOAuthSuccess = query.get('oauth_success') === 'true';
    const hasToken = query.has('token') || hash.includes('id_token');

    if (!isOAuthSuccess && !hasToken) return;

    redirectHandled.current = true;
    void Promise.resolve().then(async () => {
      if (hash.includes('id_token')) {
        // Old hash-based flow (Capawesome)
        await tryConsumeGoogleWebRedirect({
          fetchUser,
          setMentor,
          navigate,
        });
      } else if (isOAuthSuccess) {
        // Modern Query-based flow (Passport)
        const token = query.get('token');
        const switchToken = query.get('switchToken');
        
        console.log('[GoogleSignInBootstrap] Consuming Passport OAuth result');
        const user = await fetchUser(switchToken, { accessToken: token });
        
        if (user) {
          // Clear query params to clean up URL
          navigate('/', { replace: true });
          toast.success("Welcome back!");
        } else {
          toast.error("Failed to sync profile. Please log in again.");
          navigate('/login', { replace: true });
        }
      }
    });
  }, [location.search, location.hash, fetchUser, setMentor, navigate]);

  return null;
}
