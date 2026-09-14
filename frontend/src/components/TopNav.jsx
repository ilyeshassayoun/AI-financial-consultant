import React, { useState } from 'react';
import { Menu, X, ChevronRight, ShieldCheck, Bot, FileCheck } from 'lucide-react';
import AuthNavControls from './AuthNavControls';
import { steps } from './TopNav.constants';

export default function TopNav({ currentStep, setStep, onOpenGDPR, onOpenAdvisor, onOpenAuditDossier }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          <div aria-hidden="true" style={{
            position: 'relative',
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'linear-gradient(145deg, var(--maison-obsidian), var(--maison-pine-deep))',
            border: '1px solid var(--maison-gold)',
            display: 'grid',
            placeItems: 'center',
            boxShadow: '0 6px 18px rgba(8, 15, 26, .16)',
            flexShrink: 0,
            overflow: 'hidden'
          }}>
            <span style={{ color: 'var(--maison-gold)', fontFamily: 'var(--font-serif)', fontSize: '.9rem', fontWeight: 800, letterSpacing: '-.06em' }}>IH</span>
            <span style={{ position: 'absolute', right: 5, bottom: 5, width: 9, height: 1, background: 'var(--maison-gold)' }} />
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
              Ilyes H
            </div>
            <div style={{ 
              fontSize: '0.58rem', 
              color: 'var(--maison-gold)', 
              letterSpacing: '0.12em', 
              fontWeight: 700, 
              textTransform: 'uppercase' 
            }}>
              Financial Advisory
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
          
          {/* Cryptographic Audit Dossier Trigger */}
          {onOpenAuditDossier && (
            <button
              type="button"
              aria-label="Open Cryptographic Audit Dossier"
              onClick={onOpenAuditDossier}
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
              <FileCheck size={13} color="var(--maison-gold)" />
              <span className="hide-on-mobile">Audit Dossier</span>
            </button>
          )}

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
        </div>
      )}

    </header>
  );
}
