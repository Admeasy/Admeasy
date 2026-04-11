/**
 * School/Teacher auth: store and send JWT for school panel.
 */

const STORAGE_KEY ='admeasy_school_token';

export function getSchoolToken() {
 try {
 return sessionStorage.getItem(STORAGE_KEY);
 } catch {
 return null;
 }
}

export function setSchoolToken(token) {
 try {
 if (token) sessionStorage.setItem(STORAGE_KEY, token);
 else sessionStorage.removeItem(STORAGE_KEY);
 } catch (e) {
 console.warn('schoolAuth: setSchoolToken failed', e);
 }
}

export function clearSchoolToken() {
 try {
 sessionStorage.removeItem(STORAGE_KEY);
 } catch {}
}

export function getSchoolAuthHeaders(extra = {}) {
 const token = getSchoolToken();
 const headers = { ...extra };
 if (token) {
 headers.Authorization =`Bearer ${token}`;
 }
 return headers;
}
