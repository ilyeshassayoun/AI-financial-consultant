import React from 'react';
import { Target, Sun, Shield, Landmark, TrendingUp, Building2, Gem } from 'lucide-react';

export const AVAILABLE_GOALS = [
  { 
    id: 'freedom', 
    label: 'Financial Freedom & Early Retirement', 
    desc: 'Systematic passive ETF dividend cash flow', 
    icon: Sun,
    badge: 'Build flexibility'
  },
  { 
    id: 'income_defense', 
    label: 'Income & Human Capital Shield', 
    desc: 'Protect earning capacity against disability', 
    icon: Shield,
    badge: 'Protect earnings'
  },
  { 
    id: 'tax_alpha', 
    label: 'Tax Optimization & Deductions', 
    desc: 'Claim commuter & remote work home-office deductions', 
    icon: Landmark,
    badge: 'Use verified inputs'
  },
  { 
    id: 'etf_wealth', 
    label: 'Compound Wealth Accumulation', 
    desc: 'Low-cost, diversified long-term investment strategy',
    icon: TrendingUp,
    badge: 'Long-term funding'
  },
  { 
    id: 'property', 
    label: 'Real Estate & Wealth Security', 
    desc: 'Residential property equity and inflation protection', 
    icon: Building2,
    badge: 'Real Asset Hedge'
  },
  { 
    id: 'family_legacy', 
    label: 'Family & Generational Wealth Legacy', 
    desc: 'Structured estate transfer & tax-exempt gift allowances', 
    icon: Gem,
    badge: 'Generational Alpha'
  }
];

export default function GoalsStage({ clientGoals = [], onToggleGoal }) {
  const selectedCount = clientGoals?.length || 0;

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="stage-intro-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'var(--maison-gold-subtle)', padding: '10px', borderRadius: '10px', color: 'var(--text-primary)' }}>
            <Target size={24} strokeWidth={1.5} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>Select Your Financial Goals</h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>Choose your primary wealth objectives to tailor your consultation.</p>
          </div>
        </div>
        <span className="badge badge-brand" style={{ fontSize: '0.74rem', padding: '4px 10px' }}>
          {selectedCount} Goals Selected
        </span>
      </div>

      {/* Symmetrical Auto-Fit Goals Grid */}
      <div className="profile-goals-grid" style={{ display: 'grid', gap: '14px' }}>
        {AVAILABLE_GOALS.map((g) => {
          const Icon = g.icon;
          const isSelected = clientGoals?.includes(g.id);
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => onToggleGoal(g.id)}
              className="hover-lift profile-goal-card"
              data-selected={isSelected}
              aria-pressed={isSelected}
              style={{
                padding: '18px 20px',
                borderRadius: '14px',
                border: isSelected ? '1.5px solid var(--maison-gold)' : '1px solid var(--border-architectural)',
                background: isSelected ? 'var(--maison-gold-subtle)' : 'var(--bg-card)',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: isSelected ? 'var(--shadow-subtle)' : 'none',
                transition: 'all var(--transition-smooth)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <div style={{
                  background: isSelected ? 'var(--maison-obsidian)' : 'var(--bg-card-subtle)',
                  color: isSelected ? '#ffffff' : 'var(--text-primary)',
                  width: '38px',
                  height: '38px',
                  borderRadius: '9px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all var(--transition-smooth)'
                }}>
                  <Icon size={18} strokeWidth={1.75} />
                </div>
                <span style={{ 
                  fontSize: '0.76rem',
                  fontWeight: 800, 
                  padding: '3px 8px', 
                  borderRadius: '5px',
                  background: isSelected ? 'var(--maison-obsidian)' : 'var(--bg-card-subtle)',
                  color: isSelected ? '#ffffff' : 'var(--text-secondary)'
                }}>
                  {g.badge}
                </span>
              </div>

              <div>
                <div style={{ fontWeight: 800, fontSize: '0.94rem', color: 'var(--text-primary)' }}>{g.label}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.5' }}>{g.desc}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
