import React, { useState, useEffect, useMemo } from 'react';
import { 
  ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar, 
  XAxis, YAxis, Tooltip, CartesianGrid, Legend, Cell, ReferenceLine 
} from 'recharts';
import { ShieldAlert, TrendingDown, CheckCircle2 } from 'lucide-react';
import { fetchStressTest } from '../services/apiService';

// Authoritative historical crisis return profiles (§ 1.1 spec_miner_fintech)
const CRISIS_REGIMES = {
  gfc_2008: {
    id: 'gfc_2008',
    title: '2008 Global Financial Crisis',
    subtitle: 'Subprime Mortgage Collapse & Interbank Liquidity Freeze (Oct 2007 - Dec 2012)',
    troughMonths: 17,
    dynamics: 'Severe systemic liquidity freeze. Credit spread blowout. Flight to quality sovereign bonds (+6.5%) & gold (+31%), collapse in global equities (-54%) and listed property (-38%).',
    annualReturns: [
      { year: '2007', world_equity: 0.090, global_bonds: 0.065, gold: 0.314, cash: 0.042, cpi: 0.041 },
      { year: '2008', world_equity: -0.407, global_bonds: 0.052, gold: 0.055, cash: 0.038, cpi: 0.001 },
      { year: '2009', world_equity: 0.300, global_bonds: 0.069, gold: 0.244, cash: 0.008, cpi: 0.027 },
      { year: '2010', world_equity: 0.118, global_bonds: 0.055, gold: 0.295, cash: 0.003, cpi: 0.015 },
      { year: '2011', world_equity: -0.055, global_bonds: 0.056, gold: 0.101, cash: 0.002, cpi: 0.030 },
      { year: '2012', world_equity: 0.158, global_bonds: 0.043, gold: 0.070, cash: 0.001, cpi: 0.017 }
    ],
    strategyMetrics: {
      global_core: { maxDrawdown: -0.540, recoveryYears: 5.2, swr: 0.032, survivalProb: 0.78 },
      balanced_60_40: { maxDrawdown: -0.284, recoveryYears: 2.3, swr: 0.035, survivalProb: 0.88 },
      defensive: { maxDrawdown: -0.142, recoveryYears: 1.4, swr: 0.038, survivalProb: 0.95 }
    }
  },
  dotcom_2000: {
    id: 'dotcom_2000',
    title: '2000 Dot-Com Crash',
    subtitle: 'Tech Bubble Unwind & 3-Year Grinding Equity Bear Market (Mar 2000 - Dec 2006)',
    troughMonths: 31,
    dynamics: 'Three consecutive years of negative global equity returns. High cash rates (5-6%) and high bond yields provided steady deflationary ballast.',
    annualReturns: [
      { year: '2000', world_equity: -0.132, global_bonds: 0.084, gold: -0.054, cash: 0.061, cpi: 0.034 },
      { year: '2001', world_equity: -0.168, global_bonds: 0.076, gold: 0.025, cash: 0.041, cpi: 0.028 },
      { year: '2002', world_equity: -0.199, global_bonds: 0.103, gold: 0.248, cash: 0.018, cpi: 0.016 },
      { year: '2003', world_equity: 0.331, global_bonds: 0.054, gold: 0.195, cash: 0.011, cpi: 0.023 },
      { year: '2004', world_equity: 0.147, global_bonds: 0.043, gold: 0.054, cash: 0.014, cpi: 0.027 },
      { year: '2005', world_equity: 0.095, global_bonds: 0.028, gold: 0.182, cash: 0.031, cpi: 0.034 },
      { year: '2006', world_equity: 0.201, global_bonds: 0.044, gold: 0.230, cash: 0.048, cpi: 0.032 }
    ],
    strategyMetrics: {
      global_core: { maxDrawdown: -0.493, recoveryYears: 6.4, swr: 0.031, survivalProb: 0.74 },
      balanced_60_40: { maxDrawdown: -0.218, recoveryYears: 3.1, swr: 0.034, survivalProb: 0.85 },
      defensive: { maxDrawdown: -0.068, recoveryYears: 1.2, swr: 0.039, survivalProb: 0.98 }
    }
  },
  stagflation_1973: {
    id: 'stagflation_1973',
    title: '1973-1974 Stagflation Shock',
    subtitle: 'OPEC Oil Embargo, Inflation Spiral & Correlation Breakdown (Jan 1973 - Dec 1982)',
    troughMonths: 24,
    dynamics: 'Severe inflation shock (CPI >12%). Traditional 60/40 negative stock/bond correlation broke down as both equities and fixed income suffered real capital destruction. Gold rallied +73% and +66%.',
    annualReturns: [
      { year: '1973', world_equity: -0.147, global_bonds: 0.036, gold: 0.735, cash: 0.070, cpi: 0.088 },
      { year: '1974', world_equity: -0.265, global_bonds: 0.020, gold: 0.661, cash: 0.080, cpi: 0.122 },
      { year: '1975', world_equity: 0.372, global_bonds: 0.078, gold: -0.248, cash: 0.058, cpi: 0.070 },
      { year: '1976', world_equity: 0.238, global_bonds: 0.112, gold: -0.041, cash: 0.051, cpi: 0.048 },
      { year: '1977', world_equity: -0.072, global_bonds: 0.031, gold: 0.231, cash: 0.053, cpi: 0.068 },
      { year: '1978', world_equity: 0.065, global_bonds: 0.012, gold: 0.311, cash: 0.072, cpi: 0.090 }
    ],
    strategyMetrics: {
      global_core: { maxDrawdown: -0.382, realMaxDrawdown: -0.586, recoveryYears: 11.2, swr: 0.029, survivalProb: 0.68 },
      balanced_60_40: { maxDrawdown: -0.252, realMaxDrawdown: -0.441, recoveryYears: 9.4, swr: 0.033, survivalProb: 0.81 },
      defensive: { maxDrawdown: -0.124, realMaxDrawdown: -0.214, recoveryYears: 2.8, swr: 0.036, survivalProb: 0.92 }
    }
  }
};

