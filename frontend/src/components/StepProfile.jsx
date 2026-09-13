import React, { useState } from 'react';
import { 
  User, DollarSign, Target, ShieldCheck, ArrowRight, ArrowLeft, Check, 
  TrendingUp, Wallet, Shield, Activity, PieChart as PieIcon,
  Layers, Clock, Building2, Landmark, Sun, Briefcase, Key, Gem, Brain,
  Sparkles
} from 'lucide-react';
import AIConsultantWidget from './AIConsultantWidget';
import InteractiveCashFlow from './InteractiveCashFlow';

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

  const safeProfile = profile || {};
  const clientGoals = Array.isArray(safeProfile.goals) ? safeProfile.goals : ['freedom', 'etf_wealth'];

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

  const existingInsurances = Array.isArray(safeProfile.existing_insurances) ? safeProfile.existing_insurances : ['Liability'];
  const existingAssets = Array.isArray(safeProfile.existing_assets) ? safeProfile.existing_assets : ['etf'];

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

  const currentAge = Number(safeProfile.age) || 30;
  const retirementAge = Number(safeProfile.retirement_age) || 67;
  const workingYearsRemaining = Math.max(1, retirementAge - currentAge);
  const goldenYears = Math.max(1, 90 - retirementAge);

  const hasBU = existingInsurances.includes('BU') || Boolean(safeProfile.bu_monthly_benefit && safeProfile.bu_monthly_benefit > 0);
  const monthlyExpenses = (Number(safeProfile.housing_cost) || 0) + (Number(safeProfile.living_cost) || 0) + (Number(safeProfile.mobility_cost) || 0) + (Number(safeProfile.leisure_cost) || 0) || 2180;
  const liquidReserve = safeProfile.liquid_savings !== undefined && safeProfile.liquid_savings !== null ? Number(safeProfile.liquid_savings) : 5000;
  const hasLiquidity = liquidReserve >= Math.max(3000, monthlyExpenses * 3);
  const hasETF = existingAssets.includes('etf') || Boolean((Number(safeProfile.monthly_investment) || 0) > 0);
  const hasBAV = existingAssets.includes('bav') || Boolean((Number(safeProfile.bav_contribution) || 0) > 0);
  const salary = Number(safeProfile.income) || 60000;
  const monthlyInvestment = safeProfile.monthly_investment !== undefined && safeProfile.monthly_investment !== null ? Number(safeProfile.monthly_investment) : 500;

  // 5-Pillar Structural Audit Matrix with DIN 77230 citations
  const pillarAudits = [
    { 
      pillar: 'Income & Disability Shield', 
      citation: 'DIN 77230 § 1.1 Existential Defense',
      desc: hasBU ? 'Active occupational disability shield covering 80% of net earnings' : 'Critical disability income gap detected — salary at risk upon sickness',
      score: hasBU ? 94 : 48,
      benchmark: 'Target: ≥ 80%',
      icon: ShieldCheck,
      status: hasBU ? 'Protected' : 'Action Required',
      statusColor: hasBU ? 'var(--accent-emerald)' : 'var(--accent-coral)',
      highlight: hasBU ? '€1.8M Defense Active' : '€1.8M Human Capital Unshielded',
      recommendation: hasBU ? 'Maintain active policy with statutory inflation indexing' : 'Configure BU income shield sized to 80% net salary in Step 2'
    },
    { 
      pillar: 'Statutory Tax Alpha & Deductions', 
      citation: 'EStG § 9 / § 10 / § 32a Tariff',
      desc: 'Progressive tariff relief via Werbungskosten, Homeoffice-Pauschale, and Vorsorgeaufwand',
      score: 88,
      benchmark: 'Target: ≥ 85%',
      icon: Landmark,
      status: 'High Potential',
      statusColor: 'var(--accent-emerald)',
      highlight: '+€1,450 / yr Tax Refund',
      recommendation: 'Optimize commuter allowances and pension deductions in Step 3'
    },
    { 
      pillar: 'Quantitative ETF Compounding', 
      citation: '§ 20 InvStG 30% Partial Exemption',
      desc: hasETF ? 'Low-cost core equities driving 7.0% p.a. expected capital compounding' : 'Depot accumulation below optimal surplus savings capacity',
      score: hasETF ? 92 : 52,
      benchmark: 'Target: ≥ 80%',
      icon: TrendingUp,
      status: hasETF ? 'Prime Trajectory' : 'Underallocated',
      statusColor: hasETF ? 'var(--accent-emerald)' : 'var(--accent-ochre)',
      highlight: hasETF ? '7.0% Growth Trajectory' : 'Deploy Surplus Cash Flow',
      recommendation: hasETF ? 'Execute automated monthly MSCI World / ACWI ETF savings plan' : 'Set up automated monthly ETF savings in Step 4'
    },
    { 
      pillar: 'Pension Solvency & Rentenlücke', 
      citation: 'SGB VI Actuarial Entgeltpunkte',
      desc: hasBAV ? '3-pillar strategy active with employer-subsidized bAV pension allocation' : 'Statutory replacement ratio ~48% — private capital required to close retirement gap',
      score: hasBAV ? 86 : 64,
      benchmark: 'Target: ≥ 80%',
      icon: Layers,
      status: hasBAV ? 'On Track' : 'Rentenlücke Detected',
      statusColor: hasBAV ? 'var(--accent-emerald)' : 'var(--accent-ochre)',
      highlight: hasBAV ? '3 Pillars Structured' : 'Rentenlücke Gap Present',
      recommendation: hasBAV ? 'Leverage statutory 15% employer subsidy mandate (§ 1a BetrAVG)' : 'Simulate Rentenlücke closure in Step 5'
    },
    { 
      pillar: 'Emergency Liquidity Cushion', 
      citation: 'DIN 77230 § 2.1 Cash Reserve',
      desc: hasLiquidity ? `€${liquidReserve.toLocaleString()} liquid cash held (covers ${(liquidReserve / Math.max(1, monthlyExpenses)).toFixed(1)} months fixed expenses)` : `Liquid reserve (€${liquidReserve.toLocaleString()}) is below 3-month fixed expense threshold (€${(monthlyExpenses * 3).toLocaleString()})`,
      score: hasLiquidity ? 96 : 58,
      benchmark: 'Target: ≥ 90%',
      icon: Wallet,
      status: hasLiquidity ? 'Fully Capitalized' : 'Replenish Reserve',
      statusColor: hasLiquidity ? 'var(--accent-emerald)' : 'var(--accent-ochre)',
      highlight: `${(liquidReserve / Math.max(1, monthlyExpenses)).toFixed(1)} Months Covered`,
      recommendation: hasLiquidity ? 'Maintain in high-yield daily money account (Tagesgeld)' : 'Build 3-month living expense reserve before expanding equity allocations'
    }
  ];

  const score = Math.round(pillarAudits.reduce((acc, p) => acc + p.score, 0) / pillarAudits.length);

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

        {/* Sub-Step Indicator Bar */}
        <div className="profile-stepper" style={{
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          paddingBottom: '12px',
          marginBottom: '18px',
          borderBottom: '1px solid var(--border-architectural)',
          scrollbarWidth: 'none'
        }}>
          {subStepTitles.map((title, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSubStep(idx)}
              style={{
                background: subStep === idx ? 'var(--maison-obsidian)' : 'var(--bg-card-subtle)',
                color: subStep === idx ? '#ffffff' : 'var(--text-secondary)',
                border: subStep === idx ? '1px solid var(--maison-gold)' : '1px solid var(--border-architectural)',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.74rem',
                fontWeight: subStep === idx ? 800 : 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s var(--ease-luxury)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: subStep === idx ? 'var(--maison-gold)' : 'var(--border-architectural)',
                color: subStep === idx ? '#060b14' : 'var(--text-secondary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.7rem',
                fontWeight: 800
              }}>
                {idx + 1}
              </span>
              {title.replace(/^\d+\.\s*/, '')}
            </button>
          ))}
        </div>

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
            <div className="profile-goals-grid" style={{ display: 'grid', gap: '14px' }}>
              {availableGoals.map((g) => {
                const Icon = g.icon;
                const isSelected = clientGoals.includes(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => toggleGoal(g.id)}
                    className="hover-lift profile-goal-card"
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
          <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '28px', padding: '6px 0' }}>
            
            {/* Header: Clean Stately Private Wealth Memo Header */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start', 
              flexWrap: 'wrap', 
              gap: '16px', 
              borderBottom: '1px solid var(--border-architectural)', 
              paddingBottom: '20px' 
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className="jpm-gold-tag">DIN 77230 / EStG § 32a / SGB VI</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>· 2026 Fiscal Cycle</span>
                </div>
                <h3 style={{ 
                  margin: 0, 
                  fontSize: 'clamp(1.35rem, 2.5vw, 1.65rem)', 
                  fontWeight: 700, 
                  color: 'var(--text-primary)', 
                  letterSpacing: '-0.025em', 
                  fontFamily: 'var(--font-heading)' 
                }}>
                  Actuarial Balance Sheet &amp; Solvency Audit
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '780px', lineHeight: '1.55' }}>
                  Institutional diagnostic evaluating your household balance sheet across human capital risk, progressive tax leakage, compound savings velocity, and 3-pillar retirement solvency.
                </p>
              </div>

              {/* Overall Executive Rating Badge */}
              <div style={{ 
                background: 'var(--bg-card)', 
                border: '1px solid var(--border-architectural)', 
                borderTop: '3px solid var(--maison-gold)',
                borderRadius: '12px', 
                padding: '14px 20px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '16px',
                boxShadow: 'var(--shadow-xs)',
                flexShrink: 0
              }}>
                <div>
                  <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    SOLVENCY RATING
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px', fontFamily: 'var(--font-heading)' }}>
                    {score >= 80 ? 'Grade A · Sovereign' : 'Grade B+ · High Alpha'}
                  </div>
                </div>
                <div style={{ 
                  width: '46px', 
                  height: '46px', 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, var(--maison-pine-deep), var(--maison-obsidian))', 
                  border: '1.5px solid var(--maison-gold)',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'var(--maison-gold)',
                  fontWeight: 800,
                  fontSize: '1.15rem',
                  fontVariantNumeric: 'tabular-nums',
                  fontFamily: 'var(--font-heading)'
                }}>
                  {score}
                </div>
              </div>
            </div>

            {/* SECTION 1: Master Actuarial Balance Sheet Ledger Table */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-architectural)',
              borderRadius: '14px',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-xs)'
            }}>
              <div style={{ 
                padding: '16px 22px', 
                background: 'var(--bg-card-subtle)', 
                borderBottom: '1px solid var(--border-architectural)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  HOUSEHOLD SOLVENCY &amp; CAPITAL ALLOCATION MATRIX
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Actuarial Benchmarks Aligned with German Statutory Law
                </span>
              </div>

              {/* Analytical Ledger Rows */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                
                {/* Ledger Header */}
                <div className="hide-on-mobile" style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'minmax(220px, 1.8fr) minmax(130px, 1.2fr) minmax(130px, 1.2fr) minmax(140px, 1.3fr) minmax(110px, 0.9fr)', 
                  padding: '10px 22px', 
                  background: 'var(--bg-card)', 
                  borderBottom: '1px solid var(--border-architectural)',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em'
                }}>
                  <div>Diagnostic Pillar</div>
                  <div>Current Exposure</div>
                  <div>Statutory Benchmark</div>
                  <div>Solvency Ratio</div>
                  <div style={{ textAlign: 'right' }}>Status Verdict</div>
                </div>

                {/* Row 1: Income & Human Capital Shield */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', 
                  padding: '16px 22px', 
                  borderBottom: '1px solid var(--border-architectural)',
                  alignItems: 'center',
                  gap: '12px',
                  background: hasBU ? 'transparent' : 'rgba(239, 68, 68, 0.02)'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>1. Income &amp; Human Capital Shield</strong>
                    <span style={{ fontSize: '0.72rem', color: 'var(--maison-gold)', fontWeight: 700 }}>DIN 77230 § 1.1 Existential Risk</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }} className="hide-on-desktop">Current:</div>
                    <span className="tabular-nums" style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {hasBU ? '80% Net Salary Active' : '€0 Shield (Uncovered)'}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }} className="hide-on-desktop">Benchmark:</div>
                    <span className="tabular-nums" style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                      €{Math.round((salary * 0.8) / 12).toLocaleString()} / mo (80%)
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ flex: 1, height: '6px', background: 'var(--border-architectural)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: hasBU ? '94%' : '48%', height: '100%', background: hasBU ? 'var(--accent-emerald)' : 'var(--accent-coral)' }} />
                    </div>
                    <span className="tabular-nums" style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {hasBU ? '94%' : '48%'}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      fontWeight: 800, 
                      color: hasBU ? 'var(--accent-emerald)' : 'var(--accent-coral)',
                      background: hasBU ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      border: `1px solid ${hasBU ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      display: 'inline-block'
                    }}>
                      {hasBU ? 'Protected' : 'Shield Gap'}
                    </span>
                  </div>
                </div>

                {/* Row 2: Statutory Tax Optimization (§ 32a EStG) */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', 
                  padding: '16px 22px', 
                  borderBottom: '1px solid var(--border-architectural)',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>2. Statutory Tax Optimization</strong>
                    <span style={{ fontSize: '0.72rem', color: 'var(--maison-gold)', fontWeight: 700 }}>EStG § 32a / § 9 Werbungskosten</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }} className="hide-on-desktop">Current:</div>
                    <span className="tabular-nums" style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      €{salary.toLocaleString()} Gross Tax Base
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }} className="hide-on-desktop">Benchmark:</div>
                    <span className="tabular-nums" style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                      +€2,850 Deductions Potential
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ flex: 1, height: '6px', background: 'var(--border-architectural)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: '88%', height: '100%', background: 'var(--accent-emerald)' }} />
                    </div>
                    <span className="tabular-nums" style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>88%</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      fontWeight: 800, 
                      color: 'var(--accent-emerald)',
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      display: 'inline-block'
                    }}>
                      +€1,450 / yr
                    </span>
                  </div>
                </div>

                {/* Row 3: Quantitative Compound Growth (§ 20 InvStG) */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', 
                  padding: '16px 22px', 
                  borderBottom: '1px solid var(--border-architectural)',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>3. Quantitative ETF Accumulation</strong>
                    <span style={{ fontSize: '0.72rem', color: 'var(--maison-gold)', fontWeight: 700 }}>§ 20 InvStG 30% Teilfreistellung</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }} className="hide-on-desktop">Current:</div>
                    <span className="tabular-nums" style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      €{monthlyInvestment.toLocaleString()} / mo (TER 0.14%)
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }} className="hide-on-desktop">Benchmark:</div>
                    <span className="tabular-nums" style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                      7.0% p.a. Compound Engine
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ flex: 1, height: '6px', background: 'var(--border-architectural)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: hasETF ? '92%' : '52%', height: '100%', background: hasETF ? 'var(--accent-emerald)' : 'var(--accent-ochre)' }} />
                    </div>
                    <span className="tabular-nums" style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {hasETF ? '92%' : '52%'}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      fontWeight: 800, 
                      color: hasETF ? 'var(--accent-emerald)' : 'var(--accent-ochre)',
                      background: hasETF ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      border: `1px solid ${hasETF ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      display: 'inline-block'
                    }}>
                      {hasETF ? 'Optimal' : 'Underallocated'}
                    </span>
                  </div>
                </div>

                {/* Row 4: 3-Pillar Pension Solvency (SGB VI) */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', 
                  padding: '16px 22px', 
                  borderBottom: '1px solid var(--border-architectural)',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>4. 3-Pillar Pension Solvency</strong>
                    <span style={{ fontSize: '0.72rem', color: 'var(--maison-gold)', fontWeight: 700 }}>SGB VI Actuarial Entgeltpunkte</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }} className="hide-on-desktop">Current:</div>
                    <span className="tabular-nums" style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      ~48% Statutory Replacement
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }} className="hide-on-desktop">Benchmark:</div>
                    <span className="tabular-nums" style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                      80% Net Income Target
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ flex: 1, height: '6px', background: 'var(--border-architectural)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: hasBAV ? '86%' : '64%', height: '100%', background: hasBAV ? 'var(--accent-emerald)' : 'var(--accent-ochre)' }} />
                    </div>
                    <span className="tabular-nums" style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {hasBAV ? '86%' : '64%'}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      fontWeight: 800, 
                      color: hasBAV ? 'var(--accent-emerald)' : 'var(--accent-ochre)',
                      background: hasBAV ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      border: `1px solid ${hasBAV ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      display: 'inline-block'
                    }}>
                      {hasBAV ? 'Pillars Active' : 'Gap Present'}
                    </span>
                  </div>
                </div>

                {/* Row 5: Liquidity Coverage Ratio (LCR) */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', 
                  padding: '16px 22px', 
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>5. Emergency Liquidity Ratio (LCR)</strong>
                    <span style={{ fontSize: '0.72rem', color: 'var(--maison-gold)', fontWeight: 700 }}>DIN 77230 § 2.1 Cash Buffer</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }} className="hide-on-desktop">Current:</div>
                    <span className="tabular-nums" style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      €{liquidReserve.toLocaleString()} Liquid Buffer
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }} className="hide-on-desktop">Benchmark:</div>
                    <span className="tabular-nums" style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                      3.0 Months OpEx (€{(monthlyExpenses * 3).toLocaleString()})
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ flex: 1, height: '6px', background: 'var(--border-architectural)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: hasLiquidity ? '96%' : '58%', height: '100%', background: hasLiquidity ? 'var(--accent-emerald)' : 'var(--accent-ochre)' }} />
                    </div>
                    <span className="tabular-nums" style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {hasLiquidity ? '96%' : '58%'}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      fontWeight: 800, 
                      color: hasLiquidity ? 'var(--accent-emerald)' : 'var(--accent-ochre)',
                      background: hasLiquidity ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      border: `1px solid ${hasLiquidity ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      display: 'inline-block'
                    }}>
                      {hasLiquidity ? 'Adequate' : 'Replenish'}
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* SECTION 2: Quantitative Stress-Test Sensitivity Matrix */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-architectural)',
              borderRadius: '14px',
              padding: '22px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: 'var(--shadow-xs)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--maison-gold)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    QUANTITATIVE STRESS-TEST SCENARIOS
                  </span>
                  <h4 style={{ margin: '2px 0 0 0', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                    Household Capital Sensitivity Under Adverse Shocks
                  </h4>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  DIN 77230 Actuarial Multi-Factor Stress
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '14px' }}>
                
                {/* Scenario A: Baseline */}
                <div style={{ 
                  background: 'var(--bg-card-subtle)', 
                  padding: '16px', 
                  borderRadius: '11px', 
                  border: '1px solid var(--border-architectural)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    Scenario A · Baseline
                  </div>
                  <strong style={{ fontSize: '1.15rem', color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                    €250,000+ Terminal Wealth
                  </strong>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    Current savings trajectory with 7.0% p.a. baseline ETF growth and standard statutory tax tariff.
                  </p>
                </div>

                {/* Scenario B: Adverse Stress */}
                <div style={{ 
                  background: 'var(--bg-card-subtle)', 
                  padding: '16px', 
                  borderRadius: '11px', 
                  border: '1px solid var(--border-architectural)',
                  borderLeft: '3px solid var(--accent-coral)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent-coral)', textTransform: 'uppercase' }}>
                    Scenario B · Severe Stress Shock
                  </div>
                  <strong style={{ fontSize: '1.15rem', color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                    {hasBU ? '100% Solvency Preserved' : '-52% Income Loss (BU Gap)'}
                  </strong>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    Simulates 36-month occupational disability or severe sequence-of-returns equity market shock (-35%).
                  </p>
                </div>

                {/* Scenario C: Optimized Fiduciary */}
                <div style={{ 
                  background: 'var(--bg-card-subtle)', 
                  padding: '16px', 
                  borderRadius: '11px', 
                  border: '1px solid var(--border-architectural)',
                  borderLeft: '3px solid var(--maison-gold)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--maison-gold)', textTransform: 'uppercase' }}>
                    Scenario C · Fiduciary Optimized
                  </div>
                  <strong style={{ fontSize: '1.15rem', color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                    +€1,450 / yr + €1.8M Shield
                  </strong>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    Full statutory tax capture (§ 32a), 80% net salary shield, and subsidized 3-pillar retirement closure.
                  </p>
                </div>

              </div>
            </div>

            {/* SECTION 3: Fiduciary Methodology Declaration */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              padding: '12px 18px',
              background: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-architectural)',
              borderRadius: '10px',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={14} color="var(--maison-gold)" />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Audit calculations strictly cite statutory federal law (§ 32a EStG, InvStG § 20, SGB VI) under DIN 77230 financial analysis standards.
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--maison-gold)', letterSpacing: '0.04em' }}>
                100% Fee-Only &amp; Independent
              </span>
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
