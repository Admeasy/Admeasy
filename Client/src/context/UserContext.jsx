import { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext();

export function useUser() {
  return useContext(UserContext);
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(null); // user object: { name, email, image, ... }

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/users/me', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        let user = data.user;
        // Fetch authorized image URL if user has an image
        if (user && user.image) {
          try {
            const imgRes = await fetch('/api/users/me/pic', { credentials: 'include' });
            if (imgRes.ok) {
              const imgUrl = await imgRes.json();
              user = { ...user, imageUrl: imgUrl };
            }
          } catch {
            user = { ...user, imageUrl: null };
          }
        }
        setUser(user);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, fetchUser }}>
      {children}
    </UserContext.Provider>
  );
} 