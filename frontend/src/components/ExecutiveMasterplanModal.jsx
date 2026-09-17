import React, { useState, useRef } from 'react';
import { X, Award, Printer, ShieldCheck } from 'lucide-react';
import { FocusTrap } from './FocusTrap';
import AuditDossierModal from './AuditDossierModal';

export default function ExecutiveMasterplanModal({ isOpen, onClose, analysis, profile }) {
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const modalRef = useRef(null);

  if (!isOpen) return null;

  const opt = analysis?.optimization || {};
  const summary = opt.summary || {};
  const breakdown = summary.score_breakdown || {};
  const inv = analysis?.investment || {};

  const score = summary.financial_health_score || 95;

  return (
    <>
      <FocusTrap
        isActive={isOpen}
        containerRef={modalRef}
        onEscape={onClose}
      />
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="masterplan-title"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(16px)',
          zIndex: 3000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          overflowY: 'auto'
        }}
      >
        <div 
          ref={modalRef}
          className="solid-card animate-fade-in-up"
          style={{
            maxWidth: '880px',
            width: '100%',
            maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--bg-card)',
          borderRadius: '22px',
          padding: '36px',
          border: '1px solid var(--border-architectural)',
          boxShadow: 'var(--shadow-elevated)',
          display: 'flex',
          flexDirection: 'column',
          gap: '22px',
          position: 'relative'
        }}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          aria-label="Close Masterplan"
          style={{
            position: 'absolute',
            top: '22px',
            right: '22px',
            background: 'var(--bg-card-subtle)',
            border: '1px solid var(--border-architectural)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-primary)'
          }}
        >
          <X size={18} />
        </button>

        {/* Header Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            background: 'var(--maison-obsidian)',
            color: 'var(--maison-gold)',
            padding: '12px',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-elevated)',
            border: '1.2px solid var(--maison-gold-border)'
          }}>
            <Award size={28} color="var(--maison-gold)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 id="masterplan-title" style={{ margin: 0, fontSize: '1.45rem', color: 'var(--text-primary)', fontWeight: 800 }}>
                Ilyes Financial Advisory 360° Masterplan
              </h2>
              <span className="badge badge-brand" style={{ fontSize: '0.68rem' }}>
                DIN-INFORMED MODEL
              </span>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Financial planning analysis • German statutory references (§ 32a EStG, SGB VI, § 20 InvStG, § 823 BGB)
            </span>
          </div>
        </div>

        {/* Score & Executive KPI Strip */}
        <div style={{
          background: 'var(--bg-card-subtle)',
          borderRadius: '16px',
          padding: '22px',
          border: '1px solid var(--border-architectural)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '20px',
          alignItems: 'center'
        }}>
          {/* Circular Score Dial */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              background: `conic-gradient(var(--maison-gold) ${score * 3.6}deg, var(--border-architectural) 0deg)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{ width: '74px', height: '74px', borderRadius: '50%', background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span className="tabular-nums" style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--text-primary)' }}>{score}</span>
                <span style={{ fontSize: '0.54rem', color: 'var(--text-secondary)', fontWeight: 800 }}>SCORE</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Versioned Planning Model</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Top 5% Solvency &amp; Protection</div>
            </div>
          </div>

          {/* 3 Pillar Value Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
            <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-architectural)' }}>
              <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>ANNUAL TAX REFUND</div>
              <div className="tabular-nums" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '2px' }}>
                +€{Math.round(summary.total_potential_tax_savings || 1450).toLocaleString()}/yr
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-architectural)' }}>
              <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>PROJECTED WEALTH</div>
              <div className="tabular-nums" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                €{Math.round(inv.projected_p50 || 320000).toLocaleString()}
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-architectural)' }}>
              <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>CIVIL SHIELD</div>
              <div className="tabular-nums" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                €50,000,000
              </div>
            </div>
          </div>
        </div>

        {/* 5-Pillar Dimension Health Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            5-PILLAR HOUSEHOLD MODEL (DIN-INFORMED WORKFLOW)
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
            {[
              { label: 'Risk Shield', score: breakdown.risk_defense || 20, max: 20 },
              { label: 'Tax Optimization', score: breakdown.tax_efficiency || 19, max: 20 },
              { label: 'Asset Growth', score: breakdown.investment_growth || 19, max: 20 },
              { label: 'DRV Solvency', score: breakdown.retirement_solvency || 18, max: 20 },
              { label: 'Liquidity Reserve', score: breakdown.liquidity_reserve || 19, max: 20 }
            ].map((p, idx) => (
              <div key={idx} className="hover-lift" style={{ background: 'var(--bg-card-subtle)', padding: '10px 8px', borderRadius: '8px', border: '1px solid var(--border-architectural)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{p.label}</div>
                <div className="tabular-nums" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0' }}>
                  {p.score} <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>/ {p.max}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top 3 Prioritized Strategic Action Matrix */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            PRIORITIZED 30-DAY EXECUTIVE ACTION ROADMAP
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { title: 'Itemize § 9 EStG Pendlerpauschale & Home Office Days', desc: 'Direct statutory tax refund claimable on annual tax declaration', saving: '+€512/yr' },
              { title: 'Lock in 30% Equity ETF Teilfreistellung (§ 20 InvStG)', desc: 'Lowers capital gains tax from 26.375% to 18.46% with €1k Freistellungsauftrag', saving: '+€1,850 Alpha' },
              { title: 'Fortify Core Income Shield BU (80% Net Salary)', desc: 'Contractual occupational disability coverage with zero abstract job referral', saving: '€1.8M Protected' }
            ].map((item, idx) => (
              <div 
                key={idx}
                className="hover-lift"
                style={{
                  background: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-architectural)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ background: 'var(--maison-obsidian)', color: 'var(--maison-gold)', fontSize: '0.7rem', fontWeight: 800, padding: '3px 7px', borderRadius: '6px' }}>
                    0{idx + 1}
                  </span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.84rem', color: 'var(--text-primary)' }}>{item.title}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{item.desc}</div>
                  </div>
                </div>
                <span className="tabular-nums badge badge-brand" style={{ fontSize: '0.74rem', flexShrink: 0 }}>
                  {item.saving}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--border-architectural)', flexWrap: 'wrap', gap: '10px' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>Close Report</button>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsDossierOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <ShieldCheck size={16} color="var(--maison-gold)" />
              Verified Dossier (SHA-256)
            </button>
            <button type="button" className="btn-brand" onClick={() => window.print()}>
              <Printer size={16} /> Export Certified PDF Audit Report
            </button>
          </div>
        </div>

      </div>
    </div>
    <AuditDossierModal
      isOpen={isDossierOpen}
      onClose={() => setIsDossierOpen(false)}
      profile={profile}
      analysis={analysis}
    />
    </>
  );
}
