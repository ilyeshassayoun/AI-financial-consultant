import React, { useState } from 'react';
import { 
  Home, ShoppingCart, Car, Coffee, Smartphone, Plane, Plus, Minus, Coins
} from 'lucide-react';
import { 
  ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, 
  PieChart, Pie, AreaChart, Area 
} from 'recharts';

export default function InteractiveCashFlow({ profile, updateProfile, analysis, mode = 'output' }) {
  // Derived Net Salary Calculation
  const grossAnnual = profile.income || 60000;
  const taxData = analysis?.tax || {};
  const netAnnual = taxData.net_income || (grossAnnual * 0.60);
  const primaryNetMonthly = Math.round(netAnnual / 12);
  const secondaryIncome = profile.secondary_income || 0;
  const totalNetInflow = primaryNetMonthly + secondaryIncome;

  // Granular Sub-Category Expenses (Monthly base values)
  const housing = profile.housing_cost !== undefined ? profile.housing_cost : 1100;
  const groceries = profile.living_cost !== undefined ? profile.living_cost : 500;
  const mobility = profile.mobility_cost !== undefined ? profile.mobility_cost : 200;
  const leisure = profile.leisure_cost !== undefined ? profile.leisure_cost : 300;
  const subscriptions = profile.subscriptions_cost !== undefined ? profile.subscriptions_cost : 80;
  const travel = profile.travel_cost !== undefined ? profile.travel_cost : 150;
  const insurancePremiums = (profile.existing_insurances || []).length * 25;

  // Categorical Aggregates
  const totalFixedNeeds = housing + groceries + mobility;
  const totalDiscretionary = leisure + subscriptions + travel;
  const totalProtection = Math.max(15, insurancePremiums);
  const totalOutflow = totalFixedNeeds + totalDiscretionary + totalProtection;
  const unallocatedSurplus = totalNetInflow - totalOutflow;

  // Investment Slider bounds: €10 to Surplus Value
  const maxInvestable = Math.max(10, unallocatedSurplus);
  const [monthlyInvestAmount, setMonthlyInvestAmount] = useState(() => Math.min(250, Math.max(10, unallocatedSurplus)));

  // Derived current invested amount within safe bounds
  const currentInvestAmount = Math.min(maxInvestable, Math.max(10, monthlyInvestAmount));

  // 50/30/20 Rule Metrics
  const needsRatio = Math.min(100, Math.round((totalFixedNeeds / (totalNetInflow || 1)) * 100));
  const wantsRatio = Math.min(100, Math.round((totalDiscretionary / (totalNetInflow || 1)) * 100));
  const wealthRatio = Math.max(0, Math.round((Math.max(0, unallocatedSurplus) / (totalNetInflow || 1)) * 100));
  const housingRatio = Math.round((housing / (totalNetInflow || 1)) * 100);

  // AI Solvency Calculation & Score
  let aiGrade = 'A';
  let aiVerdictTitle = 'Optimal Solvency & Wealth Velocity';
  let aiVerdictShort = 'High free surplus with disciplined fixed living overhead.';

  if (unallocatedSurplus < 0) {
    aiGrade = 'D';
    aiVerdictTitle = 'Liquidity Deficit Warning';
    aiVerdictShort = 'Monthly spending exceeds take-home pay.';
  } else if (needsRatio > 60 || wealthRatio < 10) {
    aiGrade = 'C';
    aiVerdictTitle = 'Elevated Fixed Drag';
    aiVerdictShort = 'Fixed costs consume over 60% of take-home income.';
  } else if (wealthRatio >= 30 && housingRatio <= 35) {
    aiGrade = 'A+';
    aiVerdictTitle = 'Institutional Wealth Builder';
    aiVerdictShort = 'Over 30% unencumbered capital compounding for financial freedom.';
  } else if (wealthRatio >= 20 && needsRatio <= 50) {
    aiGrade = 'A';
    aiVerdictTitle = 'Balanced 50/30/20 Profile';
    aiVerdictShort = 'Closely matches canonical German fiduciary benchmarks.';
  } else {
    aiGrade = 'B';
    aiVerdictTitle = 'Stable Standard Solvency';
    aiVerdictShort = 'Sound baseline foundation with positive monthly savings.';
  }

  // Actuarial Compound Growth Projections (7% p.a. global index return)
  const annualReturn = 0.07;
  const emergencyFundTarget = totalFixedNeeds * 3;

  // Allocation Pie Circle Data
  const allocationPieData = [
    { name: 'Fixed Needs', value: totalFixedNeeds, color: '#1e293b' },
    { name: 'Lifestyle', value: totalDiscretionary, color: '#38bdf8' },
    { name: 'Shields', value: totalProtection, color: '#94a3b8' },
    { name: 'Free Surplus', value: Math.max(0, unallocatedSurplus), color: '#c5a059' }
  ].filter(item => item.value > 0);

  // 30-Year Compounding Projection Series (Invested Principal vs Total Capital Growth)
  const horizonYears = [5, 10, 15, 20, 25, 30];
  const compoundSeries = horizonYears.map(yr => {
    const investedVal = Math.round(currentInvestAmount * 12 * yr);
    const capitalVal = Math.round(currentInvestAmount * 12 * ((Math.pow(1 + annualReturn, yr) - 1) / annualReturn));
    const growthGain = Math.max(0, capitalVal - investedVal);
    const passiveMonthly = Math.round((capitalVal * 0.04) / 12);
    return {
      year: `${yr}y`,
      invested: investedVal,
      capital: capitalVal,
      growthGain: growthGain,
      passiveFlow: passiveMonthly
    };
  });

  const totalInvested30Yr = compoundSeries[compoundSeries.length - 1].invested;
  const terminalWealth30Yr = compoundSeries[compoundSeries.length - 1].capital;
  const compoundGain30Yr = compoundSeries[compoundSeries.length - 1].growthGain;

  const handleDirectInput = (field, value) => {
    const parsed = value === '' ? 0 : parseFloat(value);
    if (!isNaN(parsed) && parsed >= 0) {
      updateProfile({ [field]: parsed });
    }
  };

  const adjustCost = (field, currentVal, delta) => {
    const newVal = Math.max(0, currentVal + delta);
    updateProfile({ [field]: newVal });
  };

  // ==========================================
  // 1. MODE: INPUT (TYPING CASH FLOW DETAILS)
  // ==========================================
  if (mode === 'input') {
    return (
      <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* Inflow & Net Cash Flow Summary Banner */}
        <div style={{
          background: 'var(--bg-card-subtle)',
          padding: '12px 18px',
          borderRadius: '12px',
          border: '1px solid var(--border-architectural)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
              MONTHLY CASH FLOW BASELINE
            </span>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Net Inflow: <strong style={{ color: 'var(--text-primary)' }}>€{totalNetInflow.toLocaleString()} / mo</strong> &nbsp;|&nbsp; 
              Planned Outflows: <strong style={{ color: 'var(--text-primary)' }}>€{totalOutflow.toLocaleString()} / mo</strong> &nbsp;|&nbsp; 
              Surplus: <strong style={{ color: unallocatedSurplus >= 0 ? 'var(--accent-emerald)' : 'var(--accent-coral)' }}>€{unallocatedSurplus.toLocaleString()} / mo</strong>
            </div>
          </div>

          <span className="badge badge-brand" style={{ fontSize: '0.72rem' }}>
            {unallocatedSurplus >= 0 ? 'Surplus Available' : 'Deficit Warning'}
          </span>
        </div>

        {/* Typable Category Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
          
          {/* Housing */}
          <div style={{ background: 'var(--bg-card-subtle)', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border-architectural)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                <Home size={15} color="var(--maison-gold)" /> Rent &amp; Housing
              </span>
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border-architectural)', padding: '2px 8px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)', marginRight: '2px' }}>€</span>
                <input
                  type="number"
                  value={housing}
                  onChange={e => handleDirectInput('housing_cost', e.target.value)}
                  style={{ width: '60px', border: 'none', background: 'transparent', fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)', outline: 'none', textAlign: 'right' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button type="button" onClick={() => adjustCost('housing_cost', housing, -50)} style={{ padding: '3px 6px', borderRadius: '4px', border: '1px solid var(--border-architectural)', background: 'var(--bg-card)', cursor: 'pointer', color: 'var(--text-primary)' }}><Minus size={10} /></button>
              <input type="range" min="300" max="3000" step="50" value={housing} onChange={e => updateProfile({ housing_cost: parseFloat(e.target.value) })} style={{ flex: 1 }} />
              <button type="button" onClick={() => adjustCost('housing_cost', housing, 50)} style={{ padding: '3px 6px', borderRadius: '4px', border: '1px solid var(--border-architectural)', background: 'var(--bg-card)', cursor: 'pointer', color: 'var(--text-primary)' }}><Plus size={10} /></button>
            </div>
          </div>

          {/* Groceries */}
          <div style={{ background: 'var(--bg-card-subtle)', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border-architectural)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                <ShoppingCart size={15} color="var(--maison-gold)" /> Food &amp; Groceries
              </span>
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border-architectural)', padding: '2px 8px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)', marginRight: '2px' }}>€</span>
                <input
                  type="number"
                  value={groceries}
                  onChange={e => handleDirectInput('living_cost', e.target.value)}
                  style={{ width: '60px', border: 'none', background: 'transparent', fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)', outline: 'none', textAlign: 'right' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button type="button" onClick={() => adjustCost('living_cost', groceries, -25)} style={{ padding: '3px 6px', borderRadius: '4px', border: '1px solid var(--border-architectural)', background: 'var(--bg-card)', cursor: 'pointer', color: 'var(--text-primary)' }}><Minus size={10} /></button>
              <input type="range" min="150" max="1500" step="25" value={groceries} onChange={e => updateProfile({ living_cost: parseFloat(e.target.value) })} style={{ flex: 1 }} />
              <button type="button" onClick={() => adjustCost('living_cost', groceries, 25)} style={{ padding: '3px 6px', borderRadius: '4px', border: '1px solid var(--border-architectural)', background: 'var(--bg-card)', cursor: 'pointer', color: 'var(--text-primary)' }}><Plus size={10} /></button>
            </div>
          </div>

          {/* Mobility */}
          <div style={{ background: 'var(--bg-card-subtle)', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border-architectural)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                <Car size={15} color="var(--maison-gold)" /> Mobility &amp; Transit
              </span>
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border-architectural)', padding: '2px 8px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)', marginRight: '2px' }}>€</span>
                <input
                  type="number"
                  value={mobility}
                  onChange={e => handleDirectInput('mobility_cost', e.target.value)}
                  style={{ width: '60px', border: 'none', background: 'transparent', fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)', outline: 'none', textAlign: 'right' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button type="button" onClick={() => adjustCost('mobility_cost', mobility, -25)} style={{ padding: '3px 6px', borderRadius: '4px', border: '1px solid var(--border-architectural)', background: 'var(--bg-card)', cursor: 'pointer', color: 'var(--text-primary)' }}><Minus size={10} /></button>
              <input type="range" min="0" max="1000" step="25" value={mobility} onChange={e => updateProfile({ mobility_cost: parseFloat(e.target.value) })} style={{ flex: 1 }} />
              <button type="button" onClick={() => adjustCost('mobility_cost', mobility, 25)} style={{ padding: '3px 6px', borderRadius: '4px', border: '1px solid var(--border-architectural)', background: 'var(--bg-card)', cursor: 'pointer', color: 'var(--text-primary)' }}><Plus size={10} /></button>
            </div>
          </div>

          {/* Leisure */}
          <div style={{ background: 'var(--bg-card-subtle)', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border-architectural)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                <Coffee size={15} color="var(--maison-gold)" /> Leisure &amp; Dining
              </span>
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border-architectural)', padding: '2px 8px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)', marginRight: '2px' }}>€</span>
                <input
                  type="number"
                  value={leisure}
                  onChange={e => handleDirectInput('leisure_cost', e.target.value)}
                  style={{ width: '60px', border: 'none', background: 'transparent', fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)', outline: 'none', textAlign: 'right' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button type="button" onClick={() => adjustCost('leisure_cost', leisure, -25)} style={{ padding: '3px 6px', borderRadius: '4px', border: '1px solid var(--border-architectural)', background: 'var(--bg-card)', cursor: 'pointer', color: 'var(--text-primary)' }}><Minus size={10} /></button>
              <input type="range" min="50" max="1500" step="25" value={leisure} onChange={e => updateProfile({ leisure_cost: parseFloat(e.target.value) })} style={{ flex: 1 }} />
              <button type="button" onClick={() => adjustCost('leisure_cost', leisure, 25)} style={{ padding: '3px 6px', borderRadius: '4px', border: '1px solid var(--border-architectural)', background: 'var(--bg-card)', cursor: 'pointer', color: 'var(--text-primary)' }}><Plus size={10} /></button>
            </div>
          </div>

          {/* Subscriptions */}
          <div style={{ background: 'var(--bg-card-subtle)', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border-architectural)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                <Smartphone size={15} color="var(--maison-gold)" /> Digital &amp; Subscriptions
              </span>
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border-architectural)', padding: '2px 8px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)', marginRight: '2px' }}>€</span>
                <input
                  type="number"
                  value={subscriptions}
                  onChange={e => handleDirectInput('subscriptions_cost', e.target.value)}
                  style={{ width: '60px', border: 'none', background: 'transparent', fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)', outline: 'none', textAlign: 'right' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button type="button" onClick={() => adjustCost('subscriptions_cost', subscriptions, -10)} style={{ padding: '3px 6px', borderRadius: '4px', border: '1px solid var(--border-architectural)', background: 'var(--bg-card)', cursor: 'pointer', color: 'var(--text-primary)' }}><Minus size={10} /></button>
              <input type="range" min="0" max="400" step="10" value={subscriptions} onChange={e => updateProfile({ subscriptions_cost: parseFloat(e.target.value) })} style={{ flex: 1 }} />
              <button type="button" onClick={() => adjustCost('subscriptions_cost', subscriptions, 10)} style={{ padding: '3px 6px', borderRadius: '4px', border: '1px solid var(--border-architectural)', background: 'var(--bg-card)', cursor: 'pointer', color: 'var(--text-primary)' }}><Plus size={10} /></button>
            </div>
          </div>

          {/* Travel */}
          <div style={{ background: 'var(--bg-card-subtle)', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border-architectural)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                <Plane size={15} color="var(--maison-gold)" /> Travel &amp; Holidays
              </span>
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border-architectural)', padding: '2px 8px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)', marginRight: '2px' }}>€</span>
                <input
                  type="number"
                  value={travel}
                  onChange={e => handleDirectInput('travel_cost', e.target.value)}
                  style={{ width: '60px', border: 'none', background: 'transparent', fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)', outline: 'none', textAlign: 'right' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button type="button" onClick={() => adjustCost('travel_cost', travel, -25)} style={{ padding: '3px 6px', borderRadius: '4px', border: '1px solid var(--border-architectural)', background: 'var(--bg-card)', cursor: 'pointer', color: 'var(--text-primary)' }}><Minus size={10} /></button>
              <input type="range" min="0" max="1000" step="25" value={travel} onChange={e => updateProfile({ travel_cost: parseFloat(e.target.value) })} style={{ flex: 1 }} />
              <button type="button" onClick={() => adjustCost('travel_cost', travel, 25)} style={{ padding: '3px 6px', borderRadius: '4px', border: '1px solid var(--border-architectural)', background: 'var(--bg-card)', cursor: 'pointer', color: 'var(--text-primary)' }}><Plus size={10} /></button>
            </div>
          </div>

        </div>

      </div>
    );
  }

  // ==========================================
  // 2. MODE: OUTPUT (TALLER, GRAND, ANIMATED SUITE)
  // ==========================================
  return (
    <div className="animate-fade-in-up" style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', 
      gap: '24px', 
      alignItems: 'stretch',
      width: '100%'
    }}>
      
      {/* LEFT SUITE: Animated Donut & Free Surplus Spotlight */}
      <div style={{ 
        background: 'var(--bg-card)', 
        borderRadius: '18px', 
        border: '1px solid var(--border-architectural)', 
        padding: '24px 28px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '18px',
        boxShadow: 'var(--shadow-elevated)'
      }}>
        
        {/* 50/30/20 Benchmark Section Header */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              CAPITAL ALLOCATION RADAR
            </span>
            <span className="badge badge-brand" style={{ fontSize: '0.72rem', padding: '3px 9px' }}>
              Net: €{totalNetInflow.toLocaleString()} / mo
            </span>
          </div>

          <div style={{ display: 'flex', width: '100%', height: '8px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-architectural)' }}>
            <div style={{ width: `${needsRatio}%`, background: 'var(--maison-obsidian)', transition: 'width 0.9s var(--ease-luxury)' }} title={`Needs: ${needsRatio}%`} />
            <div style={{ width: `${wantsRatio}%`, background: 'var(--accent-ochre)', transition: 'width 0.9s var(--ease-luxury)' }} title={`Lifestyle: ${wantsRatio}%`} />
            <div style={{ width: `${wealthRatio}%`, background: 'var(--maison-gold)', transition: 'width 0.9s var(--ease-luxury)' }} title={`Surplus: ${wealthRatio}%`} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            <span>● Needs: <strong style={{ color: 'var(--text-primary)' }}>{needsRatio}%</strong></span>
            <span>● Lifestyle: <strong style={{ color: 'var(--accent-ochre)' }}>{wantsRatio}%</strong></span>
            <span>● Surplus: <strong style={{ color: 'var(--text-primary)' }}>{wealthRatio}%</strong></span>
          </div>
        </div>

        {/* Taller Animated Luxury Pie Circle & Category Pill List */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
          gap: '16px', 
          alignItems: 'center', 
          minHeight: '185px' 
        }}>
          {/* Animated Recharts Donut Pie Circle with Core Hub */}
          <div style={{ height: '180px', position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={allocationPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={74}
                  paddingAngle={3}
                  isAnimationActive={true}
                  animationDuration={1000}
                  animationEasing="ease-out"
                >
                  {allocationPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="var(--bg-card)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val) => [`€${Number(val).toLocaleString()} / mo`, 'Amount']} 
                  contentStyle={{ background: 'var(--bg-card)', color: 'var(--text-primary)', borderRadius: '8px', border: '1px solid var(--border-architectural)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Core Hub Readout */}
            <div style={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)', 
              textAlign: 'center', 
              pointerEvents: 'none' 
            }}>
              <div style={{ fontSize: '0.56rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>MONTHLY NET</div>
              <div className="tabular-nums" style={{ fontSize: '1.08rem', fontWeight: 800, color: 'var(--text-primary)' }}>€{totalNetInflow.toLocaleString()}</div>
            </div>
          </div>

          {/* Interactive Category List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {allocationPieData.map((item, idx) => (
              <div key={idx} className="hover-lift" style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                fontSize: '0.78rem', 
                padding: '6px 10px', 
                background: 'var(--bg-card-subtle)', 
                borderRadius: '8px', 
                border: '1px solid var(--border-architectural)' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: item.color }} />
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.name}</span>
                </div>
                <span className="tabular-nums" style={{ color: 'var(--text-primary)', fontWeight: 800 }}>€{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hero Free Wealth Surplus Card with Breathing Champagne Glow */}
        <div className="surplus-card-animated" style={{ 
          background: 'var(--bg-card-subtle)', 
          border: '1.5px solid var(--maison-gold)', 
          borderRadius: '14px', 
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              FREE MONTHLY WEALTH SURPLUS
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              100% unencumbered capital available for compounding
            </div>
          </div>
          <div className="tabular-nums" style={{ fontSize: '1.65rem', fontWeight: 800, color: unallocatedSurplus >= 0 ? 'var(--text-primary)' : 'var(--accent-coral)' }}>
            +€{Math.max(0, unallocatedSurplus).toLocaleString()} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>/ mo</span>
          </div>
        </div>

      </div>

      {/* RIGHT SUITE: Money Invested ➔ Capital Growth Multiplier Graph */}
      <div style={{ 
        background: 'var(--bg-card)', 
        borderRadius: '18px', 
        border: '1px solid var(--border-architectural)', 
        padding: '24px 28px', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'space-between',
        gap: '16px',
        boxShadow: 'var(--shadow-elevated)'
      }}>
        
        {/* Header: Floating AI Solvency Crest + Safeguard Metrics Inline */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="crest-float" style={{
              background: 'var(--maison-obsidian)',
              color: 'var(--maison-gold)',
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.45rem',
              fontWeight: 800,
              boxShadow: 'var(--shadow-elevated)',
              border: '1.5px solid var(--maison-gold-border)',
              flexShrink: 0
            }}>
              {aiGrade}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="live-beacon-pulse" style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent-emerald)', display: 'inline-block' }} />
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {aiVerdictTitle}
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '1px' }}>
                {aiVerdictShort}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ background: 'var(--bg-card-subtle)', padding: '6px 10px', borderRadius: '10px', border: '1px solid var(--border-architectural)', textAlign: 'right' }}>
              <div style={{ fontSize: '0.58rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>HOUSING BURDEN</div>
              <div className="tabular-nums" style={{ fontSize: '0.92rem', fontWeight: 800, color: housingRatio <= 35 ? 'var(--text-primary)' : 'var(--accent-ochre)' }}>{housingRatio}% of Net</div>
            </div>
            <div style={{ background: 'var(--bg-card-subtle)', padding: '6px 10px', borderRadius: '10px', border: '1px solid var(--border-architectural)', textAlign: 'right' }}>
              <div style={{ fontSize: '0.58rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>3-MO SAFETY</div>
              <div className="tabular-nums" style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>€{emergencyFundTarget.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Money Invested -> Capital Growth Multiplier Studio */}
        <div style={{ 
          background: 'var(--bg-card-subtle)', 
          padding: '16px 18px', 
          borderRadius: '14px', 
          border: '1px solid var(--border-architectural)', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '8px' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Coins size={15} color="var(--maison-gold)" />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                MONTHLY SURPLUS ALLOCATION
              </span>
            </div>
            <span style={{ background: 'var(--maison-obsidian)', color: 'var(--maison-gold)', padding: '3px 9px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 800 }}>
              €{currentInvestAmount.toLocaleString()}/mo ({Math.round((currentInvestAmount / (unallocatedSurplus || 1)) * 100)}% of Surplus)
            </span>
          </div>

          {/* Slider from €10 to Surplus value */}
          <input 
            type="range"
            min="10"
            max={maxInvestable}
            step={maxInvestable > 500 ? 10 : 5}
            value={currentInvestAmount}
            onChange={e => setMonthlyInvestAmount(parseInt(e.target.value))}
            style={{ width: '100%', height: '5px' }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.66rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
            <span>Min: €10 / mo</span>
            <span>Max: €{maxInvestable.toLocaleString()} / mo (100% Surplus)</span>
          </div>

          {/* Taller Multi-Layer Animated Recharts Area Graph */}
          <div style={{ height: '130px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={compoundSeries} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="growthGradGold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c5a059" stopOpacity={0.65}/>
                    <stop offset="95%" stopColor="#c5a059" stopOpacity={0.08}/>
                  </linearGradient>
                  <linearGradient id="investedGradSlate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#334155" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#334155" stopOpacity={0.02}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="year" stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
                <YAxis stroke="var(--text-secondary)" tickFormatter={(val) => `€${(val/1000).toFixed(0)}k`} fontSize={9} tickLine={false} />
                <Tooltip 
                  formatter={(val, name) => [
                    `€${Number(val).toLocaleString()}`, 
                    name === 'capital' ? 'Total Capital Growth' : 'Deposited Principal'
                  ]}
                  contentStyle={{ background: 'var(--bg-card)', color: 'var(--text-primary)', borderRadius: '8px', border: '1px solid var(--border-architectural)', fontSize: '0.76rem', boxShadow: 'var(--shadow-elevated)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="capital" 
                  name="capital"
                  stroke="#c5a059" 
                  strokeWidth={2.2} 
                  fill="url(#growthGradGold)" 
                  isAnimationActive={true} 
                  animationDuration={900}
                  animationEasing="ease-out"
                />
                <Area 
                  type="monotone" 
                  dataKey="invested" 
                  name="invested"
                  stroke="#94a3b8" 
                  strokeWidth={1.5} 
                  strokeDasharray="3 3" 
                  fill="url(#investedGradSlate)" 
                  isAnimationActive={true} 
                  animationDuration={900}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Money Invested -> Terminal Growth Breakdown Strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px', paddingTop: '4px', borderTop: '1px solid var(--border-architectural)' }}>
            <div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>INVESTED PRINCIPAL</div>
              <div className="tabular-nums" style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                €{totalInvested30Yr.toLocaleString()}
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>PURE MARKET GAIN</div>
              <div className="tabular-nums" style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                +€{compoundGain30Yr.toLocaleString()}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>30-YR TERMINAL CAPITAL</div>
              <div className="tabular-nums" style={{ fontSize: '1.22rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                €{terminalWealth30Yr.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
