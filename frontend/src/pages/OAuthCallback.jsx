import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { getCurrentSession } from '../services/authService';

export default function OAuthCallback({ onComplete }) {
  const loginStore = useAuthStore((s) => s.login);
  useEffect(() => {
    let active = true;
    getCurrentSession()
      .then(({ user }) => active && loginStore({ user }))
      .finally(() => {
        window.history.replaceState({}, '', '/app');
        if (active) onComplete?.();
      });
    return () => { active = false; };
  }, [loginStore, onComplete]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d1117', color: '#e6edf3' }}>
      <div style={{ textAlign: 'center' }}><div style={{ fontSize: 32, marginBottom: 16 }}>🏦</div><p>Signing you in...</p></div>
    </div>
  );
}
