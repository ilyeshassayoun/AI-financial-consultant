import React, { useMemo } from 'react';
import { ResponsiveContainer, Sankey, Tooltip } from 'recharts';
import { Landmark, Sparkles } from 'lucide-react';

const formatEUR = (val) => `€${Math.round(val).toLocaleString()}`;

export default function SankeyTaxFlow({ taxData, profile, gross: propGross, taxes: propTaxes, socialSecurity: propSS, netIncome: propNet }) {
  const gross = Number(propGross ?? taxData?.gross_income ?? profile?.income ?? 60000);
  const details = taxData?.details || {};
  const ss = details.social_security || {};
  
  const incomeTax = Number(details.income_tax || taxData?.tax_amount || gross * 0.18);
  const soli = Number(details.solidarity_surcharge || 0);
  const churchTax = Number(details.church_tax_amount || 0);
  
  const kv = Number(ss.health_insurance || gross * 0.0875);
  const rv = Number(ss.pension_insurance || gross * 0.093);
  const pv = Number(ss.care_insurance || gross * 0.024);
  const av = Number(ss.unemployment_insurance || gross * 0.013);
  const totalSS = Number(propSS ?? (kv + rv + pv + av));
  const totalTax = Number(propTaxes ?? (incomeTax + soli + churchTax));
  
  const netIncome = Number(propNet ?? taxData?.net_income ?? Math.max(0, gross - totalTax - totalSS));
  const monthlyInvest = Number(profile?.monthly_investment || 500) * 12;
  const annualSavings = Math.min(netIncome, monthlyInvest);
  const livingExpenses = Math.max(0, netIncome - annualSavings);

  const data = useMemo(() => {
    // Sankey Nodes:
    // 0: Gross Income
    // 1: Statutory Taxes
    // 2: Social Security
    // 3: Net Cash
    // 4: Income Tax (§ 32a)
    // 5: Soli & Church
    // 6: Health & Care (KV/PV)
    // 7: Pension & Unemployment (RV/AV)
    // 8: Living Expenses
    // 9: Wealth Accumulation (ETF)
    const nodes = [
      { name: `Gross Income (${formatEUR(gross)})` },
      { name: `Taxes (${formatEUR(totalTax)})` },
      { name: `Social Security (${formatEUR(totalSS)})` },
      { name: `Net Take-Home (${formatEUR(netIncome)})` },
      { name: `EStG Tariff (${formatEUR(incomeTax)})` },
      { name: `Soli & Church (${formatEUR(soli + churchTax)})` },
      { name: `KV & PV (${formatEUR(kv + pv)})` },
      { name: `RV & AV (${formatEUR(rv + av)})` },
      { name: `Living Expenses (${formatEUR(livingExpenses)})` },
      { name: `ETF Accumulation (${formatEUR(annualSavings)})` }
    ];

    const links = [
      { source: 0, target: 1, value: Math.max(1, totalTax) },
      { source: 0, target: 2, value: Math.max(1, totalSS) },
      { source: 0, target: 3, value: Math.max(1, netIncome) },
      { source: 1, target: 4, value: Math.max(1, incomeTax) },
      { source: 1, target: 5, value: Math.max(1, soli + churchTax) },
      { source: 2, target: 6, value: Math.max(1, kv + pv) },
      { source: 2, target: 7, value: Math.max(1, rv + av) },
      { source: 3, target: 8, value: Math.max(1, livingExpenses) },
      { source: 3, target: 9, value: Math.max(1, annualSavings) }
    ];

    return { nodes, links };
  }, [gross, totalTax, totalSS, netIncome, incomeTax, soli, churchTax, kv, rv, pv, av, livingExpenses, annualSavings]);

  return (
    <div 
      className="solid-card animate-fade-in-up" 
      style={{ 
        padding: '24px', 
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
              Sankey Cash Flow &amp; Statutory Tax Flow Architecture
            </h3>
          </div>
          <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Visual mapping of gross salary routing into German statutory obligations, take-home liquidity, and ETF capital formation.
          </p>
        </div>
        <span className="badge badge-brand" style={{ fontSize: '0.75rem' }}>
          <Sparkles size={13} /> § 32a EStG &amp; SGB Allocation
        </span>
      </div>

      <div style={{ height: '320px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <Sankey
            data={data}
            nodePadding={24}
            nodeWidth={12}
            link={{ stroke: 'var(--border-architectural)', strokeOpacity: 0.6 }}
            margin={{ top: 12, right: 180, bottom: 12, left: 10 }}
          >
            <Tooltip
              formatter={(val) => [formatEUR(val), 'Volume']}
              contentStyle={{ background: 'var(--bg-card)', color: 'var(--text-primary)', borderRadius: '8px', border: '1px solid var(--border-architectural)', fontSize: '0.82rem' }}
            />
          </Sankey>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', paddingTop: '8px', borderTop: '1px solid var(--border-architectural)' }}>
        <div style={{ background: 'var(--bg-card-subtle)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-architectural)' }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>STATUTORY TAX DRAG</span>
          <div className="tabular-nums" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {formatEUR(totalTax)} <small style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>({((totalTax / gross) * 100).toFixed(1)}%)</small>
          </div>
        </div>

        <div style={{ background: 'var(--bg-card-subtle)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-architectural)' }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>SOCIAL SECURITY RETENTION</span>
          <div className="tabular-nums" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {formatEUR(totalSS)} <small style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>({((totalSS / gross) * 100).toFixed(1)}%)</small>
          </div>
        </div>

        <div style={{ background: 'var(--bg-card-subtle)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-architectural)' }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>DISPOSABLE NET CASH</span>
          <div className="tabular-nums" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
            {formatEUR(netIncome)} <small style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>({((netIncome / gross) * 100).toFixed(1)}%)</small>
          </div>
        </div>
      </div>
    </div>
  );
}
