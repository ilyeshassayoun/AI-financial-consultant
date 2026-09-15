import React, { useState } from 'react';
import { Check, CheckCircle2, ClipboardCheck, Download, Landmark } from 'lucide-react';

const PROVIDERS = [
  { id: 'direct_bank', name: 'Direct bank depot', detail: 'Useful when consolidated banking, tax documents and support matter most.' },
  { id: 'low_cost', name: 'Low-cost broker', detail: 'Useful when recurring-plan availability and simple automation matter most.' },
  { id: 'full_service', name: 'Full-service provider', detail: 'Useful when advice, custody support and broader execution access matter most.' },
];

const CHECKS = [
  ['availability', 'Confirm every ISIN is available as a recurring plan'],
  ['costs', 'Verify current custody, order, spread and savings-plan costs'],
  ['tax', 'Confirm German tax reporting and the exemption-order allocation'],
  ['gates', 'Resolve the suitability gates in the policy statement'],
];

const money = value => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value || 0);
const pct = value => `${((value || 0) * 100).toFixed(1)}%`;

export default function BrokerDepotSimulator({ implementationPlan = {}, selectedStrategy, monthlyContribution = 0, initialAmount = 0 }) {
  const [selectedProvider, setSelectedProvider] = useState('direct_bank');
  const [completed, setCompleted] = useState([]);
  const [downloaded, setDownloaded] = useState(false);
  const provider = PROVIDERS.find(item => item.id === selectedProvider) || PROVIDERS[0];
  const orders = implementationPlan.orders || [];
  const progress = Math.round((completed.length / CHECKS.length) * 100);
  const toggle = id => setCompleted(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  const totalMonthly = orders.length ? orders.reduce((sum, item) => sum + Number(item.monthly_amount || 0), 0) : monthlyContribution;

  const downloadBlueprint = () => {
    const blueprint = {
      type: 'Educational investment implementation blueprint',
      generated_at: new Date().toISOString(),
      provider_category: provider,
      monthly_contribution_eur: totalMonthly,
      initial_amount_eur: implementationPlan.initial_total ?? initialAmount,
      annual_contribution_eur: implementationPlan.annual_contribution ?? totalMonthly * 12,
      strategy: selectedStrategy ? { id: selectedStrategy.id, name: selectedStrategy.name } : null,
      implementation_plan: implementationPlan,
      completed_checks: CHECKS.filter(([id]) => completed.includes(id)).map(([, label]) => label),
      checklist: CHECKS.map(([, label]) => label),
      disclaimer: implementationPlan.disclaimer || 'Planning document only. No account, order or mandate has been created.',
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(blueprint, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'investment-setup-checklist.json';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setDownloaded(true);
  };

  return (
    <section className="implementation-workbench" aria-labelledby="implementation-title">
      <header className="implementation-workbench__header">
        <div><Landmark size={21}/><div><span>Provider-neutral execution plan</span><h3 id="implementation-title">Turn the allocation into verifiable orders</h3></div></div>
        <div className="implementation-progress" aria-label={`${progress}% of implementation checks complete`}><strong>{progress}%</strong><span><i style={{ width: `${progress}%` }}/></span></div>
      </header>

      <div className="implementation-provider-grid" aria-label="Choose a provider category">
        {PROVIDERS.map(item => <button type="button" key={item.id} className={selectedProvider === item.id ? 'is-active' : ''} onClick={() => setSelectedProvider(item.id)}><span>{selectedProvider === item.id && <Check size={15}/>}</span><strong>{item.name}</strong><small>{item.detail}</small></button>)}
      </div>

      <div className="implementation-orders">
        <div className="implementation-orders__heading"><div><span>Illustrative order blueprint</span><strong>{money(totalMonthly)} per month · weighted TER {pct(implementationPlan.weighted_ter)}</strong></div><small>Amounts are rounded; review any residual cash at execution.</small></div>
        <div className="implementation-order-table" role="table" aria-label="Illustrative monthly investment orders">
          <div role="row" className="implementation-order-table__head"><span>Instrument</span><span>Weight</span><span>Initial</span><span>Monthly</span></div>
          {orders.map(item => <div role="row" key={item.isin}><span><strong>{item.ticker}</strong><small>{item.name}<br/>{item.isin}</small></span><span>{pct(item.weight)}</span><span>{money(item.initial_amount)}</span><span>{money(item.monthly_amount)}</span></div>)}
        </div>
      </div>

      <div className="implementation-checklist">
        <div><ClipboardCheck size={19}/><div><strong>Pre-order checks</strong><small>These checks create evidence; they do not connect to a broker.</small></div></div>
        {CHECKS.map(([id, label]) => <label key={id} className={completed.includes(id) ? 'is-complete' : ''}><input type="checkbox" checked={completed.includes(id)} onChange={() => toggle(id)}/><CheckCircle2 size={18}/><span>{label}</span></label>)}
      </div>

      <footer className="implementation-workbench__footer">
        <p>{downloaded ? `Blueprint prepared for the ${provider.name.toLowerCase()} route. No account, order or mandate was created.` : (implementationPlan.disclaimer || 'Planning document only. No account, order or mandate will be created.')}</p>
        <button type="button" className="btn-brand" onClick={downloadBlueprint}><Download size={15}/>Download {provider.name} Setup Checklist</button>
      </footer>
    </section>
  );
}
