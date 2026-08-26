import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Target, Zap } from 'lucide-react';

export default function RetirementGapChart({ retirementData, onApplySavingsPatch }) {
  const [simulatedExtraSavings, setSimulatedExtraSavings] = useState(0);
  if (!retirementData) return null;

  const {
    state_pension_monthly,
    bav_pension_monthly,
    private_pension_monthly,
    total_retirement_income_monthly,
    target_retirement_income_monthly,
    entgeltpunkte_total,
    required_monthly_savings_to_close_gap
  } = retirementData;

  const extraYieldMonthly = Math.round((simulatedExtraSavings * 12 * 20 * 2.1 * 0.04) / 12);
  const adjustedTotal = total_retirement_income_monthly + extraYieldMonthly;
  const adjustedGap = Math.max(0, target_retirement_income_monthly - adjustedTotal);
  const adjustedRatio = Math.min(100, Math.round((adjustedTotal / (target_retirement_income_monthly || 1)) * 100));

  const chartData = [
    { name: 'Target Need', amount: Math.round(target_retirement_income_monthly), color: '#334155' },
    { name: '1st: DRV State', amount: Math.round(state_pension_monthly), color: '#0f172a' },
    { name: '2nd: bAV Pillar', amount: Math.round(bav_pension_monthly), color: '#64748b' },
    { name: '3rd: Private ETF', amount: Math.round(private_pension_monthly + extraYieldMonthly), color: '#c5a059' },
    { name: 'Rentenlücke Gap', amount: Math.round(adjustedGap), color: adjustedGap > 0 ? '#ef4444' : '#10b981' }
  ];

  return (
    <div className="solid-card animate-fade-in-up" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={22} color="var(--maison-gold)" />
            <h4 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)', fontWeight: 800 }}>
              Actuarial 3-Pillar DRV Solvency &amp; Rentenlücke Gap Analyzer
            </h4>
          </div>
          <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Accumulated {entgeltpunkte_total} Entgeltpunkte. Net pension calculated after KVdR (~11.5%) and tax.
          </p>
        </div>

        <div style={{ background: 'var(--bg-card-subtle)', padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--border-architectural)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)' }}>Replacement Ratio:</span>
          <span className="tabular-nums" style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{adjustedRatio}%</span>
        </div>
      </div>

      {/* Recharts Bar Graph */}
      <div style={{ height: '200px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={11} />
            <YAxis stroke="var(--text-secondary)" tickFormatter={(val) => `€${val}`} fontSize={11} />
            <Tooltip 
              formatter={(val) => [`€${Number(val).toLocaleString()}/mo`, 'Amount']}
              contentStyle={{ background: 'var(--bg-card)', color: 'var(--text-primary)', borderRadius: '8px', border: '1px solid var(--border-architectural)', fontSize: '0.82rem' }}
            />
            <Bar dataKey="amount" radius={[6, 6, 0, 0]} isAnimationActive={false}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Interactive Gap-Closing Simulation Slider */}
      <div style={{ background: 'var(--bg-card-subtle)', padding: '18px 20px', borderRadius: '12px', border: '1px solid var(--border-architectural)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={16} color="var(--maison-gold)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Simulate Closing Rentenlücke with Additional ETF Savings
            </span>
          </div>
          <span className="tabular-nums" style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.1rem' }}>
            +€{simulatedExtraSavings}/month
          </span>
        </div>

        <input 
          type="range"
          min="0"
          max="1000"
          step="50"
          value={simulatedExtraSavings}
          onChange={e => setSimulatedExtraSavings(parseInt(e.target.value))}
          style={{ width: '100%' }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Remaining Net Gap: <strong className="tabular-nums" style={{ color: adjustedGap > 0 ? 'var(--accent-coral)' : 'var(--accent-emerald)' }}>€{Math.round(adjustedGap).toLocaleString()}/mo</strong>
          </div>

          {required_monthly_savings_to_close_gap > 0 && onApplySavingsPatch && (
            <button
              type="button"
              onClick={() => onApplySavingsPatch(required_monthly_savings_to_close_gap)}
              className="btn-brand"
              style={{ fontSize: '0.75rem', padding: '6px 14px' }}
            >
              <Zap size={12} /> Auto-Bridge 100% (+€{Math.round(required_monthly_savings_to_close_gap)}/mo)
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
