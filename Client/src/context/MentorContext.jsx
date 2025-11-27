import { createContext, useContext, useState, useMemo, useCallback, useEffect } from "react";

const MentorContext = createContext();

const MENTOR_STORAGE_KEY = 'admeasy:mentor';
const USER_STORAGE_KEY = 'admeasy:user';
const AUTH_ROLE_STORAGE_KEY = 'admeasy:authRole';

export function useMentor() {
  return useContext(MentorContext);
}

function getInitialMentor() {
  if (typeof window === 'undefined') return null;
  const role = localStorage.getItem(AUTH_ROLE_STORAGE_KEY);
  if (role !== 'mentor') return null;
  try {
    const stored = localStorage.getItem(MENTOR_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (err) {
    console.error('Failed to parse stored mentor', err);
    return null;
  }
}

export function MentorProvider({ children }) {
  const [mentor, setMentor] = useState(getInitialMentor); // mentor object: { name, email, image, course, college, ... }
  const [isLoading, setIsLoading] = useState(true); // Track if initial auth verification is complete

  // Verify authentication with server on mount if localStorage has data
  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }
    
    const verifyAuth = async () => {
      const storedRole = localStorage.getItem(AUTH_ROLE_STORAGE_KEY);
      const hasStoredMentor = localStorage.getItem(MENTOR_STORAGE_KEY);
      
      if (storedRole === 'mentor' && hasStoredMentor) {
        try {
          // Always verify with server - localStorage is just a cache
          await fetch("/api/mentors/refresh", {
            method: "POST",
            credentials: "include",
          });
          const res = await fetch("/api/mentors/me", {
            credentials: "include",
          });
          if (res.ok) {
            const data = await res.json();
            let mentorObj = data.mentor;
            // Fetch image if available
            if (mentorObj.image) {
              const imageRes = await fetch('/api/mentors/me/pic', { credentials: 'include' });
              if (imageRes.ok) {
                const imageUrl = await imageRes.json();
                mentorObj.imageUrl = imageUrl;
              }
            }
            setMentor(mentorObj);
          } else {
            // Server says not authenticated, clear localStorage
            setMentor(null);
            localStorage.removeItem(MENTOR_STORAGE_KEY);
            localStorage.removeItem(AUTH_ROLE_STORAGE_KEY);
          }
        } catch (err) {
          console.error('Auth verification failed:', err);
          // On error, clear potentially stale data
          setMentor(null);
          localStorage.removeItem(MENTOR_STORAGE_KEY);
          localStorage.removeItem(AUTH_ROLE_STORAGE_KEY);
        }
      }
      setIsLoading(false);
    };

    verifyAuth();
  }, []); // Only run on mount

  // Sync state across tabs when localStorage changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleStorageChange = (e) => {
      // Only sync if change came from another tab (not current tab)
      if (e.key === MENTOR_STORAGE_KEY) {
        try {
          const newMentor = e.newValue ? JSON.parse(e.newValue) : null;
          // Verify with server before trusting cross-tab update
          if (newMentor) {
            fetch("/api/mentors/me", { credentials: "include" })
              .then(res => {
                if (res.ok) {
                  setMentor(newMentor);
                } else {
                  // Server says not authenticated, clear state
                  setMentor(null);
                  localStorage.removeItem(MENTOR_STORAGE_KEY);
                  localStorage.removeItem(AUTH_ROLE_STORAGE_KEY);
                }
              })
              .catch(() => {
                setMentor(null);
                localStorage.removeItem(MENTOR_STORAGE_KEY);
                localStorage.removeItem(AUTH_ROLE_STORAGE_KEY);
              });
          } else {
            setMentor(null);
          }
        } catch (err) {
          console.error('Failed to parse mentor from storage event', err);
        }
      } else if (e.key === AUTH_ROLE_STORAGE_KEY) {
        // If auth role changes, update mentor state accordingly
        if (e.newValue !== 'mentor') {
          setMentor(null);
        } else {
          // Reload mentor from storage and verify
          const stored = localStorage.getItem(MENTOR_STORAGE_KEY);
          if (stored) {
            try {
              const parsedMentor = JSON.parse(stored);
              // Verify with server
              fetch("/api/mentors/me", { credentials: "include" })
                .then(res => {
                  if (res.ok) {
                    setMentor(parsedMentor);
                  } else {
                    setMentor(null);
                    localStorage.removeItem(MENTOR_STORAGE_KEY);
                    localStorage.removeItem(AUTH_ROLE_STORAGE_KEY);
                  }
                })
                .catch(() => {
                  setMentor(null);
                  localStorage.removeItem(MENTOR_STORAGE_KEY);
                  localStorage.removeItem(AUTH_ROLE_STORAGE_KEY);
                });
            } catch (err) {
              console.error('Failed to parse mentor after role change', err);
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
    if (mentor) {
      // Store in localStorage as cache only - server is source of truth
      localStorage.setItem(MENTOR_STORAGE_KEY, JSON.stringify(mentor));
      localStorage.setItem(AUTH_ROLE_STORAGE_KEY, 'mentor');
      localStorage.removeItem(USER_STORAGE_KEY);
    } else {
      localStorage.removeItem(MENTOR_STORAGE_KEY);
      if (localStorage.getItem(AUTH_ROLE_STORAGE_KEY) === 'mentor') {
        localStorage.removeItem(AUTH_ROLE_STORAGE_KEY);
      }
    }
  }, [mentor]);

  const fetchMentor = useCallback(async () => {
    // Always attempt to refresh
    await fetch("/api/mentors/refresh", {
      method: "POST",
      credentials: "include",
    });

    // Then fetch mentor data
    const res = await fetch("/api/mentors/me", {
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      let mentorObj = data.mentor;
      // Fetch image if available
      if (mentorObj.image) {
        const imageRes = await fetch('/api/mentors/me/pic', { credentials: 'include' });
        if (imageRes.ok) {
          const imageUrl = await imageRes.json();
          mentorObj.imageUrl = imageUrl;
        }
      }
      setMentor(mentorObj);
    } else {
      setMentor(null);
    }
  }, []);

  // Memoize mentor data to prevent unnecessary re-renders
  const mentorMemo = useMemo(() => mentor, [mentor]);

  return (
    <MentorContext.Provider value={{ mentor: mentorMemo, setMentor, fetchMentor, isLoading }}>
      {children}
    </MentorContext.Provider>
  );
}

