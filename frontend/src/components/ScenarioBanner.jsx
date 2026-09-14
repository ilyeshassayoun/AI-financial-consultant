import { FlaskConical, RotateCcw, Save } from 'lucide-react';

const FIELD_LABELS = {
  monthly_investment: 'Monthly funding',
  investment_years: 'Investment horizon',
  target_wealth: 'Target wealth',
  investment_strategy: 'Investment strategy',
  risk_profile: 'Risk profile',
  retirement_age: 'Retirement age',
  safe_withdrawal_rate: 'Withdrawal rate',
  tax_class: 'Tax class',
};

export default function ScenarioBanner({ overrides, onApply, onReset }) {
  const entries = Object.entries(overrides || {});
  if (!entries.length) return null;

  return (
    <aside className="scenario-banner" aria-label="Hypothetical scenario active">
      <div className="scenario-banner__summary">
        <FlaskConical size={18} aria-hidden="true" />
        <div>
          <strong>Hypothetical scenario</strong>
          <span>{entries.map(([key, value]) => `${FIELD_LABELS[key] || key}: ${String(value)}`).join(' · ')}</span>
        </div>
      </div>
      <div className="scenario-banner__actions">
        <button type="button" className="btn-secondary" onClick={onReset}><RotateCcw size={15} />Reset</button>
        <button type="button" className="btn-brand" onClick={onApply}><Save size={15} />Apply to profile</button>
      </div>
    </aside>
  );
}