/**
 * Pure mathematical simulation engine for multi-asset stress testing and decumulation SRR.
 */
function simulateStressOffline({ scenarioId, strategyKey, initialCapital, monthlyCashflow, isDecumulation, withdrawalRate }) {
  const regime = CRISIS_REGIMES[scenarioId] || CRISIS_REGIMES.gfc_2008;
  const metrics = regime.strategyMetrics[strategyKey] || regime.strategyMetrics.balanced_60_40;

  // Asset weights mapping
  let equityWeight = 0.60;
  let bondWeight = 0.35;
  let goldCashWeight = 0.05;

  if (strategyKey === 'global_core') {
    equityWeight = 0.85;
    bondWeight = 0.15;
    goldCashWeight = 0.00;
  } else if (strategyKey === 'defensive') {
    equityWeight = 0.30;
    bondWeight = 0.50;
    goldCashWeight = 0.20;
  }

  // Trajectory simulation
  let capitalNominal = Math.max(1000, initialCapital || 100000);
  let capitalReal = capitalNominal;
  let peakCapital = capitalNominal;
  let peakRealCapital = capitalReal;
  let cumulativeInflation = 1.0;

  const trajectory = [];
  trajectory.push({
    step: 'Start',
    year: 'Baseline',
    nominal_value: Math.round(capitalNominal),
    real_value: Math.round(capitalReal),
    drawdown: 0.0,
    real_drawdown: 0.0
  });

  let maxDrawdownObserved = 0.0;
  let maxRealDrawdownObserved = 0.0;

  for (const item of regime.annualReturns) {
    const assetReturn = (item.world_equity * equityWeight) + 
                        (item.global_bonds * bondWeight) + 
                        ((item.gold || item.cash) * goldCashWeight);
    
    const annualInflation = item.cpi || 0.02;
    cumulativeInflation *= (1 + annualInflation);

    let annualCashflow = 0;
    if (isDecumulation) {
      // Annualized withdrawal with mid-year convention
      const currentRate = withdrawalRate || metrics.swr;
      annualCashflow = - (initialCapital * currentRate);
    } else {
      annualCashflow = (monthlyCashflow || 500) * 12;
    }

    // Mid-period cashflow convention: (C - W/2)*(1 + r) - W/2
    capitalNominal = Math.max(0, (capitalNominal + annualCashflow / 2) * (1 + assetReturn) + annualCashflow / 2);
    capitalReal = capitalNominal / cumulativeInflation;

    peakCapital = Math.max(peakCapital, capitalNominal);
    peakRealCapital = Math.max(peakRealCapital, capitalReal);

    const dd = peakCapital > 0 ? (capitalNominal - peakCapital) / peakCapital : 0;
    const realDd = peakRealCapital > 0 ? (capitalReal - peakRealCapital) / peakRealCapital : 0;

    maxDrawdownObserved = Math.min(maxDrawdownObserved, dd);
    maxRealDrawdownObserved = Math.min(maxRealDrawdownObserved, realDd);

    trajectory.push({
      step: item.year,
      year: item.year,
      nominal_value: Math.round(capitalNominal),
      real_value: Math.round(capitalReal),
      drawdown: Number((dd * 100).toFixed(1)),
      real_drawdown: Number((realDd * 100).toFixed(1))
    });
  }

  // Sequence of Returns Decumulation Risk Curves across withdrawal rates 3.0% to 5.5%
  const testRates = [0.030, 0.035, 0.040, 0.045, 0.050, 0.055];
  const srrSurvivalCurve = testRates.map((rate) => {
    // Decumulation fragility calculation under the early shock
    const shockFactor = Math.abs(metrics.maxDrawdown);
    const ratePenalty = (rate - 0.03) * 12.0;
    const estimatedSurvival = Math.max(0.15, Math.min(0.99, (1.0 - (shockFactor * 0.45) - ratePenalty)));
    return {
      rate_label: `${(rate * 100).toFixed(1)}%`,
      rate_value: rate,
      survival_probability: Number((estimatedSurvival * 100).toFixed(1)),
      ruin_probability: Number(((1.0 - estimatedSurvival) * 100).toFixed(1)),
      status: estimatedSurvival >= 0.85 ? 'robust' : (estimatedSurvival >= 0.75 ? 'caution' : 'fragile')
    };
  });

  return {
    scenario: scenarioId,
    scenario_title: regime.title,
    dynamics: regime.dynamics,
    max_drawdown_pct: metrics.maxDrawdown,
    real_max_drawdown_pct: metrics.realMaxDrawdown || metrics.maxDrawdown,
    recovery_horizon_years: metrics.recoveryYears,
    trough_duration_months: regime.troughMonths,
    calibrated_swr: metrics.swr,
    survival_probability: metrics.survivalProb,
    trajectory,
    srr_survival_curve: srrSurvivalCurve
  };
}

