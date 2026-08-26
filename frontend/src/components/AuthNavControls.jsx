import React, { useState } from 'react';
import { LogIn, LogOut, BookmarkCheck, UserCircle, CheckCircle2, Cloud } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import AuthModal from './AuthModal';
import { saveProfile } from '../services/authService';
import { useProfileStore } from '../stores/profileStore';

export default function AuthNavControls() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const accessToken = useAuthStore((s) => s.accessToken);
  const profile = useProfileStore((s) => s.profile);
  const [showAuth, setShowAuth] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const handleSave = async () => {
    if (!isAuthenticated || !accessToken) return;
    setSaving(true);
    try {
      await saveProfile(profile, `Audit Profile · ${new Date().toLocaleDateString('de-DE')}`, accessToken);
      setSaveMsg('Saved');
    } catch {
      setSaveMsg('Error');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 2500);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {isAuthenticated ? (
        <>
          {/* Save Snapshot Button */}
          <button 
            type="button"
            onClick={handleSave} 
            disabled={saving} 
            style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              borderRadius: 8,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '0.78rem',
              fontWeight: 700,
              background: saveMsg === 'Saved' ? 'rgba(5, 150, 105, 0.15)' : 'var(--bg-card-subtle)',
              color: saveMsg === 'Saved' ? 'var(--accent-emerald, #059669)' : 'var(--text-primary)',
              border: `1px solid ${saveMsg === 'Saved' ? 'var(--accent-emerald, #059669)' : 'var(--maison-gold-border)'}`,
              transition: 'all 0.22s var(--ease-luxury)',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            {saveMsg === 'Saved' ? (
              <>
                <CheckCircle2 size={13} color="var(--accent-emerald, #059669)" />
                <span>Synchronized</span>
              </>
            ) : (
              <>
                <BookmarkCheck size={13} color="var(--maison-gold, #c5a059)" />
                <span>{saving ? 'Saving…' : 'Save Snapshot'}</span>
              </>
            )}
          </button>

          {/* User Badge */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 6, 
            padding: '5px 10px', 
            borderRadius: 8, 
            background: 'var(--bg-card-subtle)',
            border: '1px solid var(--border-architectural)'
          }}>
            {user?.avatar_url ? (
              <img 
                src={user.avatar_url} 
                alt="" 
                style={{ width: 22, height: 22, borderRadius: '50%', border: '1px solid var(--maison-gold)' }} 
              />
            ) : (
              <UserCircle size={18} color="var(--maison-gold, #c5a059)" />
            )}
            <span style={{ 
              fontSize: '0.75rem', 
              fontWeight: 600,
              color: 'var(--text-primary)', 
              maxWidth: 90, 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap' 
            }}>
              {user?.name || user?.email || 'Client'}
            </span>
          </div>

          {/* Logout Action */}
          <button 
            type="button"
            onClick={logout} 
            title="Sign out of client session"
            aria-label="Sign out"
            style={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '7px 10px',
              borderRadius: 8,
              background: 'var(--bg-card-subtle)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-architectural)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-coral, #e11d48)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            <LogOut size={13} />
          </button>
        </>
      ) : (
        <button 
          type="button"
          onClick={() => setShowAuth(true)} 
          style={{ 
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 16px',
            borderRadius: 8,
            border: '1px solid var(--maison-gold, #c5a059)',
            cursor: 'pointer',
            fontSize: '0.78rem',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #101c2e 0%, #1e3350 100%)',
            color: '#ffffff',
            boxShadow: '0 2px 10px rgba(197, 160, 89, 0.2)',
            transition: 'all 0.2s var(--ease-luxury)'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(197, 160, 89, 0.35)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 10px rgba(197, 160, 89, 0.2)';
          }}
        >
          <LogIn size={13} color="var(--maison-gold, #c5a059)" />
          <span>Client Sign In</span>
        </button>
      )}
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
}
