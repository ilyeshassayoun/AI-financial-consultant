import React, { useState } from 'react';
import { Menu, X, ChevronRight, Landmark, ShieldCheck, Moon, Sun } from 'lucide-react';
import AuthNavControls from './AuthNavControls';

const SECTION_SUBSTEPS = {
  profile: [
    'Goals',
    'Timeline',
    'Cash Flow Details',
    'AI Cash Flow Verdict',
    'Holdings',
    'Health Audit'
  ],
  insurance: [
    'Risk Map',
    'Income Protection',
    'Healthcare Decision',
    'Property & Liability',
    'Stress Testing',
    'Protection Policy'
  ],
  tax: [
    'Readiness',
    'Liability Bridge',
    'Deduction Scenarios',
    'Household & Vorsorge',
    'Investment Tax',
    'Tax Memo'
  ],
  invest: [
    'Goal Optimizer',
    'Risk Capacity',
    'Strategy Match',
    'Outcome Testing',
    'Tax Alpha',
    'Implementation',
    'Policy Mandate'
  ],
  pension: [
    'Retirement Mandate',
    'Three Pillars',
    'DRV Record',
    'Retirement Timing',
    'Withdrawal Lab',
    'Funding Policy'
  ]
};

const steps = [
  { id: 'welcome', label: 'Portal' },
  { id: 'profile', label: 'Mandate & Cashflow' },
  { id: 'insurance', label: 'Risk Shield' },
  { id: 'tax', label: 'Tax Optimization' },
  { id: 'invest', label: 'Asset Allocation' },
  { id: 'pension', label: 'Solvency' },
];

export default function TopNav({ currentStep, setStep, currentSubStep = 0, onSubStepChange, onOpenGDPR }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '24px'
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
            gap: '12px'
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
            boxShadow: 'var(--shadow-xs)'
          }}>
            <Landmark size={16} color="var(--maison-gold)" />
          </div>
          <div>
            <div style={{ 
              fontFamily: 'var(--font-serif)', 
              fontStyle: 'italic', 
              fontWeight: 700, 
              fontSize: '1.25rem', 
              color: 'var(--text-primary)', 
              letterSpacing: '-0.02em',
              lineHeight: '1.1'
            }}>
              Ilyes H.
            </div>
            <div style={{ 
              fontSize: '0.6rem', 
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
          role="tablist"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px'
          }}
        >
          {steps.map((step) => {
            const isActive = currentStep === step.id;
            return (
              <button
                key={step.id}
                role="tab"
                aria-selected={isActive}
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
                  minWidth: '90px'
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                padding: '6px 11px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.2s ease'
              }}
            >
              <ShieldCheck size={13} color="var(--maison-gold)" />
              <span>DSGVO</span>
            </button>
          )}

          {/* Theme Toggle (Dark/Light) */}
          <button
            type="button"
            aria-label="Toggle Obsidian Dark / Light Theme"
            onClick={() => {
              const current = document.documentElement.getAttribute('data-theme');
              const next = current === 'dark' ? 'light' : 'dark';
              document.documentElement.setAttribute('data-theme', next);
              localStorage.setItem('theme', next);
            }}
            style={{
              background: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-architectural)',
              color: 'var(--text-primary)',
              padding: '6px 11px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.2s ease'
            }}
          >
            <Moon size={13} color="var(--maison-gold)" />
            <span>Theme</span>
          </button>

          <span style={{
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
              display: 'none',
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
        </div>
      )}

    </header>
  );
}
