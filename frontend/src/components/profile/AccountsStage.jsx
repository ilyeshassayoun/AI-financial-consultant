import React from 'react';
import { 
  ShieldCheck, Shield, Activity, Briefcase, Key, 
  TrendingUp, Wallet, Layers, Building2, PieChart as PieIcon, Check 
} from 'lucide-react';

export const INSURANCE_HOLDINGS = [
  { id: 'Liability', label: 'Personal Liability', statute: 'Full Civil Protection', icon: ShieldCheck },
  { id: 'BU', label: 'Income & Disability (BU)', statute: '80% Net Salary Shield', icon: Shield },
  { id: 'PKV', label: 'Private Health (PKV)', statute: 'Executive Care', icon: Activity },
  { id: 'Legal', label: 'Legal Protection', statute: 'Work & Tenancy', icon: Briefcase },
  { id: 'Contents', label: 'Home Contents & Cyber', statute: 'Valuables & Fraud Cover', icon: Key }
];

export const ASSET_HOLDINGS = [
  { id: 'etf', label: 'Global ETF Portfolio', desc: 'Low-cost core equities', icon: TrendingUp },
  { id: 'emergency_fund', label: 'Cash Emergency Fund', desc: '3-6 months liquidity reserve', icon: Wallet },
  { id: 'bav', label: 'Company Pension (bAV)', desc: 'Employer subsidized pension', icon: Layers },
  { id: 'real_estate', label: 'Real Estate Property', desc: 'Home equity & real assets', icon: Building2 },
  { id: 'active_funds', label: 'Bank Mutual Funds', desc: 'Active funds (1.8%+ fees)', icon: PieIcon }
];

export default function AccountsStage({ 
  existingInsurances = [], 
  existingAssets = [], 
  onToggleInsurance, 
  onToggleAsset 
}) {
  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="stage-intro-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'var(--maison-gold-subtle)', padding: '10px', borderRadius: '10px', color: 'var(--text-primary)' }}>
            <ShieldCheck size={24} strokeWidth={1.5} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>Select What You Already Own</h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>Check your existing insurance policies and investment accounts.</p>
          </div>
        </div>
        <span className="badge badge-brand" style={{ fontSize: '0.74rem', padding: '4px 10px' }}>
          {existingInsurances.length} Insurance / {existingAssets.length} Assets Active
        </span>
      </div>

      {/* Side-by-Side Responsive Holdings Grid */}
      <div className="profile-holdings-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {/* Left Column: Insurance Policies */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>
            1. RISK &amp; DEFENSE POLICIES
          </span>
          {INSURANCE_HOLDINGS.map((ins) => {
            const Icon = ins.icon;
            const isChecked = existingInsurances.includes(ins.id);
            return (
              <button
                key={ins.id}
                type="button"
                onClick={() => onToggleInsurance(ins.id)}
                className="hover-lift"
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: isChecked ? '1.5px solid var(--maison-gold)' : '1px solid var(--border-architectural)',
                  background: isChecked ? 'var(--maison-gold-subtle)' : 'var(--bg-card)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    background: isChecked ? 'var(--maison-obsidian)' : 'var(--bg-card-subtle)',
                    color: isChecked ? '#ffffff' : 'var(--text-primary)',
                    padding: '6px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Icon size={16} strokeWidth={1.75} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.86rem', color: 'var(--text-primary)' }}>{ins.label}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{ins.statute}</div>
                  </div>
                </div>
                <div style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: isChecked ? 'var(--maison-gold)' : 'var(--bg-card)',
                  border: `1.5px solid ${isChecked ? 'var(--maison-gold)' : 'var(--border-architectural)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff'
                }}>
                  {isChecked && <Check size={11} strokeWidth={3} />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Column: Asset Accounts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>
            2. WEALTH &amp; INVESTMENT ACCOUNTS
          </span>
          {ASSET_HOLDINGS.map((ast) => {
            const Icon = ast.icon;
            const isChecked = existingAssets.includes(ast.id);
            return (
              <button
                key={ast.id}
                type="button"
                onClick={() => onToggleAsset(ast.id)}
                className="hover-lift"
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: isChecked ? '1.5px solid var(--maison-gold)' : '1px solid var(--border-architectural)',
                  background: isChecked ? 'var(--maison-gold-subtle)' : 'var(--bg-card)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    background: isChecked ? 'var(--maison-obsidian)' : 'var(--bg-card-subtle)',
                    color: isChecked ? '#ffffff' : 'var(--text-primary)',
                    padding: '6px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Icon size={16} strokeWidth={1.75} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.86rem', color: 'var(--text-primary)' }}>{ast.label}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{ast.desc}</div>
                  </div>
                </div>
                <div style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: isChecked ? 'var(--maison-gold)' : 'var(--bg-card)',
                  border: `1.5px solid ${isChecked ? 'var(--maison-gold)' : 'var(--border-architectural)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff'
                }}>
                  {isChecked && <Check size={11} strokeWidth={3} />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
