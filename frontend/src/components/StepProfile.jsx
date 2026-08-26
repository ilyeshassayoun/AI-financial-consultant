import React, { useState } from 'react';
import { 
  User, DollarSign, Target, ShieldCheck, ArrowRight, ArrowLeft, Check, 
  TrendingUp, Wallet, Shield, Activity, PieChart as PieIcon,
  Layers, Clock, Building2, Landmark, Sun, Briefcase, Key, Gem, Brain
} from 'lucide-react';
import AIConsultantWidget from './AIConsultantWidget';
import InteractiveCashFlow from './InteractiveCashFlow';
import ExpertAdvisoryPlan from './ExpertAdvisoryPlan';

export default function StepProfile({ profile, updateProfile, nextStep, prevStep, analysis, subStep: propSubStep, setSubStep: propSetSubStep, onApplyPatch, onOpenChat }) {
  const [localSubStep, setLocalSubStep] = useState(0);
  const subStep = typeof propSubStep === 'number' ? propSubStep : localSubStep;
  const setSubStep = (updaterOrVal) => {
    if (propSetSubStep) {
      propSetSubStep(updaterOrVal);
    } else {
      setLocalSubStep(updaterOrVal);
    }
  };

  const subStepTitles = [
    '1. Financial Goals',
    '2. Personal Timeline',
    '3. Cash Flow Details',
    '4. AI Cash Flow Verdict',
    '5. Current Accounts & Assets',
    '6. Financial Health Audit'
  ];

  const aiInsight = analysis?.ai_consultations?.profile;

  // Goals Catalog with Fine-Line Luxury Maison Icons (6 Options)
  const availableGoals = [
    { 
      id: 'freedom', 
      label: 'Financial Freedom & Early Retirement', 
      desc: 'Systematic passive ETF dividend cash flow', 
      icon: Sun,
      badge: '+€1,800/mo Target'
    },
    { 
      id: 'income_defense', 
      label: 'Income & Human Capital Shield', 
      desc: 'Protect earning capacity against disability', 
      icon: Shield,
      badge: '€1.8M Shield'
    },
    { 
      id: 'tax_alpha', 
      label: 'Tax Optimization & Deductions', 
      desc: 'Claim commuter & remote work home-office deductions', 
      icon: Landmark,
      badge: 'Up to €1,450/yr'
    },
    { 
      id: 'etf_wealth', 
      label: 'Compound Wealth Accumulation', 
      desc: 'Low-cost global ETF investment strategy (TER 0.14%)', 
      icon: TrendingUp,
      badge: '7.0% Growth Target'
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

  const clientGoals = profile.goals || ['freedom', 'etf_wealth'];

  const toggleGoal = (id) => {
    const updated = clientGoals.includes(id) 
      ? clientGoals.filter(x => x !== id)
      : [...clientGoals, id];
    updateProfile({ goals: updated });
  };

  // Existing Holdings Catalogs with Fine-Line Architectural Icons
  const insuranceHoldings = [
    { id: 'Liability', label: 'Personal Liability', statute: 'Full Civil Protection', icon: ShieldCheck },
    { id: 'BU', label: 'Income & Disability (BU)', statute: '80% Net Salary Shield', icon: Shield },
    { id: 'PKV', label: 'Private Health (PKV)', statute: 'Executive Care', icon: Activity },
    { id: 'Legal', label: 'Legal Protection', statute: 'Work & Tenancy', icon: Briefcase },
    { id: 'Contents', label: 'Home Contents & Cyber', statute: 'Valuables & Fraud Cover', icon: Key }
  ];

  const assetHoldings = [
    { id: 'etf', label: 'Global ETF Portfolio', desc: 'Low-cost core equities', icon: TrendingUp },
    { id: 'emergency_fund', label: 'Cash Emergency Fund', desc: '3-6 months liquidity reserve', icon: Wallet },
    { id: 'bav', label: 'Company Pension (bAV)', desc: 'Employer subsidized pension', icon: Layers },
    { id: 'real_estate', label: 'Real Estate Property', desc: 'Home equity & real assets', icon: Building2 },
    { id: 'active_funds', label: 'Bank Mutual Funds', desc: 'Active funds (1.8%+ fees)', icon: PieIcon }
  ];

  const existingInsurances = profile.existing_insurances || [];
  const existingAssets = profile.existing_assets || [];

  const toggleInsuranceHolding = (id) => {
    const updated = existingInsurances.includes(id) 
      ? existingInsurances.filter(x => x !== id) 
      : [...existingInsurances, id];
    updateProfile({ existing_insurances: updated });
  };

  const toggleAssetHolding = (id) => {
    const updated = existingAssets.includes(id) 
      ? existingAssets.filter(x => x !== id) 
      : [...existingAssets, id];
    updateProfile({ existing_assets: updated });
  };

  const currentAge = profile.age || 30;
  const retirementAge = profile.retirement_age || 67;
  const workingYearsRemaining = Math.max(1, retirementAge - currentAge);
  const goldenYears = Math.max(1, 90 - retirementAge);

  const optSummary = analysis?.optimization?.summary || {};
  const score = optSummary.financial_health_score || 78;
  const breakdown = optSummary.score_breakdown || {
    risk_defense: existingInsurances.includes('BU') ? 18 : 10,
    tax_efficiency: 15,
    investment_growth: 16,
    retirement_solvency: 14,
    liquidity_reserve: 18
  };

  // 5-Pillar Structural Audit Matrix
  const pillarAudits = [
    { 
      pillar: 'Income & Disability Defense', 
      desc: existingInsurances.includes('BU') ? '80% net salary shield active' : 'Critical disability income gap detected',
      score: (breakdown.risk_defense || (existingInsurances.includes('BU') ? 18 : 10)) * 5,
      icon: ShieldCheck,
      status: existingInsurances.includes('BU') ? 'Protected' : 'Action Required',
      statusColor: existingInsurances.includes('BU') ? 'var(--accent-emerald)' : 'var(--accent-ochre)'
    },
    { 
      pillar: 'Tax Efficiency & §9 Deductions', 
      desc: 'Commuter, home-office & pension tax deductions eligible',
      score: (breakdown.tax_efficiency || 15) * 5,
      icon: Landmark,
      status: 'High Potential',
      statusColor: 'var(--accent-emerald)'
    },
    { 
      pillar: 'Global ETF Compounding', 
      desc: 'Low-cost core equities with 7.0% p.a. wealth trajectory',
      score: (breakdown.investment_growth || 16) * 5,
      icon: TrendingUp,
      status: 'Prime Trajectory',
      statusColor: 'var(--accent-emerald)'
    },
    { 
      pillar: 'Pension Solvency & Rentenlücke', 
      desc: 'Statutory replacement gap requires private accumulation',
      score: (breakdown.retirement_solvency || 14) * 5,
      icon: Layers,
      status: 'Review Needed',
      statusColor: 'var(--accent-ochre)'
    },
    { 
      pillar: 'Emergency Liquidity Reserve', 
      desc: '3-6 months fixed living costs liquid cash cushion',
      score: (breakdown.liquidity_reserve || 18) * 5,
      icon: Wallet,
      status: 'Funded',
      statusColor: 'var(--accent-emerald)'
    }
  ];

  return (
    <div className="animate-fade-in-up" style={{ 
      padding: '0 0 16px 0', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '14px', 
      maxWidth: '1360px', 
      margin: '0 auto',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      
      {/* Real-time AI Consultant Live Strategy Banner on Mandate Goal View */}
      {subStep === 0 && (
        <AIConsultantWidget 
          insight={aiInsight} 
          onApplyPatch={onApplyPatch} 
          onOpenChat={onOpenChat} 
        />
      )}

      {/* Main Profile Wizard Card */}
      <div className="wizard-card" style={{ padding: '24px 28px' }}>

        {/* SUBSTEP 0: Financial Goals */}
        {subStep === 0 && (
          <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
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
                {clientGoals.length} Goals Selected
              </span>
            </div>

            {/* Symmetrical Auto-Fit Goals Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              {availableGoals.map((g) => {
                const Icon = g.icon;
                const isSelected = clientGoals.includes(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => toggleGoal(g.id)}
                    className="hover-lift"
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
                        fontSize: '0.68rem', 
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
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: '1.4' }}>{g.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* SUBSTEP 1: Personal Timeline */}
        {subStep === 1 && (
          <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'var(--maison-gold-subtle)', padding: '10px', borderRadius: '10px', color: 'var(--text-primary)' }}>
                <User size={24} strokeWidth={1.5} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>Personal Timeline &amp; Career Horizon</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>Your active wealth accumulation window and statutory family parameters.</p>
              </div>
            </div>

            {/* Lifecycle Timeline Track */}
            <div style={{ background: 'var(--bg-card-subtle)', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-architectural)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                  WEALTH LIFECYCLE HORIZON
                </span>
                <span className="badge badge-brand" style={{ fontSize: '0.72rem', padding: '3px 9px' }}>
                  <Clock size={12} /> {workingYearsRemaining} Earning Years Remaining
                </span>
              </div>

              <div style={{ display: 'flex', width: '100%', height: '9px', borderRadius: '5px', overflow: 'hidden', border: '1px solid var(--border-architectural)' }}>
                <div style={{ width: `${(workingYearsRemaining / (workingYearsRemaining + goldenYears)) * 100}%`, background: 'var(--maison-gold)' }} title="Active Accumulation Phase" />
                <div style={{ width: `${(goldenYears / (workingYearsRemaining + goldenYears)) * 100}%`, background: 'var(--text-primary)' }} title="Golden Retirement Phase" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                <span>● Current Age ({currentAge})</span>
                <span>● Target Retirement ({retirementAge})</span>
                <span>● Longevity (90+)</span>
              </div>
            </div>

            {/* Sliders & Checkboxes in Responsive Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              <div style={{ background: 'var(--bg-card-subtle)', padding: '16px 18px', borderRadius: '12px', border: '1px solid var(--border-architectural)' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                  <span>Current Age</span>
                  <span className="tabular-nums" style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.1rem' }}>{currentAge} yrs</span>
                </label>
                <input 
                  type="range" 
                  min="18" 
                  max="70" 
                  value={currentAge} 
                  onChange={e => updateProfile({ age: parseInt(e.target.value) })} 
                  style={{ width: '100%' }} 
                />
              </div>

              <div style={{ background: 'var(--bg-card-subtle)', padding: '16px 18px', borderRadius: '12px', border: '1px solid var(--border-architectural)' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                  <span>Target Retirement Age</span>
                  <span className="tabular-nums" style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.1rem' }}>{retirementAge} yrs</span>
                </label>
                <input 
                  type="range" 
                  min={Math.max(55, currentAge + 1)} 
                  max="75" 
                  value={retirementAge} 
                  onChange={e => updateProfile({ retirement_age: parseInt(e.target.value) })} 
                  style={{ width: '100%' }} 
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label className="hover-lift" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-card-subtle)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-architectural)', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={profile.is_married} 
                    onChange={e => updateProfile({ is_married: e.target.checked })} 
                  />
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>Married (Joint Tax Assessment)</div>
                </label>

                <label className="hover-lift" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-card-subtle)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-architectural)', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={profile.has_dependents} 
                    onChange={e => updateProfile({ has_dependents: e.target.checked })} 
                  />
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>Has Dependents (Kinderfreibetrag)</div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* SUBSTEP 2: Cash Flow Details (Input & Typing) */}
        {subStep === 2 && (
          <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div style={{ background: 'var(--bg-card-subtle)', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-architectural)' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>Annual Gross Salary</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-card)', padding: '4px 10px', borderRadius: '8px', border: '1px solid var(--border-architectural)' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>€</span>
                    <input 
                      type="number"
                      value={profile.income}
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
                  value={profile.income} 
                  onChange={e => updateProfile({ income: parseFloat(e.target.value) })} 
                  style={{ width: '100%' }} 
                />
              </div>

              <div style={{ background: 'var(--bg-card-subtle)', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-architectural)' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: '8px', display: 'block', color: 'var(--text-primary)' }}>
                  Tax Bracket (Steuerklasse)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
                  {[1, 2, 3, 4, 5, 6].map((cls) => {
                    const isSel = profile.tax_class === cls;
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
              <div style={{ marginBottom: '12px' }}><h4 id="foundation-title" style={{ margin: 0, color: 'var(--text-primary)' }}>Balance-sheet &amp; protection foundation</h4><p style={{ margin: '3px 0 0', fontSize: '.76rem', color: 'var(--text-secondary)' }}>These facts determine whether debt reduction, reserves, protection, or investing should come first.</p></div>
              <div className="financial-foundation-grid">
                {[
                  ['Liquid savings', 'liquid_savings', 1, '€'], ['Unsecured debt', 'unsecured_debt', 1, '€'],
                  ['Debt interest rate', 'unsecured_debt_rate', .1, '%'], ['Monthly debt payment', 'monthly_debt_payment', 1, '€'],
                  ['Existing BU benefit', 'bu_monthly_benefit', 1, '€/mo']
                ].map(([label, key, step, suffix]) => <label key={key} style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{label}<div className="foundation-input"><input aria-label={label} type="number" min="0" step={step} value={key === 'unsecured_debt_rate' ? (profile[key] || 0) * 100 : profile[key] || 0} onChange={e => updateProfile({ [key]: key === 'unsecured_debt_rate' ? Number(e.target.value) / 100 : Number(e.target.value) })} /><span>{suffix}</span></div></label>)}
                <label style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Income stability<select aria-label="Income stability" value={profile.employment_stability || 'stable'} onChange={e => updateProfile({ employment_stability: e.target.value })}><option value="stable">Stable employment</option><option value="variable">Variable / self-employed</option></select></label>
              </div>
            </section>
          </div>
        )}

        {/* SUBSTEP 3: Unified AI Cash Flow Verdict & Multiplier */}
        {subStep === 3 && (
          <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
        )}

        {/* SUBSTEP 4: Current Holdings & Assets */}
        {subStep === 4 && (
          <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {/* Left Column: Insurance Policies */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>
                  1. RISK &amp; DEFENSE POLICIES
                </span>
                {insuranceHoldings.map((ins) => {
                  const Icon = ins.icon;
                  const isChecked = existingInsurances.includes(ins.id);
                  return (
                    <button
                      key={ins.id}
                      type="button"
                      onClick={() => toggleInsuranceHolding(ins.id)}
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
                {assetHoldings.map((ast) => {
                  const Icon = ast.icon;
                  const isChecked = existingAssets.includes(ast.id);
                  return (
                    <button
                      key={ast.id}
                      type="button"
                      onClick={() => toggleAssetHolding(ast.id)}
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
        )}

        {/* SUBSTEP 5: Actuarial Financial Health Audit */}
        {subStep === 5 && (
          <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Header Introduction Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'var(--maison-gold-subtle)', padding: '10px', borderRadius: '10px', color: 'var(--text-primary)' }}>
                  <ShieldCheck size={24} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>Actuarial Financial Health Audit</h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>Holistic diagnostic across risk defense, tax alpha, wealth velocity, and pension solvency.</p>
                </div>
              </div>
              <span className="badge badge-brand" style={{ fontSize: '0.74rem', padding: '4px 10px' }}>
                DIN 77230 Aligned
              </span>
            </div>

            {/* Symmetrical 2-Column Suite */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
              gap: '20px', 
              alignItems: 'stretch' 
            }}>
              
              {/* Left Suite: Executive Health Cockpit */}
              <div className="solid-card" style={{ 
                padding: '24px', 
                borderRadius: '16px', 
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '20px',
                background: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-architectural)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    EXECUTIVE RESILIENCE SCORE
                  </span>
                  <span className="badge badge-brand" style={{ fontSize: '0.7rem' }}>
                    {score >= 80 ? 'Grade A Standard' : 'Grade B+ Baseline'}
                  </span>
                </div>

                {/* Clean Radial Dial & Score Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '8px 0' }}>
                  <div style={{
                    width: '96px',
                    height: '96px',
                    borderRadius: '50%',
                    background: `conic-gradient(var(--maison-obsidian) ${score * 3.6}deg, var(--maison-gold) ${score * 3.6}deg, var(--border-architectural) 0deg)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-sm)',
                    flexShrink: 0
                  }}>
                    <div style={{ 
                      width: '78px', 
                      height: '78px', 
                      borderRadius: '50%', 
                      background: 'var(--bg-card)', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      border: '1.5px solid var(--border-architectural)'
                    }}>
                      <span className="tabular-nums" style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{score}</span>
                      <span style={{ fontSize: '0.52rem', color: 'var(--text-muted)', fontWeight: 800, marginTop: '2px' }}>/ 100 PTS</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="live-beacon-pulse" style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent-emerald)', display: 'inline-block' }} />
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                        {score >= 80 ? 'Optimal Capital Solvency' : 'Solid Foundation'}
                      </span>
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {score >= 80 ? 'Institutionally Structured' : 'High Optimization Alpha'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      Audit completed across liquidity, income protection, tax deduction potential, and DRV pension points.
                    </div>
                  </div>
                </div>

                {/* 3 Executive Diagnostic KPI Pills */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <div style={{ background: 'var(--bg-card)', padding: '12px 10px', borderRadius: '10px', border: '1px solid var(--border-architectural)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>CAPITAL SHIELD</div>
                    <div className="tabular-nums" style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '3px' }}>€1.8M Active</div>
                  </div>
                  <div style={{ background: 'var(--bg-card)', padding: '12px 10px', borderRadius: '10px', border: '1px solid var(--border-architectural)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>30-YR GROWTH</div>
                    <div className="tabular-nums" style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '3px' }}>7.0% p.a.</div>
                  </div>
                  <div style={{ background: 'var(--bg-card)', padding: '12px 10px', borderRadius: '10px', border: '1px solid var(--border-architectural)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>TAX REFUND</div>
                    <div className="tabular-nums" style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '3px' }}>+€1,450/yr</div>
                  </div>
                </div>
              </div>

              {/* Right Suite: 5-Pillar Scorecard */}
              <div className="solid-card" style={{ 
                padding: '24px', 
                borderRadius: '16px', 
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-architectural)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    5-PILLAR DIAGNOSTIC SCORECARD
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    Actuarial Breakdown
                  </span>
                </div>

                {pillarAudits.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="hover-lift" style={{ 
                      background: 'var(--bg-card-subtle)', 
                      padding: '8px 12px', 
                      borderRadius: '10px', 
                      border: '1px solid var(--border-architectural)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '5px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ 
                            background: 'var(--bg-card)', 
                            color: 'var(--text-primary)', 
                            padding: '4px', 
                            borderRadius: '6px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            border: '1px solid var(--border-architectural)'
                          }}>
                            <Icon size={13} strokeWidth={2} />
                          </div>
                          <div>
                            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>{item.pillar}</span>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginLeft: '6px' }}>{item.desc}</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ 
                            fontSize: '0.62rem', 
                            fontWeight: 800, 
                            color: item.statusColor, 
                            background: 'var(--bg-card)', 
                            border: '1px solid var(--border-architectural)',
                            padding: '1px 6px', 
                            borderRadius: '4px' 
                          }}>
                            {item.status}
                          </span>
                          <span className="tabular-nums" style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', width: '30px', textAlign: 'right' }}>{item.score}%</span>
                        </div>
                      </div>

                      <div style={{ height: '4px', background: 'var(--bg-card)', borderRadius: '2px', overflow: 'hidden', border: '1px solid var(--border-architectural)' }}>
                        <div 
                          style={{ 
                            height: '100%', 
                            width: `${item.score}%`, 
                            background: item.score >= 80 ? 'linear-gradient(90deg, var(--maison-obsidian), var(--maison-gold))' : 'linear-gradient(90deg, var(--maison-obsidian), var(--accent-ochre))',
                            transition: 'width 0.8s var(--ease-luxury)' 
                          }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

          </div>
        )}

        {/* Wizard Footer Navigation Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--border-architectural)', marginTop: '14px' }}>
          <button 
            type="button" 
            className="btn-secondary" 
            onClick={() => {
              if (subStep > 0) setSubStep(prev => prev - 1);
              else if (prevStep) prevStep();
            }} 
            style={{ padding: '10px 20px' }}
          >
            <ArrowLeft size={16} /> {subStep === 0 ? 'Back to Portal' : 'Previous'}
          </button>

          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Step {subStep + 1} of {subStepTitles.length}
          </span>

          {subStep < subStepTitles.length - 1 ? (
            <button type="button" className="btn-brand" onClick={() => setSubStep(prev => prev + 1)} style={{ padding: '10px 24px' }}>
              Continue <ArrowRight size={16} />
            </button>
          ) : (
            <button type="button" className="btn-brand" onClick={nextStep} style={{ padding: '10px 24px' }}>
              Proceed to Risk Shield <ArrowRight size={16} />
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
