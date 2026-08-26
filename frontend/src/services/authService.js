const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, { headers: { 'Content-Type': 'application/json', ...options.headers }, ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || `HTTP ${response.status}`);
  return data;
}

export const register = ({ email, password, name }) => apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name }) });
export const login = ({ email, password }) => apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
export const refreshTokens = (refreshToken) => apiFetch('/api/auth/refresh', { method: 'POST', body: JSON.stringify({ refresh_token: refreshToken }) });
export const getGoogleOAuthUrl = () => `${API_BASE}/api/auth/google`;
export const saveProfile = (profile, name, accessToken) => apiFetch('/api/profiles/', { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ name, profile }) });
export const listProfiles = (accessToken) => apiFetch('/api/profiles/', { headers: { Authorization: `Bearer ${accessToken}` } });
export const loadProfile = (id, accessToken) => apiFetch(`/api/profiles/${id}`, { headers: { Authorization: `Bearer ${accessToken}` } });
export const deleteProfileApi = async (id, accessToken) => {
  const r = await fetch(`${API_BASE}/api/profiles/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } });
  if (!r.ok && r.status !== 204) throw new Error(`HTTP ${r.status}`);
};
