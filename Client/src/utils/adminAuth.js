/**
 * Admin panel auth: store and send JWT for /api/admin requests.
 * Use sessionStorage so token is sent with requests in production when cookies are not forwarded.
 */

const STORAGE_KEY = 'admeasy_admin_token';

export function getAdminToken() {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setAdminToken(token) {
  try {
    if (token) sessionStorage.setItem(STORAGE_KEY, token);
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('adminAuth: setAdminToken failed', e);
  }
}

export function clearAdminToken() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {}
}

/**
 * Headers to attach to admin API requests (Authorization Bearer + credentials for cookie fallback).
 */
export function getAdminAuthHeaders(extra = {}) {
  const token = getAdminToken();
  const headers = { ...extra };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Fetch options for admin API: credentials + Authorization header.
 */
export function adminFetchOptions(method = 'GET', body = null) {
  const options = {
    credentials: 'include',
    headers: getAdminAuthHeaders({ 'Content-Type': 'application/json' })
  };
  if (method !== 'GET') options.method = method;
  if (body != null) options.body = typeof body === 'string' ? body : JSON.stringify(body);
  return options;
}
