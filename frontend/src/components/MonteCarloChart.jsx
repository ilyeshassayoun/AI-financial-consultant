import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Sparkles } from 'lucide-react';

export default function MonteCarloChart({ investmentData, years }) {
  const [visibleBands, setVisibleBands] = useState({
    p90: true,
    p50: true,
    p10: true,
    contributions: true
  });

  if (!investmentData || !investmentData.fan_chart_series) {
    return null;
  }

  const { fan_chart_series, cost_drag_analysis, safe_withdrawal, projected_p50, projected_p90, max_drawdown_pct } = investmentData;

  const toggleBand = (band) => {
    setVisibleBands(prev => ({ ...prev, [band]: !prev[band] }));
  };

  return (
    <div className="solid-card animate-fade-in-up" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header & Scenario Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={22} color="var(--maison-gold)" />
            <h4 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)', fontWeight: 800 }}>
              Monte Carlo Stochastic Wealth Fan Chart (1,000 Draws)
            </h4>
          </div>
          <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Simulating {years}-year geometric Brownian motion with correlated multi-asset dynamics.
          </p>
        </div>

        {/* Toggleable Band Pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => toggleBand('p90')}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-architectural)',
              background: visibleBands.p90 ? 'var(--bg-card-subtle)' : 'transparent',
              color: visibleBands.p90 ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            ● P90 Bull (Top 10%)
          </button>
          <button
            type="button"
            onClick={() => toggleBand('p50')}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              border: '1px solid var(--maison-gold)',
              background: visibleBands.p50 ? 'var(--maison-obsidian)' : 'transparent',
              color: visibleBands.p50 ? '#ffffff' : 'var(--text-muted)',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            ● P50 Median Base
          </button>
          <button
            type="button"
            onClick={() => toggleBand('p10')}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-architectural)',
              background: visibleBands.p10 ? 'var(--bg-card-subtle)' : 'transparent',
              color: visibleBands.p10 ? 'var(--accent-coral)' : 'var(--text-muted)',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            ● P10 Bear Floor
          </button>
        </div>
      </div>

      {/* Main Multi-Band Interactive Recharts Area */}
      <div style={{ height: '240px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={fan_chart_series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="p90Grad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--maison-gold)" stopOpacity={0.5}/>
                <stop offset="95%" stopColor="var(--maison-gold)" stopOpacity={0.05}/>
              </linearGradient>
              <linearGradient id="p50Grad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--maison-obsidian)" stopOpacity={0.6}/>
                <stop offset="95%" stopColor="var(--maison-obsidian)" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="p10Grad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent-coral)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--accent-coral)" stopOpacity={0.02}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="year" stroke="var(--text-secondary)" fontSize={11} />
            <YAxis stroke="var(--text-secondary)" tickFormatter={(val) => `€${(val/1000).toFixed(0)}k`} fontSize={11} />
            <Tooltip 
              formatter={(val, name) => [`€${Number(val).toLocaleString()}`, name]}
              contentStyle={{ background: 'var(--bg-card)', color: 'var(--text-primary)', borderRadius: '8px', border: '1px solid var(--border-architectural)', fontSize: '0.82rem' }}
            />
            {visibleBands.p90 && (
              <Area type="monotone" dataKey="p90_bull" stroke="var(--maison-gold)" strokeWidth={2} fill="url(#p90Grad2)" name="P90 (Bull Market)" isAnimationActive={false} />
            )}
            {visibleBands.p50 && (
              <Area type="monotone" dataKey="p50_median" stroke="var(--text-primary)" strokeWidth={3} fill="url(#p50Grad2)" name="P50 (Median Base)" isAnimationActive={false} />
            )}
            {visibleBands.p10 && (
              <Area type="monotone" dataKey="p10_bear" stroke="var(--accent-coral)" strokeWidth={1.5} strokeDasharray="3 3" fill="url(#p10Grad2)" name="P10 (Bear Floor)" isAnimationActive={false} />
            )}
            {visibleBands.contributions && (
              <Area type="monotone" dataKey="contributions" stroke="var(--text-secondary)" strokeWidth={1.5} fill="var(--bg-card-subtle)" name="Your Capital Principal" isAnimationActive={false} />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Numerical Metrics Summary Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
        <div style={{ background: 'var(--bg-card-subtle)', padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--border-architectural)' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase' }}>P50 MEDIAN NEST EGG</div>
          <div className="tabular-nums" style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
            €{Math.round(projected_p50).toLocaleString()}
          </div>
        </div>

        <div style={{ background: 'var(--bg-card-subtle)', padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--border-architectural)' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>P90 BULL TOP TIER</div>
          <div className="tabular-nums" style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
            €{Math.round(projected_p90).toLocaleString()}
          </div>
        </div>

        <div style={{ background: 'var(--bg-card-subtle)', padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--border-architectural)' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>4% SAFE ANNUITY (SWR)</div>
          <div className="tabular-nums" style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
            €{Math.round(safe_withdrawal?.rule_4_percent_monthly || 0).toLocaleString()}/mo
          </div>
        </div>

        <div style={{ background: 'var(--bg-card-subtle)', padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--border-architectural)' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>MAX HISTORIC DRAWDOWN</div>
          <div className="tabular-nums" style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-coral)', marginTop: '2px' }}>
            -{max_drawdown_pct?.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Active vs. Passive Mutual Fund Fee Drag Callout */}
      {cost_drag_analysis && (
        <div style={{ background: 'var(--bg-card-subtle)', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-architectural)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={16} color="var(--maison-gold)" />
              <span style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                Active Fund Fee Drag Elimination (TER 0.18% vs. 1.85%)
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Consolidating bank mutual funds into institutional ETFs shields your capital from excessive management fees.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>NET COMPOUND WEALTH SAVED</span>
            <div className="tabular-nums" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
              +€{Math.round(cost_drag_analysis.total_fee_wealth_lost).toLocaleString()}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