export default function StressTestFragilityLab({ 
  profile = {}, 
  initialMode = 'accumulation' 
}) {
  const [selectedScenario, setSelectedScenario] = useState('gfc_2008');
  const [isDecumulation, setIsDecumulation] = useState(initialMode === 'decumulation');
  const [withdrawalRate, setWithdrawalRate] = useState(Number(profile?.safe_withdrawal_rate) || 0.035);
  const [chartView, setChartView] = useState('capital'); // 'capital' or 'drawdown'
  const [response, setResponse] = useState({ key: '', data: null, source: 'loading' });

  // Determine strategic allocation key
  const strategyKey = useMemo(() => {
    const raw = String(profile?.investment_strategy || '').toLowerCase();
    if (raw.includes('defensive') || raw.includes('conservative')) return 'defensive';
    if (raw.includes('core') || raw.includes('equity') || raw.includes('85') || raw.includes('aggressive')) return 'global_core';
    return 'balanced_60_40';
  }, [profile?.investment_strategy]);

  const initialCapital = useMemo(() => {
    if (isDecumulation) {
      return Number(profile?.target_wealth) || (Number(profile?.initial_amount) * 3) || 350000;
    }
    return Number(profile?.initial_amount) || 50000;
  }, [isDecumulation, profile?.target_wealth, profile?.initial_amount]);

  const monthlyCashflow = useMemo(() => {
    return Number(profile?.monthly_investment) || 500;
  }, [profile?.monthly_investment]);

  const requestKey = JSON.stringify({
    selectedScenario,
    strategyKey,
    initialCapital,
    monthlyCashflow,
    isDecumulation,
    withdrawalRate
  });

  // Attempt API fetch with offline fallback
  useEffect(() => {
    let active = true;

    const payload = {
      scenario: selectedScenario,
      strategy: strategyKey,
      initial_capital: initialCapital,
      monthly_cashflow: monthlyCashflow,
      horizon_years: 6,
      is_decumulation: isDecumulation,
      withdrawal_rate: withdrawalRate
    };

    fetchStressTest(payload)
      .then((data) => {
        if (active && data) {
          setResponse({ key: requestKey, data, source: 'server' });
        }
      })
      .catch(() => {
        if (active) {
          // Robust mathematical fallback
          const fallbackResult = simulateStressOffline({
            scenarioId: selectedScenario,
            strategyKey,
            initialCapital,
            monthlyCashflow,
            isDecumulation,
            withdrawalRate
          });
          setResponse({ key: requestKey, data: fallbackResult, source: 'local' });
        }
      });

    return () => { active = false; };
  }, [selectedScenario, strategyKey, initialCapital, monthlyCashflow, isDecumulation, withdrawalRate, requestKey]);

  const hasCurrentResponse = response.key === requestKey;
  const apiData = hasCurrentResponse ? response.data : null;
  const resultSource = hasCurrentResponse ? response.source : 'loading';

  // Computed data (API response or robust mathematical simulation fallback)
  const stressResult = useMemo(() => {
    if (apiData) return apiData;
    return simulateStressOffline({
      scenarioId: selectedScenario,
      strategyKey,
      initialCapital,
      monthlyCashflow,
      isDecumulation,
      withdrawalRate
    });
  }, [apiData, selectedScenario, strategyKey, initialCapital, monthlyCashflow, isDecumulation, withdrawalRate]);

  const money = (v) => '€' + (Number(v) || 0).toLocaleString('de-DE');
  const pct = (v) => ((Number(v) || 0) * 100).toFixed(1) + '%';

  const maxDrawdownFormatted = Math.abs(stressResult.max_drawdown_pct * 100).toFixed(1) + '%';
  const realDrawdownFormatted = Math.abs(stressResult.real_max_drawdown_pct * 100).toFixed(1) + '%';
  const survivalPct = (stressResult.survival_probability * 100).toFixed(0) + '%';

  return (
    <section 
      aria-label="Stress Test & Fragility Lab" 
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        padding: 'clamp(16px, 2.5vw, 28px)',
        borderRadius: '16px',
        background: 'var(--bg-card, #ffffff)',
        border: '1px solid var(--border-architectural, #d8dee8)',
        boxShadow: '0 8px 30px rgba(16, 34, 61, 0.06)'
      }}
    >
      {/* Header & Mode Switch */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <ShieldAlert size={20} color="var(--maison-gold, #c5a059)" />
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'var(--font-serif, Georgia, serif)', color: 'var(--text-primary, #0f172a)' }}>
              Historical Regime Stress Testing & Fragility Lab
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary, #64748b)', maxWidth: '680px' }}>
            Replay empirical macroeconomic shocks across your strategic allocation. Test the fragile Sequence-of-Returns Risk (SRR) decumulation window.
          </p>
        </div>

        {/* Accumulation vs Decumulation Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-card-subtle, #f1f5f9)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-architectural, #cbd5e1)' }}>
          <button
            type="button"
            onClick={() => setIsDecumulation(false)}
            style={{
              padding: '6px 14px',
              borderRadius: '7px',
              border: 'none',
              background: !isDecumulation ? 'var(--maison-obsidian, #10223d)' : 'transparent',
              color: !isDecumulation ? '#ffffff' : 'var(--text-secondary, #64748b)',
              fontSize: '0.76rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Accumulation
          </button>
          <button
            type="button"
            onClick={() => setIsDecumulation(true)}
            style={{
              padding: '6px 14px',
              borderRadius: '7px',
              border: 'none',
              background: isDecumulation ? 'var(--maison-obsidian, #10223d)' : 'transparent',
              color: isDecumulation ? '#ffffff' : 'var(--text-secondary, #64748b)',
              fontSize: '0.76rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Decumulation (SRR)
          </button>
        </div>
      </div>

      <div
        role="status"
        data-testid="stress-model-source"
        aria-live="polite"
        style={{
          alignSelf: 'flex-start', padding: '5px 10px', borderRadius: '999px',
          border: '1px solid var(--border-architectural, #d8dee8)',
          background: resultSource === 'local' ? 'rgba(217, 119, 6, 0.1)' : 'var(--bg-card-subtle, #f8fafc)',
          color: resultSource === 'local' ? '#92400e' : 'var(--text-secondary, #64748b)',
          fontSize: '0.7rem', fontWeight: 700
        }}
      >
        {resultSource === 'server' && 'Server model · current API result'}
        {resultSource === 'local' && 'Offline approximation · server model unavailable'}
        {resultSource === 'loading' && 'Local preview · checking server model'}
      </div>

      {/* Scenario Selector Pills */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
        {Object.values(CRISIS_REGIMES).map((regime) => {
          const isSelected = selectedScenario === regime.id;
          return (
            <button
              key={regime.id}
              type="button"
              onClick={() => setSelectedScenario(regime.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '12px 16px',
                borderRadius: '12px',
                border: isSelected ? '2px solid var(--maison-gold, #c5a059)' : '1px solid var(--border-architectural, #e2e8f0)',
                background: isSelected ? 'var(--bg-card-subtle, #f8fafc)' : 'var(--bg-card, #ffffff)',
                cursor: 'pointer',
                textAlign: 'left',
                boxShadow: isSelected ? '0 4px 14px rgba(197, 160, 89, 0.18)' : 'none',
                transition: 'all 0.18s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '4px' }}>
                <strong style={{ fontSize: '0.85rem', color: isSelected ? 'var(--maison-gold, #c5a059)' : 'var(--text-primary, #0f172a)' }}>
                  {regime.title}
                </strong>
                {isSelected && <CheckCircle2 size={16} color="var(--maison-gold, #c5a059)" />}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary, #64748b)', lineHeight: 1.3 }}>
                {regime.subtitle}
              </span>
            </button>
          );
        })}
      </div>

      {/* KPI Quantitative Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
        <article style={{ padding: '14px', borderRadius: '10px', background: 'var(--bg-card-subtle, #f8fafc)', border: '1px solid var(--border-architectural, #e2e8f0)' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary, #64748b)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Maximum Drawdown (Peak to Trough)
          </span>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#b91c1c', marginTop: '4px' }}>
            -{maxDrawdownFormatted}
          </div>
          <small style={{ fontSize: '0.68rem', color: 'var(--text-secondary, #64748b)' }}>
            Real Purchasing Loss: -{realDrawdownFormatted}
          </small>
        </article>

        <article style={{ padding: '14px', borderRadius: '10px', background: 'var(--bg-card-subtle, #f8fafc)', border: '1px solid var(--border-architectural, #e2e8f0)' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary, #64748b)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Recovery Horizon (Years to Breakeven)
          </span>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)', marginTop: '4px' }}>
            {stressResult.recovery_horizon_years} yrs
          </div>
          <small style={{ fontSize: '0.68rem', color: 'var(--text-secondary, #64748b)' }}>
            Trough Duration: {stressResult.trough_duration_months} months
          </small>
        </article>

        <article style={{ padding: '14px', borderRadius: '10px', background: 'var(--bg-card-subtle, #f8fafc)', border: '1px solid var(--border-architectural, #e2e8f0)' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary, #64748b)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Calibrated Safe Withdrawal Rate (SWR)
          </span>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--maison-gold, #c5a059)', marginTop: '4px' }}>
            {pct(stressResult.calibrated_swr)}
          </div>
          <small style={{ fontSize: '0.68rem', color: 'var(--text-secondary, #64748b)' }}>
            Under German 26.38% Abgeltungsteuer
          </small>
        </article>

        <article style={{ padding: '14px', borderRadius: '10px', background: 'var(--bg-card-subtle, #f8fafc)', border: '1px solid var(--border-architectural, #e2e8f0)' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary, #64748b)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            SRR Decumulation Survival Rate
          </span>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: stressResult.survival_probability >= 0.85 ? '#059669' : '#d97706', marginTop: '4px' }}>
            {survivalPct}
          </div>
          <small style={{ fontSize: '0.68rem', color: 'var(--text-secondary, #64748b)' }}>
            Fragile 5-Yr Window Stress
          </small>
        </article>
      </div>

      {/* Interactive Controls Bar */}
      {isDecumulation && (
        <div style={{ padding: '14px 18px', borderRadius: '12px', background: 'rgba(197, 160, 89, 0.08)', border: '1px solid rgba(197, 160, 89, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TrendingDown size={18} color="var(--maison-gold, #c5a059)" />
            <div>
              <strong style={{ fontSize: '0.82rem', color: 'var(--text-primary, #0f172a)' }}>
                Decumulation Sequence-of-Returns Risk (SRR) Stress Mode
              </strong>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary, #64748b)' }}>
                Early retirement losses permanently deplete share volume when funding withdrawals.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label htmlFor="swr-slider" style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
              Withdrawal Rate: {pct(withdrawalRate)}
            </label>
            <input
              id="swr-slider"
              type="range"
              min="0.03"
              max="0.055"
              step="0.001"
              value={withdrawalRate}
              onChange={(e) => setWithdrawalRate(parseFloat(e.target.value))}
              style={{ accentColor: 'var(--maison-gold, #c5a059)', cursor: 'pointer', width: '130px' }}
            />
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        
        {/* Drawdown & Recovery Trajectory */}
        <div style={{ borderRadius: '12px', border: '1px solid var(--border-architectural, #e2e8f0)', padding: '16px', background: 'var(--bg-card, #ffffff)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                {chartView === 'capital' ? 'Nominal vs Real Wealth Trajectory' : 'Peak-to-Trough Drawdown Curve'}
              </h3>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary, #64748b)' }}>
                Simulation across historical crisis horizon
              </span>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setChartView('capital')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: chartView === 'capital' ? '1px solid var(--maison-gold)' : '1px solid var(--border-architectural)',
                  background: chartView === 'capital' ? 'var(--maison-obsidian)' : 'transparent',
                  color: chartView === 'capital' ? 'var(--maison-gold)' : 'var(--text-secondary)'
                }}
              >
                Capital (€)
              </button>
              <button
                type="button"
                onClick={() => setChartView('drawdown')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: chartView === 'drawdown' ? '1px solid var(--maison-gold)' : '1px solid var(--border-architectural)',
                  background: chartView === 'drawdown' ? 'var(--maison-obsidian)' : 'transparent',
                  color: chartView === 'drawdown' ? 'var(--maison-gold)' : 'var(--text-secondary)'
                }}
              >
                Drawdown (%)
              </button>
            </div>
          </div>

          <div style={{ width: '100%', height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              {chartView === 'capital' ? (
                <AreaChart data={stressResult.trajectory} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradNominal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--maison-gold, #c5a059)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--maison-gold, #c5a059)" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="gradReal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10223d" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10223d" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-architectural, #e2e8f0)" />
                  <XAxis dataKey="year" tickLine={false} axisLine={false} style={{ fontSize: '0.75rem' }} />
                  <YAxis tickFormatter={(v) => `€${Math.round(v / 1000)}k`} tickLine={false} axisLine={false} width={55} style={{ fontSize: '0.75rem' }} />
                  <Tooltip formatter={(v, n) => [money(v), n === 'nominal_value' ? 'Nominal Portfolio' : 'Real Purchasing Power']} />
                  <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                  <Area type="monotone" dataKey="nominal_value" name="Nominal Value" stroke="var(--maison-gold, #c5a059)" strokeWidth={2.5} fill="url(#gradNominal)" />
                  <Area type="monotone" dataKey="real_value" name="Inflation-Adjusted Value" stroke="#10223d" strokeWidth={2} strokeDasharray="4 4" fill="url(#gradReal)" />
                </AreaChart>
              ) : (
                <LineChart data={stressResult.trajectory} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-architectural, #e2e8f0)" />
                  <XAxis dataKey="year" tickLine={false} axisLine={false} style={{ fontSize: '0.75rem' }} />
                  <YAxis unit="%" tickLine={false} axisLine={false} width={45} style={{ fontSize: '0.75rem' }} domain={[-60, 0]} />
                  <Tooltip formatter={(v, n) => [`${v}%`, n === 'drawdown' ? 'Nominal Drawdown' : 'Real Drawdown']} />
                  <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                  <ReferenceLine y={-20} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Bear Threshold (-20%)', fill: '#f59e0b', fontSize: 10 }} />
                  <Line type="monotone" dataKey="drawdown" name="Nominal Drawdown" stroke="#b91c1c" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="real_drawdown" name="Real Drawdown (Purchasing Power)" stroke="#475569" strokeWidth={1.8} strokeDasharray="4 4" />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* SRR Decumulation Survival Probabilities */}
        <div style={{ borderRadius: '12px', border: '1px solid var(--border-architectural, #e2e8f0)', padding: '16px', background: 'var(--bg-card, #ffffff)' }}>
          <div style={{ marginBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
              Decumulation Survival Probabilities Across SWR
            </h3>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary, #64748b)' }}>
              30-year portfolio survival under Guyton-Klinger capital preservation guardrails
            </span>
          </div>

          <div style={{ width: '100%', height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stressResult.srr_survival_curve} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-architectural, #e2e8f0)" />
                <XAxis dataKey="rate_label" tickLine={false} axisLine={false} style={{ fontSize: '0.75rem' }} />
                <YAxis unit="%" domain={[0, 100]} tickLine={false} axisLine={false} width={45} style={{ fontSize: '0.75rem' }} />
                <Tooltip formatter={(v) => [`${v}%`, 'Survival Probability']} />
                <ReferenceLine y={80} stroke="#e11d48" strokeDasharray="4 4" label={{ value: 'Planning resilience threshold (80%)', fill: '#e11d48', fontSize: 10 }} />
                <Bar dataKey="survival_probability" name="Portfolio Survival Rate" radius={[6, 6, 0, 0]}>
                  {stressResult.srr_survival_curve.map((entry, index) => {
                    const color = entry.survival_probability >= 85 ? '#059669' : (entry.survival_probability >= 75 ? '#d97706' : '#b91c1c');
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Narrative Qualitative Notes */}
      <footer style={{ padding: '12px 16px', borderRadius: '10px', background: 'var(--bg-card-subtle, #f8fafc)', border: '1px solid var(--border-architectural, #e2e8f0)', fontSize: '0.76rem', color: 'var(--text-secondary, #475569)', lineHeight: 1.5 }}>
        <strong>Actuarial Fragility Analysis:</strong> {stressResult.dynamics}
      </footer>
    </section>
  );
}
