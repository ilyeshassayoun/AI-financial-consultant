import React from 'react';
import { ShieldCheck, TrendingUp } from 'lucide-react';

export default function HumanCapitalMeter({ income, age, retirementAge, isBUCovered, onToggleBU }) {
  const yearsRemaining = Math.max(1, retirementAge - age);
  const lifetimeGrossCapital = income * yearsRemaining;
  const lifetimeNetCapital = Math.round(lifetimeGrossCapital * 0.65);
  const monthlyNet = Math.round((income * 0.60) / 12);
  const targetBUMonthly = Math.round(monthlyNet * 0.80);

  return (
    <div className="solid-card animate-fade-in-up" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={22} color="var(--maison-gold)" />
            <h4 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)', fontWeight: 800 }}>
              Human Capital Valuation &amp; Income Defense Matrix
            </h4>
          </div>
          <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Actuarial present value of your remaining {yearsRemaining} earning years until age {retirementAge}.
          </p>
        </div>

        <span className={`badge ${isBUCovered ? 'badge-brand' : 'badge-secondary'}`} style={{ fontSize: '0.78rem' }}>
          {isBUCovered ? 'Human Capital 100% Shielded' : 'Unprotected Human Capital Exposure'}
        </span>
      </div>

      {/* Asset Valuation Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div style={{ background: 'var(--bg-card-subtle)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-architectural)' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase' }}>CAPITALIZED LIFETIME ASSET</span>
          <div className="tabular-nums" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
            €{lifetimeNetCapital.toLocaleString()}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Net earning power to age {retirementAge}</span>
        </div>

        <div style={{ background: 'var(--bg-card-subtle)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-architectural)' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent-coral)', textTransform: 'uppercase' }}>STATUTORY STATE DISABILITY</span>
          <div className="tabular-nums" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-coral)', marginTop: '2px' }}>
            &lt; €550 / mo
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>SGB VI Erwerbsminderung</span>
        </div>

        <div style={{ background: 'var(--bg-card-subtle)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-architectural)' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase' }}>RECOMMENDED BU ANNUITY</span>
          <div className="tabular-nums" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
            €{targetBUMonthly.toLocaleString()} / mo
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>80% Net income protection</span>
        </div>
      </div>

      {/* Progress Track & Action */}
      <div style={{ background: 'var(--bg-card-subtle)', padding: '14px 18px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', border: '1px solid var(--border-architectural)' }}>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
          {isBUCovered ? (
            <span>✓ Your €{lifetimeNetCapital.toLocaleString()} human capital is shielded against occupational disability.</span>
          ) : (
            <span>⚠️ Without BU coverage, a sudden disability results in a <strong style={{ color: 'var(--accent-coral)' }}>90% drop in monthly income</strong>.</span>
          )}
        </div>

        {onToggleBU && (
          <button
            type="button"
            onClick={onToggleBU}
            className={isBUCovered ? 'btn-secondary' : 'btn-brand'}
            style={{ fontSize: '0.75rem', padding: '7px 16px' }}
          >
            <ShieldCheck size={14} />
            {isBUCovered ? 'Policy Active in Audit' : 'Activate 80% BU Protection Shield'}
          </button>
        )}
      </div>

    </div>
  );
}
