import React, { useState } from 'react';
import { Landmark, Check, Zap } from 'lucide-react';

const BROKER_CONFIGS = [
  {
    id: 'scalable',
    name: 'Scalable Capital (Prime+)',
    orderFee: '€0.00 / savings plan',
    interestRate: '2.60% p.a. on cash',
    etfUniverse: '2,500+ Prime ETFs',
    features: ['Automated Tax Optimization', 'Free Savings Plans', 'Direct Bank Routing']
  },
  {
    id: 'trade_republic',
    name: 'Trade Republic',
    orderFee: '€0.00 / savings plan',
    interestRate: '3.00% p.a. on cash',
    etfUniverse: '2,000+ Core ETFs',
    features: ['1% Saveback on Card', 'Saveback into ETF', 'BaFin Regulated']
  },
  {
    id: 'ing',
    name: 'ING-DiBa Direkt-Depot',
    orderFee: '€0.00 / 1,000+ ETF plans',
    interestRate: '1.25% p.a. on cash',
    etfUniverse: 'House Bank Integration',
    features: ['Full-Service German Bank', 'Tax Certificate Integration', 'High Deposit Protection']
  },
  {
    id: 'flatex',
    name: 'flatex Classic Depot',
    orderFee: '€0.00 / selected plans',
    interestRate: '0.00% on cash',
    etfUniverse: 'Broad Global Access',
    features: ['Professional Trading Desk', 'Multi-Exchange Routing', 'Foreign Equities']
  }
];

export default function BrokerDepotSimulator({ monthlyContribution, initialAmount, selectedStrategy }) {
  const [selectedBroker, setSelectedBroker] = useState('scalable');
  const [syncComplete, setSyncComplete] = useState(false);

  const broker = BROKER_CONFIGS.find(b => b.id === selectedBroker) || BROKER_CONFIGS[0];
  const annualSavings = (monthlyContribution ?? 500) * 12;

  const handleDownloadBlueprint = () => {
    const blueprint = {
      type: 'Educational broker setup checklist',
      generated_at: new Date().toISOString(),
      broker: { id: broker.id, name: broker.name },
      monthly_contribution_eur: monthlyContribution ?? 500,
      initial_amount_eur: initialAmount ?? 0,
      annual_contribution_eur: annualSavings,
      strategy: selectedStrategy ? {
        name: selectedStrategy.name,
        id: selectedStrategy.id,
        expected_return: selectedStrategy.expected_return,
        expected_volatility: selectedStrategy.expected_volatility,
        allocation: (selectedStrategy.allocation || []).map(a => ({
          asset: a.name, weight: a.weight
        })),
        instruments: (selectedStrategy.instruments || []).map(i => ({
          ticker: i.ticker, isin: i.isin, name: i.name, ter: i.ter, role: i.role
        })),
      } : null,
      checklist: [
        'Verify current broker terms, fees, eligibility and deposit protection.',
        'Resolve the investment policy suitability gates.',
        'Confirm instrument ISINs and target weights independently.',
        'Review the applicable saver allowance and existing exemption orders.',
        'Set up a savings plan yourself only after completing those checks.',
      ],
      disclaimer: 'Planning document only. No brokerage account, order, SEPA mandate or tax certificate has been created or submitted.',
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(blueprint, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'investment-setup-checklist.json';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setSyncComplete(true);
  };

  return (
    <div 
      className="solid-card animate-fade-in-up"
      style={{
        padding: '24px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-architectural)',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Landmark size={20} color="var(--maison-gold)" />
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)', fontWeight: 800 }}>
              German Neobroker &amp; Depot Execution Simulator
            </h3>
          </div>
          <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Model execution routing, automated Sparplan deductions, and German tax reporting (Freistellungsauftrag).
          </p>
        </div>

        <span className="badge badge-brand" style={{ fontSize: '0.75rem' }}>
          <Zap size={13} /> 0.00€ Sparplan Fee Routing
        </span>
      </div>

      {/* Broker Selection Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
        {BROKER_CONFIGS.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => setSelectedBroker(b.id)}
            style={{
              padding: '14px',
              borderRadius: '12px',
              border: `2px solid ${selectedBroker === b.id ? 'var(--maison-gold)' : 'var(--border-architectural)'}`,
              background: selectedBroker === b.id ? 'var(--bg-card-subtle)' : 'var(--bg-card)',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>{b.name}</strong>
              {selectedBroker === b.id && <Check size={14} color="var(--maison-gold)" />}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--accent-emerald)', fontWeight: 700 }}>{b.orderFee}</span>
            <small style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>{b.interestRate}</small>
          </button>
        ))}
      </div>

      {/* Active Broker Specification & Automated Order Preview */}
      <div style={{ background: 'var(--bg-card-subtle)', padding: '16px', borderRadius: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', border: '1px solid var(--border-architectural)' }}>
        <div>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)' }}>MONTHLY DIRECT DEBIT (SEPA)</span>
          <div className="tabular-nums" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            €{(monthlyContribution ?? 500).toLocaleString()} <small style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>/ month</small>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Executes 1st of each month</span>
        </div>

        <div>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)' }}>ESTIMATED ANNUAL CAPITAL</span>
          <div className="tabular-nums" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
            €{annualSavings.toLocaleString()} / yr
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>100% physically replicated ETF</span>
        </div>

        <div>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)' }}>FREISTELLUNGSAUFTRAG USED</span>
          <div className="tabular-nums" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            €1,000 <small style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>/ €1,000</small>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>§ 20 Abs. 9 EStG fully shielded</span>
        </div>
      </div>

      {/* Action Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          {syncComplete ? (
            <span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>✓ Checklist download prepared for {broker.name}. No account, order or mandate was created.</span>
          ) : (
            <span>Download an educational setup checklist; verify current broker terms before acting.</span>
          )}
        </div>

        <button
          type="button"
          onClick={handleDownloadBlueprint}
          className="btn-brand"
          style={{ fontSize: '0.78rem', padding: '8px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Zap size={14} />
          Download {broker.name} Setup Checklist
        </button>
      </div>

    </div>
  );
}
