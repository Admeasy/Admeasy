import { createContext, useContext, useState, useEffect } from"react";
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
 if (typeof window ==='undefined') return null;
 const role = localStorage.getItem(AUTH_ROLE_STORAGE_KEY);
 if (role !=='user') return null;
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
 setSavedAccounts(prevAccounts => {
 const existingAccounts = prevAccounts.filter(acc => acc.id !== userData._id);
 const updatedAccounts = [...existingAccounts, {
 id: userData._id,
 name: userData.name,
 email: userData.email,
 avatar: userData.imageUrl || userData.image,
 token: switchToken
 }];
 localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(updatedAccounts));
 localStorage.setItem(ACTIVE_ACCOUNT_ID_KEY, userData._id);
 return updatedAccounts;
 });
 };

 const removeSavedAccount = (accountId) => {
 setSavedAccounts(prevAccounts => {
 const updated = prevAccounts.filter(acc => acc.id !== accountId);
 localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(updated));
 return updated;
 });
 };

 /** Log out only the current account. Invalidates current session, removes it from saved list.
 * If other saved accounts exist, switches to the first one. Otherwise redirects to login. */
 const logoutCurrentAccount = async () => {
 const currentId = user?._id;
 try {
 await fetch('/api/users/logout', { method:'POST', credentials:'include'});
 } catch (err) {
 console.error("Logout API call failed:", err);
 }
 removeSavedAccount(currentId);
 const remaining = savedAccounts.filter(acc => acc.id !== currentId);
 if (remaining.length > 0) {
 try {
 const res = await fetch("/api/users/switch-account", {
 method:"POST",
 headers: {"Content-Type":"application/json"},
 body: JSON.stringify({ switchToken: remaining[0].token }),
 credentials:"include",
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
 setSavedAccounts([]);
 localStorage.removeItem(USER_STORAGE_KEY);
 localStorage.removeItem(AUTH_ROLE_STORAGE_KEY);
 localStorage.removeItem(ACTIVE_ACCOUNT_ID_KEY);
 localStorage.removeItem(SAVED_ACCOUNTS_KEY);
 navigate('/');
 try {
 await fetch('/api/users/logout', { method:'POST', credentials:'include'});
 } catch (err) {
 console.error("Logout API call failed (session ended locally):", err);
 }
 };

 useEffect(() => {
 if (typeof window ==='undefined') return;
 const verifyAuth = async () => {
 setIsLoading(true);
 const storedRole = localStorage.getItem(AUTH_ROLE_STORAGE_KEY);

 if (storedRole !=='mentor') {
 try {
 const refreshRes = await fetch("/api/users/refresh", { method:"POST", credentials:"include"});
 if (refreshRes.status === 401) {
 setUser(null);
 localStorage.removeItem(USER_STORAGE_KEY);
 localStorage.removeItem(AUTH_ROLE_STORAGE_KEY);
 localStorage.removeItem(ACTIVE_ACCOUNT_ID_KEY);
 setIsLoading(false);
 return;
 }
 const res = await fetch("/api/users/me", { credentials:"include"});
 if (res.ok) {
 const data = await res.json();
 let userObj = data.user;

 try {
 const imageRes = await fetch('/api/users/me/pic', { credentials:'include'});
 if (imageRes.ok) {
 const imageUrl = await imageRes.json();
 userObj.imageUrl = imageUrl;
 }
 } catch (e) {
 console.warn("Profile pic fetch failed", e);
 }

 setUser(userObj);
 localStorage.setItem(ACTIVE_ACCOUNT_ID_KEY, userObj._id);

 // Auto update saved account details if changed
 setSavedAccounts(prev => {
 const updated = prev.map(acc => acc.id === userObj._id ? { ...acc, name: userObj.name, avatar: userObj.imageUrl || userObj.image } : acc);
 localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(updated));
 return updated;
 });
 } else {
 if (storedRole ==='user') {
 setUser(null);
 localStorage.removeItem(USER_STORAGE_KEY);
 localStorage.removeItem(AUTH_ROLE_STORAGE_KEY);
 localStorage.removeItem(ACTIVE_ACCOUNT_ID_KEY);
 }
 }
 } catch (err) {
 if (storedRole ==='user') {
 setUser(null);
 localStorage.removeItem(USER_STORAGE_KEY);
 localStorage.removeItem(AUTH_ROLE_STORAGE_KEY);
 localStorage.removeItem(ACTIVE_ACCOUNT_ID_KEY);
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
 localStorage.setItem(AUTH_ROLE_STORAGE_KEY,'user');
 localStorage.setItem(ACTIVE_ACCOUNT_ID_KEY, user._id);
 } else {
 localStorage.removeItem(USER_STORAGE_KEY);
 localStorage.removeItem(ACTIVE_ACCOUNT_ID_KEY);
 if (localStorage.getItem(AUTH_ROLE_STORAGE_KEY) ==='user') {
 localStorage.removeItem(AUTH_ROLE_STORAGE_KEY);
 }
 }
 }, [user]);

 const fetchUser = async (switchTokenToSave = null) => {
 await fetch("/api/users/refresh", { method:"POST", credentials:"include"});
 const res = await fetch("/api/users/me", { credentials:"include"});
 if (res.ok) {
 const data = await res.json();
 let userObj = data.user;
 const imageRes = await fetch('/api/users/me/pic', { credentials:'include'});
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
 savedAccounts, addSavedAccount, removeSavedAccount, logoutCurrentAccount, logoutAllAccounts
 }}>
 {children}
 </UserContext.Provider>
 );
}