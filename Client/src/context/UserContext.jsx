import { createContext, useContext, useState, useMemo } from "react";

const UserContext = createContext();

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
}

export function useUser() {
  return useContext(UserContext);
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(null); // user object: { name, email, image, ... }

  const fetchUser = async () => {
    try {
      // Always attempt to refresh token first
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

        // Fetch profile image if available
        const imageRes = await fetch("/api/users/me/pic", {
          credentials: "include",
        });
        if (imageRes.ok) {
          const imageUrl = await imageRes.json();
          userObj.imageUrl = imageUrl;
        }

        setUser(userObj);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      setUser(null);
    }
  };

  // ✅ Memoize context value to prevent infinite re-renders
  const value = useMemo(
    () => ({ user, setUser, fetchUser }),
    [user] // Only updates when `user` changes
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
