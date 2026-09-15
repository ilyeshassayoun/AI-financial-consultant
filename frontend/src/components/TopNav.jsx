import React, { useState } from 'react';
import { Bot, ChevronRight, FileCheck, Menu, ShieldCheck, X } from 'lucide-react';
import AuthNavControls from './AuthNavControls';
import { steps } from './TopNav.constants';
import './TopNav.css';

const SHORT_LABELS = {
  welcome: 'Overview',
  profile: 'Plan',
  insurance: 'Protection',
  tax: 'Tax',
  invest: 'Investments',
  pension: 'Retirement',
};

export default function TopNav({ currentStep, setStep, onOpenGDPR, onOpenAdvisor, onOpenAuditDossier }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (id) => {
    setStep(id);
    setMobileMenuOpen(false);
  };

  return (
    <header id="main-navigation" className="portal-nav" role="banner">
      <div className="portal-nav__bar">
        <button
          type="button"
          className="portal-brand"
          aria-label="Return to Portal Home"
          onClick={() => handleNavClick('welcome')}
        >
          <span className="portal-brand__mark" aria-hidden="true">IH</span>
          <span className="portal-brand__copy">
            <strong>Ilyes H</strong>
            <span>Financial Advisory</span>
          </span>
        </button>

        <nav className="desktop-nav portal-nav__sections" aria-label="Financial planning sections">
          {steps.map((step) => {
            const isActive = currentStep === step.id;
            return (
              <button
                type="button"
                key={step.id}
                aria-label={step.label}
                aria-current={isActive ? 'page' : undefined}
                className={isActive ? 'portal-nav__section is-active' : 'portal-nav__section'}
                onClick={() => handleNavClick(step.id)}
              >
                {SHORT_LABELS[step.id] || step.label}
              </button>
            );
          })}
        </nav>

        <div className="portal-nav__actions">
          <AuthNavControls />

          {onOpenAuditDossier && (
            <button
              type="button"
              className="portal-nav__utility"
              aria-label="Open Cryptographic Audit Dossier"
              onClick={onOpenAuditDossier}
            >
              <FileCheck aria-hidden="true" />
              <span className="hide-on-mobile">Audit</span>
            </button>
          )}

          {onOpenGDPR && (
            <button
              type="button"
              className="portal-nav__utility"
              aria-label="Open GDPR Data Privacy Controls"
              onClick={onOpenGDPR}
            >
              <ShieldCheck aria-hidden="true" />
              <span className="hide-on-mobile">DSGVO</span>
            </button>
          )}

          <button
            type="button"
            className="mobile-nav-btn portal-nav__menu"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            {mobileMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav className="portal-nav__drawer" aria-label="Mobile financial planning sections">
          {steps.map((step) => {
            const isActive = currentStep === step.id;
            return (
              <button
                type="button"
                key={step.id}
                aria-label={step.label}
                aria-current={isActive ? 'page' : undefined}
                className={isActive ? 'is-active' : undefined}
                onClick={() => handleNavClick(step.id)}
              >
                <span>{SHORT_LABELS[step.id] || step.label}</span>
                <ChevronRight aria-hidden="true" />
              </button>
            );
          })}

          {onOpenAdvisor && (
            <button
              type="button"
              className="portal-nav__advisor"
              onClick={() => {
                onOpenAdvisor();
                setMobileMenuOpen(false);
              }}
            >
              <span><Bot aria-hidden="true" /> Open AI Concierge</span>
              <ChevronRight aria-hidden="true" />
            </button>
          )}
        </nav>
      )}
    </header>
  );
}
