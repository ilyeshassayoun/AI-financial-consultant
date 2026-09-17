import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Download, Copy, Check, X, CheckCircle2, Lock } from 'lucide-react';
import { generateAuditDossier, downloadDossierFile } from '../services/cryptoAudit';
import FocusTrap from './FocusTrap';

export default function AuditDossierModal({ isOpen, onClose, profile, analysis }) {
  const requestKey = isOpen ? JSON.stringify({ profile, analysis }) : '';
  const [generation, setGeneration] = useState({ key: '', dossier: null, failed: false });
  const [copied, setCopied] = useState(false);
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    generateAuditDossier(profile, analysis)
      .then((generated) => {
        if (isMounted) {
          setGeneration({ key: requestKey, dossier: generated, failed: false });
        }
      })
      .catch((err) => {
        console.error('[AuditDossier] Checksum generation failed:', err);
        if (isMounted) setGeneration({ key: requestKey, dossier: null, failed: true });
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, profile, analysis, requestKey]);

  if (!isOpen) return null;

  const dossier = generation.key === requestKey ? generation.dossier : null;
  const loading = generation.key !== requestKey;
  const checksum = dossier?.integrity_check?.checksum || '...';

  const handleCopyChecksum = () => {
    if (!checksum) return;
    navigator.clipboard?.writeText(checksum);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (dossier) downloadDossierFile(dossier);
  };

  const money = (v) => '€' + (Number(v) || 0).toLocaleString('de-DE');
  const pct = (v) => ((Number(v) || 0) * 100).toFixed(1) + '%';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(8, 15, 26, 0.72)',
        backdropFilter: 'blur(8px)',
        display: 'grid',
        placeItems: 'center',
        padding: 'clamp(12px, 3vw, 24px)',
        overflowY: 'auto'
      }}
    >
      <FocusTrap isActive={isOpen} containerRef={dialogRef} onEscape={onClose} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="audit-dossier-title"
        style={{
          width: 'min(760px, 100%)',
          maxHeight: '90vh',
          background: 'var(--bg-card, #ffffff)',
          border: '1px solid var(--border-architectural, #d8dee8)',
          borderTop: '4px solid var(--maison-gold, #c5a059)',
          borderRadius: '16px',
          boxShadow: '0 24px 60px rgba(8, 15, 26, 0.28)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out'
        }}
      >
        {/* Header */}
        <header
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-architectural, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-card-subtle, #f8fafc)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10223d, #1a365d)',
                border: '1px solid var(--maison-gold, #c5a059)',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--maison-gold, #c5a059)'
              }}
            >
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2
                id="audit-dossier-title"
                style={{
                  margin: 0,
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-serif, Georgia, serif)',
                  color: 'var(--text-primary, #0f172a)'
                }}
              >
                Calculation record &amp; integrity check
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-secondary, #64748b)' }}>
                Export the recorded inputs and model outputs with a SHA-256 fingerprint
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary, #64748b)',
              padding: '6px',
              borderRadius: '8px',
              display: 'grid',
              placeItems: 'center'
            }}
          >
            <X size={20} />
          </button>
        </header>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Checksum Badge Box */}
          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              background: 'var(--maison-obsidian, #0a121e)',
              border: '1px solid rgba(197, 160, 89, 0.35)',
              color: '#ffffff'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--maison-gold, #c5a059)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={13} />
                SHA-256 Calculation Checksum (RFC 8785)
              </span>
              <span
                style={{
                  fontSize: '0.68rem',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: 'rgba(5, 150, 105, 0.25)',
                  border: '1px solid #059669',
                  color: '#34d399',
                  fontWeight: 700
                }}
              >
                SNAPSHOT INTEGRITY
              </span>
            </div>
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: '0.84rem',
                wordBreak: 'break-all',
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <code data-testid="dossier-checksum" style={{ color: '#f8fafc' }}>{checksum}</code>
              <button
                type="button"
                onClick={handleCopyChecksum}
                aria-label="Copy SHA-256 Checksum"
                style={{
                  background: 'rgba(197, 160, 89, 0.18)',
                  border: '1px solid var(--maison-gold, #c5a059)',
                  borderRadius: '6px',
                  color: 'var(--maison-gold, #c5a059)',
                  padding: '6px 10px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  flexShrink: 0
                }}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div style={{ marginTop: '8px', fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.6)', display: 'flex', gap: '16px' }}>
              <span>Dossier ID: {dossier?.dossier_id || 'Generating...'}</span>
              <span>Engine: {dossier?.engine_version || 'v2026.1'}</span>
            </div>
          </div>

          {/* Statutory Standards Compliance */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '10px',
              background: 'var(--bg-card-subtle, #f8fafc)',
              border: '1px solid var(--border-architectural, #e2e8f0)'
            }}
          >
            <h4 style={{ margin: '0 0 10px', fontSize: '0.84rem', color: 'var(--text-primary, #0f172a)', fontWeight: 700 }}>
              Model references &amp; planning basis
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '8px' }}>
              {(dossier?.planning_references || []).map((std, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.76rem', color: 'var(--text-secondary, #475569)' }}>
                  <CheckCircle2 size={14} color="#059669" />
                  <span>{std}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Verified Snapshot Data Overview */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div
              style={{
                padding: '14px',
                borderRadius: '10px',
                border: '1px solid var(--border-architectural, #e2e8f0)',
                background: 'var(--bg-card, #ffffff)'
              }}
            >
              <h5 style={{ margin: '0 0 10px', fontSize: '0.8rem', color: 'var(--maison-gold, #c5a059)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Household inputs recorded
              </h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary, #64748b)' }}>Gross Annual Income:</span>
                  <strong>{money(dossier?.recorded_profile_inputs?.income)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary, #64748b)' }}>Age / Target Retirement:</span>
                  <strong>{dossier?.recorded_profile_inputs?.age ?? 30} / {dossier?.recorded_profile_inputs?.retirement_age ?? 67}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary, #64748b)' }}>Tax Class & Status:</span>
                  <strong>Class {dossier?.recorded_profile_inputs?.tax_class ?? 1} {dossier?.recorded_profile_inputs?.is_married ? '(Married)' : '(Single)'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary, #64748b)' }}>Monthly Savings / SWR:</span>
                  <strong>{money(dossier?.recorded_profile_inputs?.monthly_investment)} / mo · {pct(dossier?.recorded_profile_inputs?.safe_withdrawal_rate)}</strong>
                </div>
              </div>
            </div>

            <div
              style={{
                padding: '14px',
                borderRadius: '10px',
                border: '1px solid var(--border-architectural, #e2e8f0)',
                background: 'var(--bg-card, #ffffff)'
              }}
            >
              <h5 style={{ margin: '0 0 10px', fontSize: '0.8rem', color: 'var(--maison-pine-deep, #173d29)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Model outputs recorded
              </h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary, #64748b)' }}>Effective Tax Rate:</span>
                  <strong>{pct(dossier?.model_outputs?.effective_rate)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary, #64748b)' }}>Net Take-Home Income:</span>
                  <strong>{money(dossier?.model_outputs?.net_income)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary, #64748b)' }}>Monthly Rentenlücke (Net Gap):</span>
                  <strong style={{ color: '#b85d52' }}>{money(dossier?.model_outputs?.pension_gap_monthly)} / mo</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary, #64748b)' }}>Capital P50 / Resilience Score:</span>
                  <strong>{money(dossier?.model_outputs?.terminal_wealth_p50)} · {dossier?.model_outputs?.financial_resilience_score ?? 75}/100</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <footer
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-architectural, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-card-subtle, #f8fafc)'
          }}
        >
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary, #64748b)' }}>
            Integrity fingerprint only · no independent audit or certification
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: '1px solid var(--border-architectural, #d8dee8)',
                background: '#ffffff',
                color: 'var(--text-primary, #0f172a)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={loading || !dossier}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: '1px solid var(--maison-gold, #c5a059)',
                background: 'var(--maison-obsidian, #10223d)',
                color: '#ffffff',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(16, 34, 61, 0.2)'
              }}
            >
              <Download size={15} color="var(--maison-gold, #c5a059)" />
              <span>Download calculation snapshot (JSON)</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
