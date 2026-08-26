import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Landmark, Sparkles } from 'lucide-react';

export default function TaxBreakdownChart({ taxData, income, taxClass }) {
  if (!taxData) return null;

  const details = taxData.details || {};
  const ss = details.social_security || {};

  const grossIncome = taxData.gross_income || income;
  const incomeTax = details.income_tax || taxData.tax_amount || 0;
  const soli = details.solidarity_surcharge || 0;
  const churchTax = details.church_tax_amount || 0;
  const socialSecurity = ss.total || 0;
  const netIncome = taxData.net_income || (grossIncome - incomeTax - soli - socialSecurity);

  const waterfallData = [
    { name: 'Gross Salary', amount: Math.round(grossIncome), color: 'var(--maison-obsidian)', type: 'base' },
    { name: 'Income Tax §32a', amount: Math.round(incomeTax), color: 'var(--accent-coral)', type: 'deduction' },
    { name: 'Social Security', amount: Math.round(socialSecurity), color: 'var(--accent-ochre)', type: 'deduction' },
    { name: 'Soli & Church', amount: Math.round(soli + churchTax), color: 'var(--accent-coral)', type: 'deduction' },
    { name: 'Net Take-Home', amount: Math.round(netIncome), color: 'var(--accent-emerald)', type: 'net' }
  ];

  return (
    <div className="solid-card animate-fade-in-up" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Landmark size={22} color="var(--maison-gold)" />
            <h4 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)', fontWeight: 800 }}>
              Fiscal Schedule &amp; Statutory Waterfall Analysis
            </h4>
          </div>
          <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Evaluating Steuerklasse {taxClass} under 2026 EStG and SGB schedules.
          </p>
        </div>

        <div className="badge badge-brand" style={{ fontSize: '0.78rem' }}>
          <Sparkles size={12} /> Effective Tax Drag: {((taxData.effective_tax_rate || 0) * 100).toFixed(1)}%
        </div>
      </div>

      {/* Recharts Waterfall-Style Bar Graph */}
      <div style={{ height: '220px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={waterfallData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={11} />
            <YAxis stroke="var(--text-secondary)" tickFormatter={(val) => `€${(val/1000).toFixed(0)}k`} fontSize={11} />
            <Tooltip 
              formatter={(val) => [`€${Number(val).toLocaleString()}`, 'Amount']}
              contentStyle={{ background: 'var(--bg-card)', color: 'var(--text-primary)', borderRadius: '8px', border: '1px solid var(--border-architectural)', fontSize: '0.82rem' }}
            />
            <Bar dataKey="amount" radius={[6, 6, 0, 0]} isAnimationActive={false}>
              {waterfallData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Social Security 4-Pillar Itemization Table */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
        <div style={{ background: 'var(--bg-card-subtle)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-architectural)' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)' }}>HEALTH (KV 8.75%)</div>
          <div className="tabular-nums" style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>€{Math.round(ss.health_insurance || 0).toLocaleString()}</div>
        </div>

        <div style={{ background: 'var(--bg-card-subtle)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-architectural)' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)' }}>PENSION (RV 9.3%)</div>
          <div className="tabular-nums" style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>€{Math.round(ss.pension_insurance || 0).toLocaleString()}</div>
        </div>

        <div style={{ background: 'var(--bg-card-subtle)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-architectural)' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)' }}>CARE (PV ~2.4%)</div>
          <div className="tabular-nums" style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>€{Math.round(ss.care_insurance || 0).toLocaleString()}</div>
        </div>

        <div style={{ background: 'var(--bg-card-subtle)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-architectural)' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)' }}>UNEMPLOYMENT (AV 1.3%)</div>
          <div className="tabular-nums" style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>€{Math.round(ss.unemployment_insurance || 0).toLocaleString()}</div>
        </div>
      </div>

    </div>
  );
}
