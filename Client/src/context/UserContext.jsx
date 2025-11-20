import { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext();

const USER_STORAGE_KEY = 'admeasy:user';
const MENTOR_STORAGE_KEY = 'admeasy:mentor';
const AUTH_ROLE_STORAGE_KEY = 'admeasy:authRole';

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
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

  // Verify authentication with server on mount if localStorage has data
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const verifyAuth = async () => {
      const storedRole = localStorage.getItem(AUTH_ROLE_STORAGE_KEY);
      const hasStoredUser = localStorage.getItem(USER_STORAGE_KEY);
      
      if (storedRole === 'user' && hasStoredUser) {
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
          } else {
            // Server says not authenticated, clear localStorage
            setUser(null);
            localStorage.removeItem(USER_STORAGE_KEY);
            localStorage.removeItem(AUTH_ROLE_STORAGE_KEY);
          }
        } catch (err) {
          console.error('Auth verification failed:', err);
          // On error, clear potentially stale data
          setUser(null);
          localStorage.removeItem(USER_STORAGE_KEY);
          localStorage.removeItem(AUTH_ROLE_STORAGE_KEY);
        }
      }
    };

    verifyAuth();
  }, []); // Only run on mount

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
    } else {
      setUser(null);
    }
  }

  return (
    <UserContext.Provider value={{ user, setUser, fetchUser }}>
      {children}
    </UserContext.Provider>
  );
}