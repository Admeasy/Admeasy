import { createContext, useContext, useState, useEffect, useRef } from"react";
import { useLocation, useNavigate } from"react-router-dom";
import { enableNotifications } from"../Firebase/enableNotifications";

const UserContext = createContext();

const USER_STORAGE_KEY ='admeasy:user';
const MENTOR_STORAGE_KEY ='admeasy:mentor';
const AUTH_ROLE_STORAGE_KEY ='admeasy:authRole';
const SAVED_ACCOUNTS_KEY ='accounts';
const ACTIVE_ACCOUNT_ID_KEY ='activeAccountId';

export function useUser() {
 return useContext(UserContext);
}

function getInitialUser() {
  if (typeof window === "undefined") return null;
  const role = localStorage.getItem(AUTH_ROLE_STORAGE_KEY);
  if (role !== "user") return null;
  try {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : null;
    if (parsed && parsed._id) {
      localStorage.setItem(ACTIVE_ACCOUNT_ID_KEY, parsed._id);
    }
    return parsed;
  } catch (err) {
    return null;
  }
}

function getInitialMentor() {
  if (typeof window === "undefined") return null;
  const role = localStorage.getItem(AUTH_ROLE_STORAGE_KEY);
  if (role !== "mentor") return null;
  try {
    const stored = localStorage.getItem(MENTOR_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (err) {
    return null;
  }
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(getInitialUser);
  const [mentor, setMentor] = useState(getInitialMentor);
  const [isLoading, setIsLoading] = useState(true);

  const [savedAccounts, setSavedAccounts] = useState(() => {
    try {
      const stored = localStorage.getItem(SAVED_ACCOUNTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

 const location = useLocation();
 const navigate = useNavigate();

  const addSavedAccount = (userData, switchToken) => {
    setSavedAccounts((prevAccounts) => {
      const existingAccounts = prevAccounts.filter(
        (acc) => acc.id !== userData._id,
      );
      const updatedAccounts = [
        ...existingAccounts,
        {
          id: userData._id,
          name: userData.name,
          email: userData.email,
          avatar: userData.imageUrl || userData.image,
          token: switchToken,
        },
      ];
      localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(updatedAccounts));
      localStorage.setItem(ACTIVE_ACCOUNT_ID_KEY, userData._id);
      return updatedAccounts;
    });
  };

  const removeSavedAccount = (accountId) => {
    setSavedAccounts((prevAccounts) => {
      const updated = prevAccounts.filter((acc) => acc.id !== accountId);
      localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  /** Log out only the current account. Invalidates current session, removes it from saved list.
   *  If other saved accounts exist, switches to the first one. Otherwise redirects to login. */
  const logoutCurrentAccount = async () => {
    const currentId = user?._id;
    try {
      await fetch('/api/users/logout', { method: 'POST', credentials: 'include' });
    } catch (err) {
      console.error("Logout API call failed:", err);
    }
    removeSavedAccount(currentId);
    const remaining = savedAccounts.filter(acc => acc.id !== currentId);
    if (remaining.length > 0) {
      try {
        const res = await fetch("/api/users/switch-account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ switchToken: remaining[0].token }),
          credentials: "include",
        });
        if (res.ok) {
          await fetchUser();
          navigate("/");
          return;
        }
        removeSavedAccount(remaining[0].id);
      } catch (err) {
        console.error("Switch account after logout failed:", err);
      }
    }
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(AUTH_ROLE_STORAGE_KEY);
    localStorage.removeItem(ACTIVE_ACCOUNT_ID_KEY);
    navigate('/login');
  };

  const logoutAllAccounts = async () => {
    setUser(null);
    setMentor(null);
    setSavedAccounts([]);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(MENTOR_STORAGE_KEY);
    localStorage.removeItem(AUTH_ROLE_STORAGE_KEY);
    localStorage.removeItem(ACTIVE_ACCOUNT_ID_KEY);
    localStorage.removeItem(SAVED_ACCOUNTS_KEY);
    navigate("/");
    try {
      await fetch("/api/users/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout API call failed (session ended locally):", err);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Flag to prevent running auth check multiple times during component lifecycle
    let isMounted = true;

    const verifyAuth = async () => {
      const oauthReturn =
        new URLSearchParams(location.search).get("oauth_success") === "true" ||
        sessionStorage.getItem("oauth_in_progress") === "true";
      
      // Parent effects run before child effects: /me would 401 before Google OAuth handler
      // binds JWT cookies — do not clear user / storage during this return trip.
      if (oauthReturn) {
        if (isMounted) setIsLoading(false);
        return;
      }

      if (isMounted) setIsLoading(true);
      const storedRole = localStorage.getItem(AUTH_ROLE_STORAGE_KEY);

      if (storedRole === "mentor") {
        try {
          const res = await fetch("/api/mentors/me", {
            credentials: "include",
          });
          if (res.ok) {
            const data = await res.json();
            const mentorObj = data.mentor || data;
            if (isMounted) setMentor(mentorObj);
            localStorage.setItem(MENTOR_STORAGE_KEY, JSON.stringify(mentorObj));
          } else {
            // Gracefully clear mentor state if endpoint returns error
            if (isMounted) setMentor(null);
            localStorage.removeItem(MENTOR_STORAGE_KEY);
            localStorage.removeItem(AUTH_ROLE_STORAGE_KEY);
          }
        } catch (err) {
          console.error("Mentor auth fetch failed:", err);
          if (isMounted) setMentor(null);
        }
      } else {
        // User role: attempt refresh + fetch user profile
        try {
          // Only refresh if we believe user exists (storedRole === "user")
          if (storedRole === "user") {
            const refreshRes = await fetch("/api/users/refresh", {
              method: "POST",
              credentials: "include",
              // Do NOT send Authorization header here — rely on refresh token cookie
            });

            // If refresh fails (403 Forbidden = invalid/expired refresh token, 401 = no token)
            if (refreshRes.status === 403 || refreshRes.status === 401) {
              console.warn(`Auth refresh returned ${refreshRes.status} — user session invalid`);
              if (isMounted) setUser(null);
              localStorage.removeItem(USER_STORAGE_KEY);
              localStorage.removeItem(AUTH_ROLE_STORAGE_KEY);
              localStorage.removeItem(ACTIVE_ACCOUNT_ID_KEY);
              if (isMounted) setIsLoading(false);
              return;
            }
            if (!refreshRes.ok) {
              console.error("Auth refresh failed with status:", refreshRes.status);
              if (isMounted) setIsLoading(false);
              return;
            }
          }

          // Refresh succeeded (or we skipped it): now fetch user profile
          const res = await fetch("/api/users/me", { credentials: "include" });
          if (res.ok) {
            const data = await res.json();
            let userObj = data.user;
            
            // Optionally fetch profile picture
            try {
              const imageRes = await fetch("/api/users/me/pic", {
                credentials: "include",
              });
              if (imageRes.ok) {
                const imageUrl = await imageRes.json();
                userObj.imageUrl = imageUrl;
              }
            } catch (e) {
              console.warn("Profile pic fetch failed", e);
            }

            if (isMounted) {
              setUser(userObj);
              localStorage.setItem(ACTIVE_ACCOUNT_ID_KEY, userObj._id);
            }
            
            // Update saved accounts with latest user info
            setSavedAccounts((prev) => {
              const updated = prev.map((acc) =>
                acc.id === userObj._id
                  ? {
                      ...acc,
                      name: userObj.name,
                      avatar: userObj.imageUrl || userObj.image,
                    }
                  : acc,
              );
              localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(updated));
              return updated;
            });
          } else if (res.status === 401) {
            // User is not authenticated — clear local state
            console.warn("User profile fetch returned 401 — not authenticated");
            if (storedRole === "user") {
              if (isMounted) setUser(null);
              localStorage.removeItem(USER_STORAGE_KEY);
              localStorage.removeItem(AUTH_ROLE_STORAGE_KEY);
              localStorage.removeItem(ACTIVE_ACCOUNT_ID_KEY);
            }
          } else {
            console.error("User profile fetch failed with status:", res.status);
            if (storedRole === "user") {
              if (isMounted) setUser(null);
              localStorage.removeItem(USER_STORAGE_KEY);
              localStorage.removeItem(AUTH_ROLE_STORAGE_KEY);
              localStorage.removeItem(ACTIVE_ACCOUNT_ID_KEY);
            }
          }
        } catch (err) {
          console.error("Auth verification error:", err);
          if (storedRole === "user") {
            if (isMounted) setUser(null);
            localStorage.removeItem(USER_STORAGE_KEY);
            localStorage.removeItem(AUTH_ROLE_STORAGE_KEY);
            localStorage.removeItem(ACTIVE_ACCOUNT_ID_KEY);
          }
        }
      }
      if (isMounted) setIsLoading(false);
    };

    verifyAuth();

    // Cleanup: mark component as unmounted to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, []);
  // Removed [location.pathname, location.search] dependency to prevent excessive refresh calls.
  // Auth verification now runs only on initial mount. Components can call fetchUser() directly when needed.

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem(AUTH_ROLE_STORAGE_KEY, "user");
      localStorage.setItem(ACTIVE_ACCOUNT_ID_KEY, user._id);
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(ACTIVE_ACCOUNT_ID_KEY);
      if (localStorage.getItem(AUTH_ROLE_STORAGE_KEY) === "user") {
        localStorage.removeItem(AUTH_ROLE_STORAGE_KEY);
      }
    }
  }, [user]);

  useEffect(() => {
    if (mentor) {
      localStorage.setItem(MENTOR_STORAGE_KEY, JSON.stringify(mentor));
      localStorage.setItem(AUTH_ROLE_STORAGE_KEY, "mentor");
    } else {
      localStorage.removeItem(MENTOR_STORAGE_KEY);
      if (localStorage.getItem(AUTH_ROLE_STORAGE_KEY) === "mentor") {
        localStorage.removeItem(AUTH_ROLE_STORAGE_KEY);
      }
    }
  }, [mentor]);

  const fetchUser = async (switchTokenToSave = null, options = null) => {
    const accessToken =
      options && typeof options === "object" && options.accessToken
        ? options.accessToken
        : null;

    try {
      // Authorization header is used for access token auth (e.g., from Google OAuth flow).
      // If no accessToken: rely on refresh token cookie + call /refresh first.
      const authHeaders = accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : {};

      // If we don't have an explicit access token, attempt refresh to obtain fresh tokens.
      // This ensures valid tokens are set in httpOnly cookies.
      if (!accessToken) {
        const refreshRes = await fetch("/api/users/refresh", {
          method: "POST",
          credentials: "include",
          // No Authorization header — refresh endpoint uses refresh token cookie
        });

        if (refreshRes.status === 403 || refreshRes.status === 401) {
          console.warn(`Refresh failed with ${refreshRes.status} — session invalid`);
          setUser(null);
          localStorage.removeItem(USER_STORAGE_KEY);
          localStorage.removeItem(AUTH_ROLE_STORAGE_KEY);
          localStorage.removeItem(ACTIVE_ACCOUNT_ID_KEY);
          return null;
        }

        if (!refreshRes.ok) {
          console.error("Refresh failed:", refreshRes.status);
          return null;
        }
      }

      // Now fetch user profile using either accessToken header or refreshed cookies
      const res = await fetch("/api/users/me", {
        credentials: "include",
        headers: authHeaders,
      });

      if (!res.ok) {
        console.error("User profile fetch failed:", res.status);
        return null;
      }

      const data = await res.json();
      let userObj = data.user;

      // Attempt to fetch profile picture
      try {
        const imageRes = await fetch("/api/users/me/pic", {
          credentials: "include",
          headers: authHeaders,
        });
        if (imageRes.ok) {
          userObj.imageUrl = await imageRes.json();
        }
      } catch (e) {
        console.warn("Profile pic fetch failed", e);
      }

      // Update user state and localStorage
      setUser(userObj);
      if (switchTokenToSave) {
        addSavedAccount(userObj, switchTokenToSave);
      }
      return userObj;
    } catch (err) {
      console.error("fetchUser error:", err);
      return null;
    }
  };

  /**
   * Login with email and password.
   * Calls /api/users/login which should set httpOnly refresh + access token cookies.
   * Then calls fetchUser() to populate user state.
   * @param {string} email
   * @param {string} password
   * @throws {Error} with message if login fails
   * @returns {Promise<object>} user object if successful
   */
  const login = async (email, password) => {
    try {
      const res = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Important: allow cookies to be sent/received
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Login failed");
      }

      // Login successful: backend has set cookies.
      // Now fetch user profile to populate context.
      const user = await fetchUser();
      if (!user) {
        throw new Error("Failed to fetch user after login");
      }

      return user;
    } catch (err) {
      console.error("Login error:", err);
      throw err; // Caller (Login.jsx) should handle and show toast
    }
  };

  return (
    <UserContext.Provider value={{
      user, setUser, fetchUser, login, isLoading,
      savedAccounts, addSavedAccount, removeSavedAccount, logoutCurrentAccount, logoutAllAccounts
    }}>
      {children}
    </UserContext.Provider>
  );
}
