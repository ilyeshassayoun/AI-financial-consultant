const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

// ---------- Token refresh interceptor ----------
// Ensures a single in-flight refresh and retries the original request once.
let _refreshPromise = null;

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || `HTTP ${response.status}`);
  return data;
}

async function apiFetchWithRetry(path, options = {}) {
  try {
    return await apiFetch(path, options);
  } catch (err) {
    // If the request failed with 401, attempt a silent token refresh and retry once.
    if (err.message.includes('401') && !path.startsWith('/api/auth/')) {
      try {
        if (!_refreshPromise) {
          _refreshPromise = apiFetch('/api/auth/refresh', { method: 'POST', body: JSON.stringify({}) })
            .finally(() => { _refreshPromise = null; });
        }
        await _refreshPromise;
        return await apiFetch(path, options);
      } catch {
        // Refresh failed — propagate the original error.
        throw err;
      }
    }
    throw err;
  }
}

export const register = ({ email, password, name }) => apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name }) });
export const login = ({ email, password }) => apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
export const refreshSession = () => apiFetch('/api/auth/refresh', { method: 'POST', body: JSON.stringify({}) });
export const getCurrentSession = () => apiFetchWithRetry('/api/auth/me');
export const logoutSession = () => apiFetch('/api/auth/logout', { method: 'POST' });
export const saveProfile = (profile, name) => apiFetchWithRetry('/api/profiles/', { method: 'POST', body: JSON.stringify({ name, profile }) });
export const listProfiles = () => apiFetchWithRetry('/api/profiles/');
export const loadProfile = (id) => apiFetchWithRetry(`/api/profiles/${id}`);
export const deleteProfileApi = async (id) => {
  const r = await fetch(`${API_BASE}/api/profiles/${id}`, { method: 'DELETE', credentials: 'include' });
  if (!r.ok && r.status !== 204) throw new Error(`HTTP ${r.status}`);
};
