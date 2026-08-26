import { AlertTriangle, CheckCircle2, Gauge, Shield, Target, Wallet } from 'lucide-react';
import './ExpertAdvisoryPlan.css';

const euro = (value) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value || 0);
const percent = (value) => `${Math.round((value || 0) * 100)}%`;

export default function ExpertAdvisoryPlan({ plan }) {
  if (!plan) return null;
  const kpi = plan.household_kpis || {};
  const portfolio = plan.portfolio_suitability || {};
  const protection = plan.protection_needs || {};
  return (
    <section className="expert-plan" aria-labelledby="expert-plan-title">
      <header className="expert-plan__header">
        <div><span className="expert-plan__eyebrow">Explainable household strategy</span><h2 id="expert-plan-title">Your advice, sequenced by financial necessity</h2><p>{plan.scope}</p></div>
        <div className="expert-plan__score" aria-label={`Financial resilience score ${plan.financial_resilience_score} out of 100`}><Gauge size={20} aria-hidden="true" /><strong>{plan.financial_resilience_score}</strong><span>/100 resilience</span></div>
      </header>
      <div className="expert-plan__kpis">
        <article><Wallet aria-hidden="true" /><span>Free cash flow</span><strong>{euro(kpi.free_cash_flow_after_investing)}/mo</strong></article>
        <article><Target aria-hidden="true" /><span>Savings capacity</span><strong>{percent(kpi.savings_rate)}</strong></article>
        <article><Shield aria-hidden="true" /><span>Emergency runway</span><strong>{kpi.emergency_fund_months || 0} months</strong></article>
        <article><Gauge aria-hidden="true" /><span>Retirement funded</span><strong>{percent(kpi.retirement_funding_ratio)}</strong></article>
      </div>
      <div className="expert-plan__columns">
        <div><h3>Priority action plan</h3><ol className="expert-plan__actions">
          {(plan.action_plan || []).slice(0, 5).map((action) => <li key={action.id}><span className={`expert-plan__priority expert-plan__priority--${action.priority}`}>{action.priority}</span><div><div className="expert-plan__action-title"><strong>{action.title}</strong><span>{action.horizon}</span></div><p>{action.rationale}</p><small>Success: {action.success_metric}{action.monthly_commitment > 0 ? ` · ${euro(action.monthly_commitment)}/mo` : ''}</small></div></li>)}
        </ol></div>
        <div><h3>Resilience stress tests</h3><div className="expert-plan__stress-tests">
          {(plan.stress_tests || []).map((test) => <article key={test.name}>{test.result === 'pass' ? <CheckCircle2 aria-hidden="true" /> : <AlertTriangle aria-hidden="true" />}<div><strong>{test.name}</strong><span>{test.metric}</span></div><em className={`is-${test.result}`}>{test.result}</em></article>)}
        </div><div className="expert-plan__range"><h3>Portfolio outcome range</h3><div><span>Adverse P10<strong>{euro(portfolio.p10)}</strong></span><span>Median P50<strong>{euro(portfolio.p50)}</strong></span><span>Optimistic P90<strong>{euro(portfolio.p90)}</strong></span></div><p>{portfolio.interpretation}</p></div><div className="expert-plan__protection"><span>Target BU income: <strong>{euro(protection.bu_target_monthly)}/mo</strong></span><span>Uncovered gap: <strong>{euro(protection.bu_gap_monthly)}/mo</strong></span></div></div>
      </div>
      <details className="expert-plan__assumptions"><summary>Methodology and assumptions · {plan.as_of}</summary><ul>{(plan.assumptions || []).map((item) => <li key={item}>{item}</li>)}</ul></details>
    </section>
  );
}
