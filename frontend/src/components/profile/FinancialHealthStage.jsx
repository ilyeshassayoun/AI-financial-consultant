import React from 'react';
import { Sparkles, Wallet, TrendingUp, Landmark, ShieldCheck, Layers } from 'lucide-react';

export default function FinancialHealthStage({ analysis }) {
  const advisoryPlan = analysis?.advisory_plan;
  const scoreComponents = advisoryPlan?.score_components || {};
  const householdKpis = advisoryPlan?.household_kpis || {};
  const protectionNeeds = advisoryPlan?.protection_needs || {};

  const score = Number.isFinite(advisoryPlan?.financial_resilience_score)
    ? advisoryPlan.financial_resilience_score
    : null;

  const componentScore = (key) => Number.isFinite(scoreComponents[key])
    ? Math.round(Math.max(0, Math.min(20, scoreComponents[key])) * 5)
    : null;

  const statusFor = (value) => {
    if (value === null) return { label: 'Analysis pending', color: 'var(--text-muted)' };
    if (value >= 80) return { label: 'On track', color: 'var(--accent-emerald)' };
    if (value >= 55) return { label: 'Review', color: 'var(--accent-ochre)' };
    return { label: 'Action needed', color: 'var(--accent-coral)' };
  };
  const targetStatus = (ratio) => {
    if (!Number.isFinite(ratio)) return { label: 'Analysis pending', color: 'var(--text-muted)' };
    if (ratio >= 1) return { label: 'On track', color: 'var(--accent-emerald)' };
    if (ratio >= .75) return { label: 'Review', color: 'var(--accent-ochre)' };
    return { label: 'Action needed', color: 'var(--accent-coral)' };
  };

  const money = (value) => `€${Math.round(Number(value) || 0).toLocaleString()}`;
  const reserveMonths = Number(householdKpis.emergency_fund_months) || 0;
  const reserveTarget = Number(householdKpis.emergency_fund_target) || 0;
  const savingsRate = Number(householdKpis.savings_rate) || 0;
  const debtServiceRatio = Number(householdKpis.debt_service_ratio) || 0;
  const buTarget = Number(protectionNeeds.bu_target_monthly) || 0;
  const buGap = Number(protectionNeeds.bu_gap_monthly) || 0;
  const retirementFunding = Number(householdKpis.retirement_funding_ratio) || 0;
  const investmentMedian = Number(analysis?.investment_lab?.selected?.p50);
  const potentialTaxSavings = Number(analysis?.optimization?.summary?.total_potential_tax_savings);
  const priorityAction = advisoryPlan?.action_plan?.[0];
  const hasAdequateBU = componentScore('protection') !== null && buGap <= 50;
  const priorityOne = advisoryPlan?.action_plan?.find((item) => item.priority === 1);
  const foundationReady = advisoryPlan?.plan_feasible === true && !priorityOne;

  const pillarAudits = [
    {
      pillar: 'Emergency liquidity',
      citation: 'Liquid reserve / target reserve',
      desc: `The model compares liquid savings with a household-specific reserve target of ${money(reserveTarget)}.`,
      score: componentScore('liquidity'),
      benchmark: 'Target: required reserve fully funded',
      icon: Wallet,
      highlight: `${reserveMonths.toFixed(1)} months funded`,
      ...targetStatus(componentScore('liquidity') === null ? NaN : componentScore('liquidity') / 100),
    },
    {
      pillar: 'Cash-flow capacity',
      citation: 'Net income less household commitments',
      desc: 'Available monthly capacity is measured after essential costs, discretionary costs and debt service.',
      score: componentScore('cash_flow'),
      benchmark: 'Model target: 20% savings capacity',
      icon: TrendingUp,
      highlight: `${(savingsRate * 100).toFixed(1)}% savings capacity`,
      ...(householdKpis.current_plan_feasible === false
        ? { label: 'Action needed', color: 'var(--accent-coral)' }
        : statusFor(componentScore('cash_flow'))),
    },
    {
      pillar: 'Debt resilience',
      citation: 'Debt service / net household income',
      desc: 'Debt payments reduce the capacity available for protection, reserves and long-term investing.',
      score: componentScore('debt'),
      benchmark: 'Model ceiling: 25% debt-service ratio',
      icon: Landmark,
      highlight: `${(debtServiceRatio * 100).toFixed(1)}% debt service`,
      ...statusFor(componentScore('debt')),
    },
    {
      pillar: 'Income protection',
      citation: 'Modeled BU target: 75% of net income',
      desc: `Existing monthly benefit is evaluated against a modeled target of ${money(buTarget)}, not merely policy ownership.`,
      score: componentScore('protection'),
      benchmark: 'Target: modeled monthly benefit gap closed',
      icon: ShieldCheck,
      highlight: buGap <= 50 ? 'Modeled benefit target met' : `${money(buGap)} monthly gap`,
      ...(componentScore('protection') === null
        ? statusFor(null)
        : buGap <= 50
          ? { label: 'On track', color: 'var(--accent-emerald)' }
          : { label: 'Action needed', color: 'var(--accent-coral)' }),
    },
    {
      pillar: 'Retirement funding',
      citation: 'Modeled real retirement income / target income',
      desc: 'The funding ratio uses the same advanced retirement result displayed in the retirement section.',
      score: componentScore('retirement'),
      benchmark: 'Target: 100% of modeled income need',
      icon: Layers,
      highlight: `${(retirementFunding * 100).toFixed(1)}% funded`,
      ...targetStatus(retirementFunding),
    },
  ].map((pillar) => ({ ...pillar, status: pillar.label, statusColor: pillar.color }));

  return (
    <section className="profile-audit animate-fade-in-up" aria-labelledby="profile-audit-title">
      <header className="profile-audit__header">
        <div className="profile-audit__intro">
          <span className="jpm-gold-tag">Financial health audit · 2026</span>
          <h3 id="profile-audit-title">Your household balance sheet</h3>
          <p>Five signals show where your income, tax, liquidity and retirement plan are strong — and where to act next.</p>
        </div>
        <div className="profile-audit__score" aria-label={score === null ? 'Overall resilience score pending analysis' : `Overall resilience score ${score} out of 100`}>
          <span>Overall score</span>
          <strong>{score ?? '—'}</strong>
          <em>{score === null ? 'Complete the analysis' : foundationReady ? 'Foundation on track' : 'Priorities remain'}</em>
        </div>
      </header>

      <div className="profile-audit__summary" aria-label="Audit summary">
        <div><span>Signals reviewed</span><strong>05</strong></div>
        <div><span>Priority focus</span><strong>{score === null ? '—' : pillarAudits.filter((p) => p.score !== null && p.score < 70).length || '—'}</strong></div>
        <div><span>Method</span><strong>DIN-informed</strong></div>
      </div>

      <section className="profile-audit__section" aria-labelledby="solvency-signals-title">
        <div className="profile-audit__section-head">
          <div>
            <span className="profile-audit__eyebrow">At a glance</span>
            <h4 id="solvency-signals-title">Solvency signals</h4>
          </div>
          <span className="profile-audit__legend"><span className="profile-audit__legend-dot" /> score vs target</span>
        </div>

        <div className="profile-audit__signals">
          {pillarAudits.map((pillar, index) => {
            const Icon = pillar.icon;
            return (
              <article className="profile-audit__signal" key={pillar.pillar}>
                <div className="profile-audit__signal-top">
                  <div className="profile-audit__signal-icon"><Icon size={18} strokeWidth={1.8} /></div>
                  <div className="profile-audit__signal-title">
                    <div><span>0{index + 1}</span> · {pillar.status}</div>
                    <h5>{pillar.pillar}</h5>
                    <small>{pillar.citation}</small>
                  </div>
                </div>
                <p>{pillar.desc}</p>
                <div className="profile-audit__meter-label"><span>Current score</span><strong>{pillar.score === null ? 'Pending' : `${pillar.score}%`}</strong></div>
                <div className="profile-audit__meter" role="progressbar" aria-valuenow={pillar.score ?? 0} aria-valuemin="0" aria-valuemax="100" aria-label={`${pillar.pillar} score`}>
                  <span style={{ width: `${pillar.score ?? 0}%`, background: pillar.statusColor }} />
                </div>
                <div className="profile-audit__signal-foot"><span>{pillar.highlight}</span><small>{pillar.benchmark}</small></div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="profile-audit__section profile-audit__stress" aria-labelledby="stress-test-title">
        <div className="profile-audit__section-head">
          <div>
            <span className="profile-audit__eyebrow">Decision support</span>
            <h4 id="stress-test-title">Three planning lenses</h4>
          </div>
          <span className="profile-audit__muted">Illustrative scenarios</span>
        </div>
        <div className="profile-audit__scenarios">
          <article className="profile-audit__scenario">
            <span>Investment median</span>
            <strong>{Number.isFinite(investmentMedian) ? money(investmentMedian) : 'Analysis pending'}</strong>
            <p>Modelled P50 outcome using the assumptions disclosed in the investment laboratory.</p>
          </article>
          <article className="profile-audit__scenario profile-audit__scenario--risk">
            <span>Stress</span>
            <strong>{score === null ? 'Analysis pending' : hasAdequateBU ? 'Income target covered' : 'Income benefit gap'}</strong>
            <p>Review protection and market stress results separately before acting.</p>
          </article>
          <article className="profile-audit__scenario profile-audit__scenario--gold">
            <span>Next priority</span>
            <strong>{priorityAction?.title || 'Analysis pending'}</strong>
            <p>{Number.isFinite(potentialTaxSavings) ? `${money(potentialTaxSavings)} estimated annual tax opportunity within the current inputs.` : 'Complete the analysis to calculate tax opportunities.'}</p>
          </article>
        </div>
      </section>

      <div className="profile-audit__method">
        <Sparkles size={15} />
        <span>Workflow informed by DIN 77230, with EStG § 32a, InvStG § 20 and SGB VI references.</span>
        <strong>Fee-only · independent</strong>
      </div>
    </section>
  );
}
