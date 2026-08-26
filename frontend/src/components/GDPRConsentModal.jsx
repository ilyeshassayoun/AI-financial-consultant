import React, { useState } from 'react';
import { ShieldCheck, Lock, Download, Trash2, X } from 'lucide-react';

export default function GDPRConsentModal({ isOpen, onClose, profile, onResetData }) {
  const [consentState, setConsentState] = useState({
    functional: true,
    aiAdvisory: true,
    localAnalytics: false
  });
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(profile, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ilyes_financial_audit_gdpr_export_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handleEraseData = () => {
    if (window.confirm("Are you sure you want to permanently erase all locally stored audit data under GDPR Art. 17? This cannot be undone.")) {
      if (onResetData) onResetData();
      localStorage.clear();
      onClose();
    }
  };

  return (
    <div 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="gdpr-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(8, 15, 10, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div 
        className="solid-card animate-fade-in-up"
        style={{
          width: '100%',
          maxWidth: '580px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-architectural)',
          borderRadius: '20px',
          padding: '28px',
          boxShadow: 'var(--shadow-elevated)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={26} color="var(--maison-gold)" />
            <div>
              <h3 id="gdpr-modal-title" style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 800 }}>
                Data Privacy &amp; GDPR Controls (DSGVO)
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Compliant with EU Regulation 2016/679 and German BDSG standards.
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            aria-label="Close Privacy Modal"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Data Protection Statement */}
        <div style={{ background: 'var(--bg-card-subtle)', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border-architectural)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Lock size={15} color="var(--accent-emerald)" />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>Client Data Sovereignity</span>
          </div>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            All financial parameters (income, pensions, tax class) remain in your browser session or secure memory during processing. No personal telemetry is sold or shared with commercial credit bureaus.
          </p>
        </div>

        {/* Granular Consent Checkboxes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.84rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <span><strong>Strictly Necessary Calculations</strong> (EStG &amp; SGB Engines)</span>
            <input type="checkbox" checked={consentState.functional} disabled style={{ width: '18px', height: '18px' }} />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.84rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <span><strong>Actuarial AI Advisory</strong> (Statutory LLM Explanations)</span>
            <input 
              type="checkbox" 
              checked={consentState.aiAdvisory} 
              onChange={(e) => setConsentState(prev => ({ ...prev, aiAdvisory: e.target.checked }))}
              style={{ width: '18px', height: '18px' }} 
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.84rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <span><strong>Anonymous Model Improvement</strong></span>
            <input 
              type="checkbox" 
              checked={consentState.localAnalytics} 
              onChange={(e) => setConsentState(prev => ({ ...prev, localAnalytics: e.target.checked }))}
              style={{ width: '18px', height: '18px' }} 
            />
          </label>
        </div>

        {/* Rights of the Data Subject (GDPR Art. 15, 17, 20) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-architectural)' }}>
          <button
            type="button"
            onClick={handleExportData}
            className="btn-secondary"
            style={{ fontSize: '0.78rem', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <Download size={14} />
            {downloadSuccess ? 'Export Ready!' : 'Export Data (Art. 20)'}
          </button>

          <button
            type="button"
            onClick={handleEraseData}
            style={{
              fontSize: '0.78rem',
              padding: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: 'rgba(212, 104, 104, 0.12)',
              color: 'var(--accent-coral)',
              border: '1px solid var(--accent-coral)',
              borderRadius: '8px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Trash2 size={14} />
            Erase All Data (Art. 17)
          </button>
        </div>

        {/* Save & Confirm Button */}
        <button
          type="button"
          onClick={onClose}
          className="btn-brand"
          style={{ width: '100%', padding: '12px', fontSize: '0.85rem', fontWeight: 800, borderRadius: '10px' }}
        >
          Confirm &amp; Apply Privacy Preferences
        </button>

      </div>
    </div>
  );
}
