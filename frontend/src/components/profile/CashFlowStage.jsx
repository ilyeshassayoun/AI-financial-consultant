import React from 'react';
import { DollarSign, Brain } from 'lucide-react';
import InteractiveCashFlow from '../InteractiveCashFlow';

export default function CashFlowStage({ profile = {}, updateProfile, analysis, subStep = 2 }) {
  const safeProfile = profile || {};

  if (subStep === 3) {
    // SUBSTEP 3: Unified AI Cash Flow Verdict & Multiplier
    return (
      <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div className="stage-intro-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'var(--maison-gold-subtle)', padding: '10px', borderRadius: '10px', color: 'var(--text-primary)' }}>
            <Brain size={24} strokeWidth={1.5} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>AI Cash Flow &amp; Solvency Verdict</h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>Unified 50/30/20 liquidity allocation benchmark, surplus compounding, and actuarial solvency grade.</p>
          </div>
        </div>

        <InteractiveCashFlow 
          profile={profile} 
          updateProfile={updateProfile} 
          analysis={analysis} 
          mode="output"
        />
      </div>
    );
  }

  // SUBSTEP 2: Cash Flow Details (Input & Typing)
  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="stage-intro-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'var(--maison-gold-subtle)', padding: '10px', borderRadius: '10px', color: 'var(--text-primary)' }}>
            <DollarSign size={24} strokeWidth={1.5} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>Income &amp; Monthly Expense Details</h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>Type your exact monthly income and expenses.</p>
          </div>
        </div>
      </div>

      {/* Income Slider & Tax Class Grid */}
      <div className="profile-cashflow-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        <div style={{ background: 'var(--bg-card-subtle)', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-architectural)' }}>
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>Annual Gross Salary</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-card)', padding: '4px 10px', borderRadius: '8px', border: '1px solid var(--border-architectural)' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>€</span>
              <input 
                type="number"
                value={safeProfile.income ?? 60000}
                onChange={e => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && val >= 0) updateProfile({ income: val });
                }}
                style={{ width: '80px', border: 'none', background: 'transparent', fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)', outline: 'none', textAlign: 'right' }}
              />
            </div>
          </label>
          <input 
            type="range" 
            min="20000" 
            max="250000" 
            step="2500" 
            value={safeProfile.income ?? 60000}
            onChange={e => updateProfile({ income: parseFloat(e.target.value) })} 
            style={{ width: '100%' }} 
          />
        </div>

        <div style={{ background: 'var(--bg-card-subtle)', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-architectural)' }}>
          <label style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: '8px', display: 'block', color: 'var(--text-primary)' }}>
            Tax Bracket (Steuerklasse)
          </label>
          <div className="profile-tax-class-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
            {[1, 2, 3, 4, 5, 6].map((cls) => {
              const isSel = (safeProfile.tax_class ?? 1) === cls;
              return (
                <button
                  key={cls}
                  type="button"
                  onClick={() => updateProfile({ tax_class: cls })}
                  style={{
                    padding: '8px 4px',
                    borderRadius: '8px',
                    border: isSel ? '1.5px solid var(--maison-gold)' : '1px solid var(--border-architectural)',
                    background: isSel ? 'var(--maison-obsidian)' : 'var(--bg-card)',
                    color: isSel ? '#ffffff' : 'var(--text-primary)',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  {cls}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Typable Expense Categories via Input Mode */}
      <InteractiveCashFlow 
        profile={profile} 
        updateProfile={updateProfile} 
        analysis={analysis} 
        mode="input"
      />

      <section aria-labelledby="foundation-title" style={{ background: 'var(--bg-card-subtle)', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-architectural)' }}>
        <div style={{ marginBottom: '12px' }}>
          <h4 id="foundation-title" style={{ margin: 0, color: 'var(--text-primary)' }}>Balance-sheet &amp; protection foundation</h4>
          <p style={{ margin: '3px 0 0', fontSize: '.76rem', color: 'var(--text-secondary)' }}>These facts determine whether debt reduction, reserves, protection, or investing should come first.</p>
        </div>
        <div className="financial-foundation-grid">
          {[
            ['Liquid savings', 'liquid_savings', 1, '€'],
            ['Unsecured debt', 'unsecured_debt', 1, '€'],
            ['Debt interest rate', 'unsecured_debt_rate', .1, '%'],
            ['Monthly debt payment', 'monthly_debt_payment', 1, '€'],
            ['Existing BU benefit', 'bu_monthly_benefit', 1, '€/mo']
          ].map(([label, key, step, suffix]) => (
            <label key={key} style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              {label}
              <div className="foundation-input">
                <input 
                  aria-label={label} 
                  type="number" 
                  min="0" 
                  step={step} 
                  value={key === 'unsecured_debt_rate' ? (safeProfile[key] || 0) * 100 : safeProfile[key] || 0} 
                  onChange={e => updateProfile({ [key]: key === 'unsecured_debt_rate' ? Number(e.target.value) / 100 : Number(e.target.value) })} 
                />
                <span>{suffix}</span>
              </div>
            </label>
          ))}
          <label style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            Income stability
            <select aria-label="Income stability" value={safeProfile.employment_stability || 'stable'} onChange={e => updateProfile({ employment_stability: e.target.value })}>
              <option value="stable">Stable employment</option>
              <option value="variable">Variable / self-employed</option>
            </select>
          </label>
        </div>
      </section>
    </div>
  );
}
