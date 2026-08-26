import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';

export default function OAuthCallback({ onComplete }) {
  const loginStore = useAuthStore((s) => s.login);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    if (accessToken && refreshToken) {
      try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        loginStore({ user: { id: payload.sub, email: '', name: 'User' }, access_token: accessToken, refresh_token: refreshToken });
      } catch {
        loginStore({ user: null, access_token: accessToken, refresh_token: refreshToken });
      }
    }
    window.history.replaceState({}, '', '/app');
    onComplete?.();
  }, [loginStore, onComplete]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d1117', color: '#e6edf3' }}>
      <div style={{ textAlign: 'center' }}><div style={{ fontSize: 32, marginBottom: 16 }}>🏦</div><p>Signing you in...</p></div>
    </div>
  );
}
