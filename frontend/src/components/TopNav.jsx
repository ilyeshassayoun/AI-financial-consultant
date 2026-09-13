import React, { useState } from 'react';
import { Menu, X, ChevronRight, Landmark, ShieldCheck, Moon, Sun, Bot, RefreshCw } from 'lucide-react';
import AuthNavControls from './AuthNavControls';
import { SECTION_SUBSTEPS, steps } from './TopNav.constants';

export default function TopNav({ currentStep, setStep, currentSubStep = 0, onOpenGDPR, onOpenAdvisor, onRefreshAnalysis, analysisStatus }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // App restores the DOM attribute in an effect, so read persisted state here as well.
  // Otherwise a saved dark preference renders as dark while this toggle still says "dark".
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const subTabs = SECTION_SUBSTEPS[currentStep] || [];
  
  const stepIndex = Math.max(0, steps.findIndex(s => s.id === currentStep));
  const subIndex = Math.max(0, currentSubStep || 0);
  const subTotal = Math.max(1, subTabs.length);
  const stepWeight = 100 / steps.length;
  const progressPercent = Math.min(100, Math.round((stepIndex * stepWeight) + (((subIndex + 1) / subTotal) * stepWeight)));

  const handleNavClick = (id) => {
    setStep(id);
    setMobileMenuOpen(false);
  };

  return (
    <header 
      id="main-navigation"
      role="banner"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1200,
        background: 'var(--bg-card)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-architectural)',
        transition: 'all 0.28s var(--ease-luxury)'
      }}
    >
      
      {/* Tier 1: Stately Brand & Airy Section Navigation */}
      <div style={{
        maxWidth: '1360px',
        margin: '0 auto',
        padding: '10px clamp(12px, 3vw, 24px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'clamp(8px, 2vw, 24px)'
      }}>
        
        {/* Brand Crest & Title */}
        <div 
          role="button"
          tabIndex={0}
          aria-label="Return to Portal Home"
          onClick={() => setStep('welcome')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setStep('welcome'); } }}
          style={{ 
            cursor: 'pointer',
            userSelect: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexShrink: 0
          }}
        >
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 7,
            background: 'linear-gradient(135deg, var(--maison-pine-deep), var(--maison-obsidian))',
            border: '1px solid var(--maison-gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-xs)',
            flexShrink: 0
          }}>
            <Landmark size={16} color="var(--maison-gold)" />
          </div>
          <div>
            <div style={{ 
              fontFamily: 'var(--font-serif)', 
              fontStyle: 'italic', 
              fontWeight: 700, 
              fontSize: 'clamp(1.05rem, 2.5vw, 1.25rem)', 
              color: 'var(--text-primary)', 
              letterSpacing: '-0.02em',
              lineHeight: '1.1'
            }}>
              Ilyes H.
            </div>
            <div style={{ 
              fontSize: '0.58rem', 
              color: 'var(--maison-gold)', 
              letterSpacing: '0.12em', 
              fontWeight: 700, 
              textTransform: 'uppercase' 
            }}>
              Private Wealth
            </div>
          </div>
        </div>

        {/* Center Minimalist Step Navigation (Airy & Clean) */}
        <nav 
          className="desktop-nav"
          aria-label="Financial planning sections"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(12px, 2vw, 24px)'
          }}
        >
          {steps.map((step) => {
            const isActive = currentStep === step.id;
            return (
              <button
                key={step.id}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => handleNavClick(step.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: isActive ? '700' : '500',
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  padding: '8px 4px 12px 4px',
                  position: 'relative',
                  transition: 'color 0.2s var(--ease-luxury), transform 0.15s var(--ease-luxury)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap',
                  minWidth: '80px'
                }}
              >
                <span>{step.label}</span>
                {isActive && (
                  <span className="nav-indicator" style={{
                    position: 'absolute',
                    bottom: '0',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '24px',
                    height: '2.5px',
                    borderRadius: '2px',
                    background: 'linear-gradient(90deg, var(--maison-gold), var(--maison-gold-border))',
                    boxShadow: '0 0 8px var(--maison-gold-subtle)'
                  }} />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Status Indicator & Global Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <AuthNavControls />
          
          {/* GDPR Privacy Modal Trigger */}
          {onOpenGDPR && (
            <button
              type="button"
              aria-label="Open GDPR Data Privacy Controls"
              onClick={onOpenGDPR}
              style={{
                background: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-architectural)',
                color: 'var(--text-primary)',
                padding: '6px 10px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.74rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.2s ease'
              }}
            >
              <ShieldCheck size={13} color="var(--maison-gold)" />
              <span className="hide-on-mobile">DSGVO</span>
            </button>
          )}

          {/* Theme Toggle (Dark/Light) */}
          <button
            type="button"
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
            aria-pressed={isDark}
            onClick={() => {
              const next = isDark ? 'light' : 'dark';
              document.documentElement.setAttribute('data-theme', next);
              localStorage.setItem('theme', next);
              setIsDark(next === 'dark');
            }}
            style={{
              background: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-architectural)',
              color: 'var(--text-primary)',
              padding: '6px 10px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.74rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.2s ease'
            }}
          >
            {isDark ? <Sun size={13} color="var(--maison-gold)" /> : <Moon size={13} color="var(--maison-gold)" />}
            <span className="hide-on-mobile">Theme</span>
          </button>

          {onRefreshAnalysis && (
            <button
              type="button"
              aria-label="Recalculate financial analysis"
              onClick={onRefreshAnalysis}
              disabled={analysisStatus === 'loading'}
              style={{
                background: analysisStatus === 'stale' ? 'var(--maison-gold-subtle)' : 'var(--bg-card-subtle)',
                border: '1px solid var(--border-architectural)', color: 'var(--text-primary)',
                padding: '6px 10px', borderRadius: '8px', cursor: analysisStatus === 'loading' ? 'wait' : 'pointer',
                fontSize: '0.74rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px', opacity: analysisStatus === 'loading' ? 0.65 : 1,
              }}
            >
              <RefreshCw size={13} color="var(--maison-gold)" />
              <span className="hide-on-mobile">{analysisStatus === 'loading' ? 'Updating' : 'Refresh'}</span>
            </button>
          )}

          <span className="hide-on-mobile nav-progress" style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            color: 'var(--text-secondary)',
            letterSpacing: '0.04em',
            fontFamily: 'var(--font-mono)'
          }}>
            {progressPercent}%
          </span>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className="mobile-nav-btn"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(prev => !prev)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              padding: '4px',
              marginLeft: '8px'
            }}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

      </div>

      {/* Whisper-Thin Progress Hairline */}
      <div style={{ width: '100%', height: '2px', background: 'var(--border-architectural)' }}>
        <div 
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          className="progress-animated"
          style={{ 
            height: '100%', 
            width: `${progressPercent}%`, 
            background: 'linear-gradient(90deg, var(--maison-obsidian), var(--maison-gold))', 
            transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)' 
          }} 
        />
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div style={{
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border-architectural)',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {steps.map((step) => {
            const isActive = currentStep === step.id;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => handleNavClick(step.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: isActive ? '1px solid var(--maison-gold)' : 'none',
                  background: isActive ? 'var(--maison-obsidian)' : 'transparent',
                  color: isActive ? 'var(--maison-gold)' : 'var(--text-primary)',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <span>{step.label}</span>
                {isActive && <ChevronRight size={14} color="var(--maison-gold)" />}
              </button>
            );
          })}
          {onOpenAdvisor && (
            <button
              type="button"
              onClick={() => { onOpenAdvisor(); setMobileMenuOpen(false); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                marginTop: '8px',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1px solid var(--maison-gold-border)',
                background: 'var(--maison-gold-subtle)',
                color: 'var(--text-primary)',
                fontWeight: 800,
                fontSize: '0.84rem',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><Bot size={16} color="var(--maison-gold)" /> Open AI Concierge</span>
              <ChevronRight size={14} color="var(--maison-gold)" />
            </button>
          )}
          {onRefreshAnalysis && (
            <button type="button" onClick={() => { onRefreshAnalysis(); setMobileMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-architectural)', background: 'var(--bg-card-subtle)', color: 'var(--text-primary)', fontWeight: 800, fontSize: '0.84rem', cursor: 'pointer' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><RefreshCw size={16} color="var(--maison-gold)" /> Refresh financial analysis</span>
              <ChevronRight size={14} color="var(--maison-gold)" />
            </button>
          )}
        </div>
      )}

    </header>
  );
}
