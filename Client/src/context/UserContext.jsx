import { createContext, useContext, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { enableNotifications } from "../Firebase/enableNotifications";


const UserContext = createContext();

const USER_STORAGE_KEY = 'admeasy:user';
const MENTOR_STORAGE_KEY = 'admeasy:mentor';
const AUTH_ROLE_STORAGE_KEY = 'admeasy:authRole';

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
}

export function useUser() {
  return useContext(UserContext);
}

function getInitialUser() {
  if (typeof window === 'undefined') return null;
  const role = localStorage.getItem(AUTH_ROLE_STORAGE_KEY);
  if (role !== 'user') return null;
  try {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (err) {
    console.error('Failed to parse stored user', err);
    return null;
  }
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(getInitialUser); // user object: { name, email, image, ... }
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  // Verify authentication with server on mount and when location changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const verifyAuth = async () => {
      setIsLoading(true);
      // Check if this is an OAuth redirect - check both location.search and window.location.search
      const searchParams = location.search || window.location.search;
      const urlParams = new URLSearchParams(searchParams);
      const oauthSuccessParam = urlParams.get('oauth_success');
      const isOAuthSuccess = oauthSuccessParam === 'true';

      // If OAuth success, fetch user immediately
      if (isOAuthSuccess) {
        // Store the intended path and set OAuth flag
        const intendedPath = location.pathname;
        sessionStorage.setItem('oauth_in_progress', 'true');
        sessionStorage.setItem('oauth_intended_path', intendedPath);

        // Remove the query parameter from URL (but keep the pathname)
        navigate(intendedPath, { replace: true });

        // Retry function to fetch user data
        const fetchUserWithRetry = async (retries = 3, delay = 500) => {
          for (let i = 0; i < retries; i++) {
            try {
              // Wait before each attempt (longer delay for first attempt)
              if (i > 0) {
                await new Promise(resolve => setTimeout(resolve, delay));
              } else {
                // First attempt: wait a bit longer to ensure cookies are set
                await new Promise(resolve => setTimeout(resolve, 500));
              }

              // Try to refresh token first (optional - tokens are fresh but this ensures they're valid)
              try {
                const refreshRes = await fetch("/api/users/refresh", {
                  method: "POST",
                  credentials: "include",
                });
                if (!refreshRes.ok) {
                  const refreshError = await refreshRes.json().catch(() => ({}));
                  // Token refresh failed, continuing anyway
                  // Continue anyway - tokens might still be valid
                }
              } catch (refreshErr) {
                // Token refresh error (non-fatal)
              }

              // Fetch user data directly (tokens should be in cookies)
              const res = await fetch("/api/users/me", {
                credentials: "include",
              });

              if (res.ok) {
                const data = await res.json();
                let userObj = data.user;

                // Fetch profile picture
                try {
                  const imageRes = await fetch('/api/users/me/pic', { credentials: 'include' });
                  if (imageRes.ok) {
                    const imageUrl = await imageRes.json();
                    userObj.imageUrl = imageUrl;
                  }
                } catch (imageErr) {
                  // Failed to fetch profile picture
                }

                setUser(userObj);
                // Navigation will be handled by the useEffect that watches for user changes
                return true; // Success
              } else {
                const errorData = await res.json().catch(() => ({}));
                // Failed to fetch user

                // If it's the last attempt, give up
                if (i === retries - 1) {
                  console.error('All retry attempts failed to fetch user after OAuth');
                  setUser(null);
                  localStorage.removeItem(USER_STORAGE_KEY);
                  localStorage.removeItem(AUTH_ROLE_STORAGE_KEY);
                  return false;
                }
              }
            } catch (err) {
              // Error fetching user

              // If it's the last attempt, give up
              if (i === retries - 1) {
                console.error('OAuth verification failed after all retries:', err);
                setUser(null);
                localStorage.removeItem(USER_STORAGE_KEY);
                localStorage.removeItem(AUTH_ROLE_STORAGE_KEY);
                return false;
              }
            }
          }
          return false;
        };

        // Start the retry process
        await fetchUserWithRetry();
        setIsLoading(false);
        return;
      }

      // Normal verification flow
      const storedRole = localStorage.getItem(AUTH_ROLE_STORAGE_KEY);
      const hasStoredUser = localStorage.getItem(USER_STORAGE_KEY);

      // If we are NOT a mentor, try to restore user session
      // This allows auto-login even if localStorage is cleared but cookie exists
      if (storedRole !== 'mentor') {
        try {
          // Always verify with server - localStorage is just a cache
          await fetch("/api/users/refresh", {
            method: "POST",
            credentials: "include",
          });
          const res = await fetch("/api/users/me", {
            credentials: "include",
          });
          if (res.ok) {
            const data = await res.json();
            let userObj = data.user;
            const imageRes = await fetch('/api/users/me/pic', { credentials: 'include' });
            if (imageRes.ok) {
              const imageUrl = await imageRes.json();
              userObj.imageUrl = imageUrl;
            }
            setUser(userObj);

            // Onboarding check removed to prevent forced redirects - handled by Banner now
          } else {
            // Server says not authenticated, clear localStorage
            // Only clear if we were expecting a user
            if (storedRole === 'user' || hasStoredUser) {
              setUser(null);
              localStorage.removeItem(USER_STORAGE_KEY);
              localStorage.removeItem(AUTH_ROLE_STORAGE_KEY);
            }
          }
        } catch (err) {
          console.error('Auth verification failed:', err);
          // On error, clear potentially stale data
          if (storedRole === 'user') {
            setUser(null);
            localStorage.removeItem(USER_STORAGE_KEY);
            localStorage.removeItem(AUTH_ROLE_STORAGE_KEY);
          }
        }
      }
      setIsLoading(false);
    };

    verifyAuth();
  }, [location]); // Run on mount and when location changes

  // Handle navigation after OAuth user is set
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if we just completed OAuth and user is now set
    // Look for oauth_success in sessionStorage as a flag
    const oauthInProgress = sessionStorage.getItem('oauth_in_progress');
    const intendedPath = sessionStorage.getItem('oauth_intended_path');

    if (oauthInProgress === 'true' && user && intendedPath) {
      // Clear the flags
      sessionStorage.removeItem('oauth_in_progress');
      sessionStorage.removeItem('oauth_intended_path');

      // Navigate to intended path if we're not already there
      if (location.pathname !== intendedPath) {
        if (user && user._id) {
          enableNotifications(user._id, "user", true);
        }
        setTimeout(() => {
          navigate(intendedPath, { replace: true });
        }, 50);
      }


    }
  }, [user, location.pathname, navigate]);

  // Sync state across tabs when localStorage changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e) => {
      // Only sync if change came from another tab (not current tab)
      if (e.key === USER_STORAGE_KEY) {
        try {
          const newUser = e.newValue ? JSON.parse(e.newValue) : null;
          // Verify with server before trusting cross-tab update
          if (newUser) {
            fetch("/api/users/me", { credentials: "include" })
              .then(res => {
                if (res.ok) {
                  setUser(newUser);
                } else {
                  // Server says not authenticated, clear state
                  setUser(null);
                  localStorage.removeItem(USER_STORAGE_KEY);
                  localStorage.removeItem(AUTH_ROLE_STORAGE_KEY);
                }
              })
              .catch(() => {
                setUser(null);
                localStorage.removeItem(USER_STORAGE_KEY);
                localStorage.removeItem(AUTH_ROLE_STORAGE_KEY);
              });
          } else {
            setUser(null);
          }
        } catch (err) {
          console.error('Failed to parse user from storage event', err);
        }
      } else if (e.key === AUTH_ROLE_STORAGE_KEY) {
        // If auth role changes, update user state accordingly
        if (e.newValue !== 'user') {
          setUser(null);
        } else {
          // Reload user from storage and verify
          const stored = localStorage.getItem(USER_STORAGE_KEY);
          if (stored) {
            try {
              const parsedUser = JSON.parse(stored);
              // Verify with server
              fetch("/api/users/me", { credentials: "include" })
                .then(res => {
                  if (res.ok) {
                    setUser(parsedUser);
                  } else {
                    setUser(null);
                    localStorage.removeItem(USER_STORAGE_KEY);
                    localStorage.removeItem(AUTH_ROLE_STORAGE_KEY);
                  }
                })
                .catch(() => {
                  setUser(null);
                  localStorage.removeItem(USER_STORAGE_KEY);
                  localStorage.removeItem(AUTH_ROLE_STORAGE_KEY);
                });
            } catch (err) {
              console.error('Failed to parse user after role change', err);
            }
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (user) {
      // Store in localStorage as cache only - server is source of truth
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem(AUTH_ROLE_STORAGE_KEY, 'user');
      localStorage.removeItem(MENTOR_STORAGE_KEY);
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
      if (localStorage.getItem(AUTH_ROLE_STORAGE_KEY) === 'user') {
        localStorage.removeItem(AUTH_ROLE_STORAGE_KEY);
      }
    }
  }, [user]);

  const fetchUser = async () => {
    // Always attempt to refresh
    await fetch("/api/users/refresh", {
      method: "POST",
      credentials: "include",
    });

    // Then fetch user data
    const res = await fetch("/api/users/me", {
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      let userObj = data.user;
      const imageRes = await fetch('/api/users/me/pic', { credentials: 'include' });
      if (imageRes.ok) {
        const imageUrl = await imageRes.json();
        userObj.imageUrl = imageUrl;
      }
      setUser(userObj);
      return userObj;
    } else {
      setUser(null);
      return null;
    }
  }


  return (
    <UserContext.Provider value={{ user, setUser, fetchUser, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}
