import { createContext, useContext, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { enableNotifications } from "../Firebase/enableNotifications";

const UserContext = createContext();

const USER_STORAGE_KEY = 'admeasy:user';
const MENTOR_STORAGE_KEY = 'admeasy:mentor';
const AUTH_ROLE_STORAGE_KEY = 'admeasy:authRole';
const SAVED_ACCOUNTS_KEY = 'admeasy:saved_accounts';

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
    return null;
  }
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(getInitialUser);
  const [isLoading, setIsLoading] = useState(true);

  // Multiple Accounts state
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
    const existingAccounts = savedAccounts.filter(acc => acc._id !== userData._id);
    const updatedAccounts = [...existingAccounts, {
      _id: userData._id,
      name: userData.name,
      email: userData.email,
      imageUrl: userData.imageUrl,
      switchToken
    }];
    setSavedAccounts(updatedAccounts);
    localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(updatedAccounts));
  };

  const removeSavedAccount = (accountId) => {
    const updated = savedAccounts.filter(acc => acc._id !== accountId);
    setSavedAccounts(updated);
    localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(updated));
  };

  const logoutAllAccounts = async () => {
    try {
      await fetch('/api/users/logout', { method: 'POST', credentials: 'include' });
      setUser(null);
      setSavedAccounts([]);
      localStorage.clear(); // Clears everything
      navigate('/');
    } catch (err) {
      console.error("Logout all failed", err);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const verifyAuth = async () => {
      setIsLoading(true);
      const storedRole = localStorage.getItem(AUTH_ROLE_STORAGE_KEY);

      if (storedRole !== 'mentor') {
        try {
          await fetch("/api/users/refresh", { method: "POST", credentials: "include" });
          const res = await fetch("/api/users/me", { credentials: "include" });
          if (res.ok) {
            const data = await res.json();
            let userObj = data.user;

            try {
              const imageRes = await fetch('/api/users/me/pic', { credentials: 'include' });
              if (imageRes.ok) {
                const imageUrl = await imageRes.json();
                userObj.imageUrl = imageUrl;
              }
            } catch (e) {
              console.warn("Profile pic fetch failed", e);
            }

            setUser(userObj);

            // Auto update saved account details if changed
            setSavedAccounts(prev => {
              const updated = prev.map(acc => acc._id === userObj._id ? { ...acc, name: userObj.name, imageUrl: userObj.imageUrl } : acc);
              localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(updated));
              return updated;
            });
          } else {
            if (storedRole === 'user') {
              setUser(null);
              localStorage.removeItem(USER_STORAGE_KEY);
              localStorage.removeItem(AUTH_ROLE_STORAGE_KEY);
            }
          }
        } catch (err) {
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
  }, [location.pathname]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem(AUTH_ROLE_STORAGE_KEY, 'user');
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
      if (localStorage.getItem(AUTH_ROLE_STORAGE_KEY) === 'user') {
        localStorage.removeItem(AUTH_ROLE_STORAGE_KEY);
      }
    }
  }, [user]);

  const fetchUser = async (switchTokenToSave = null) => {
    await fetch("/api/users/refresh", { method: "POST", credentials: "include" });
    const res = await fetch("/api/users/me", { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      let userObj = data.user;
      const imageRes = await fetch('/api/users/me/pic', { credentials: 'include' });
      if (imageRes.ok) {
        userObj.imageUrl = await imageRes.json();
      }
      setUser(userObj);
      if (switchTokenToSave) {
        addSavedAccount(userObj, switchTokenToSave);
      }
      return userObj;
    }
    return null;
  };

  return (
    <UserContext.Provider value={{
      user, setUser, fetchUser, isLoading,
      savedAccounts, addSavedAccount, removeSavedAccount, logoutAllAccounts
    }}>
      {children}
    </UserContext.Provider>
  );
}