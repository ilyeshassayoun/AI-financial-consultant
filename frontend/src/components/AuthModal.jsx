import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Mail, Lock, User, Globe, Landmark } from 'lucide-react';
import { register, login } from '../services/authService';
import { useAuthStore } from '../stores/authStore';

export default function AuthModal({ isOpen, onClose, onSuccess }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const loginStore = useAuthStore((s) => s.login);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = mode === 'login' 
        ? await login({ email, password }) 
        : await register({ email, password, name });
      loginStore({ user: result.user });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  }, [mode, email, password, name, loginStore, onSuccess, onClose]);

  if (!isOpen) return null;

  const inputStyle = {
    width: '100%',
    padding: '12px 14px 12px 38px',
    borderRadius: 8,
    fontSize: 14,
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(226, 210, 176, 0.2)',
    color: '#f8fafc',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
  };

  return createPortal(
    <div 
      style={{ 
        position: 'fixed', 
        inset: 0, 
        zIndex: 9999, 
        background: 'rgba(4, 8, 14, 0.82)', 
        backdropFilter: 'blur(8px)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: 'clamp(16px, 4vw, 28px)',
        boxSizing: 'border-box'
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()} 
      role="dialog" 
      aria-modal="true"
    >
      <div 
        style={{ 
          background: 'linear-gradient(180deg, #0c1524 0%, #080f1a 100%)', 
          border: '1px solid rgba(226, 210, 176, 0.25)', 
          borderRadius: 20, 
          padding: 36, 
          width: '100%', 
          maxWidth: 440, 
          maxHeight: 'calc(100dvh - 32px)',
          overflowY: 'auto',
          position: 'relative',
          margin: 'auto',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(197, 160, 89, 0.12)'
        }}
      >
        {/* Close Button */}
        <button 
          onClick={onClose} 
          style={{ 
            position: 'absolute', 
            top: 18, 
            right: 18, 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer', 
            color: 'rgba(241, 245, 249, 0.45)', 
            padding: 4,
            transition: 'color 0.2s ease'
          }} 
          onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(241, 245, 249, 0.45)'}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Modal Header & Crest */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 10,
            background: 'rgba(197, 160, 89, 0.12)',
            border: '1px solid rgba(197, 160, 89, 0.35)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12
          }}>
            <Landmark size={20} color="var(--maison-gold, #c5a059)" />
          </div>
          <h2 style={{ 
            fontFamily: 'var(--font-serif)', 
            fontStyle: 'italic',
            fontWeight: 700, 
            fontSize: '1.4rem', 
            color: '#f8fafc', 
            margin: 0,
            letterSpacing: '-0.02em'
          }}>
            Ilyes Private Wealth
          </h2>
          <p style={{ 
            fontSize: 12, 
            color: 'rgba(241, 245, 249, 0.55)', 
            margin: '4px 0 0 0'
          }}>
            {mode === 'login' ? 'Sign in to access and sync client portfolios' : 'Establish client advisory credentials'}
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: 4, 
          background: 'rgba(0, 0, 0, 0.3)', 
          border: '1px solid rgba(226, 210, 176, 0.15)',
          borderRadius: 10, 
          padding: 4, 
          marginBottom: 24 
        }}>
          {['login', 'register'].map((m) => (
            <button 
              key={m} 
              onClick={() => { setMode(m); setError(''); }} 
              style={{ 
                flex: 1, 
                padding: '9px 12px', 
                borderRadius: 7, 
                border: m === mode ? '1px solid var(--maison-gold, #c5a059)' : '1px solid transparent', 
                cursor: 'pointer', 
                fontSize: 13, 
                fontWeight: 700, 
                background: m === mode ? 'linear-gradient(135deg, #101c2e 0%, #1e3350 100%)' : 'transparent', 
                color: m === mode ? '#ffffff' : 'rgba(241, 245, 249, 0.55)',
                boxShadow: m === mode ? '0 2px 10px rgba(197, 160, 89, 0.2)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              {m === 'login' ? 'Client Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode === 'register' && (
            <div style={{ position: 'relative' }}>
              <User size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--maison-gold, #c5a059)' }} />
              <input 
                type="text" 
                placeholder="Full legal name" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                style={inputStyle} 
              />
            </div>
          )}
          <div style={{ position: 'relative' }}>
            <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--maison-gold, #c5a059)' }} />
            <input 
              type="email" 
              placeholder="Email address" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              style={inputStyle} 
            />
          </div>
          <div style={{ position: 'relative' }}>
            <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--maison-gold, #c5a059)' }} />
            <input 
              type="password" 
              placeholder="Password (min 8 characters)" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              minLength={8} 
              style={inputStyle} 
            />
          </div>

          {error && (
            <div style={{ 
              padding: '10px 14px', 
              borderRadius: 8, 
              background: 'rgba(225, 29, 72, 0.12)', 
              border: '1px solid rgba(225, 29, 72, 0.3)', 
              fontSize: 13, 
              color: '#fb7185' 
            }}>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading} 
            style={{ 
              padding: '13px 20px', 
              borderRadius: 10, 
              border: '1px solid var(--maison-gold, #c5a059)', 
              cursor: loading ? 'not-allowed' : 'pointer', 
              background: loading ? 'rgba(16, 28, 46, 0.6)' : 'linear-gradient(135deg, #101c2e 0%, #1e3350 100%)', 
              color: '#ffffff', 
              fontWeight: 700, 
              fontSize: 14, 
              marginTop: 6,
              boxShadow: '0 4px 18px rgba(197, 160, 89, 0.25)',
              transition: 'all 0.2s ease'
            }}
          >
            {loading ? 'Authenticating…' : (mode === 'login' ? 'Sign In to Portal' : 'Establish Advisory Account')}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(226, 210, 176, 0.15)' }} />
          <span style={{ fontSize: 11, color: 'rgba(241, 245, 249, 0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(226, 210, 176, 0.15)' }} />
        </div>

        {/* OAuth SSO Button */}
        <button 
          onClick={() => window.location.href = getGoogleOAuthUrl()} 
          style={{ 
            width: '100%', 
            padding: 12, 
            borderRadius: 10, 
            cursor: 'pointer', 
            background: 'rgba(255, 255, 255, 0.04)', 
            border: '1px solid rgba(226, 210, 176, 0.2)', 
            color: '#f8fafc', 
            fontWeight: 600, 
            fontSize: 13, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: 10,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--maison-gold, #c5a059)';
            e.currentTarget.style.background = 'rgba(197, 160, 89, 0.08)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'rgba(226, 210, 176, 0.2)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
          }}
        >
          <Globe size={16} color="var(--maison-gold, #c5a059)" /> Continue with Google Single Sign-On
        </button>

        <p style={{ marginTop: 20, fontSize: 11, textAlign: 'center', color: 'rgba(241, 245, 249, 0.4)', lineHeight: 1.6 }}>
          All portfolio snapshots are encrypted. Data is stored solely on explicit save.
        </p>
      </div>
    </div>,
    document.body
  );
}
