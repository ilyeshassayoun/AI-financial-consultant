import React, { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { History } from 'lucide-react';

const ILLUSTRATIVE_SERIES = [
  { year: '2000', msciWorld: 100, stoxx600: 100, bonds: 100, gold: 100, balanced: 100, event: 'Dot-Com Peak' },
  { year: '2001', msciWorld: 84, stoxx600: 83, bonds: 106, gold: 101, balanced: 92 },
  { year: '2002', msciWorld: 68, stoxx600: 56, bonds: 114, gold: 125, balanced: 82, event: 'Dot-Com Trough' },
  { year: '2003', msciWorld: 90, stoxx600: 65, bonds: 118, gold: 149, balanced: 97 },
  { year: '2004', msciWorld: 104, stoxx600: 73, bonds: 126, gold: 157, balanced: 108 },
  { year: '2005', msciWorld: 114, stoxx600: 92, bonds: 133, gold: 185, balanced: 120 },
  { year: '2006', msciWorld: 137, stoxx600: 109, bonds: 134, gold: 228, balanced: 138 },
  { year: '2007', msciWorld: 150, stoxx600: 112, bonds: 139, gold: 298, balanced: 147, event: 'Pre-GFC Peak' },
  { year: '2008', msciWorld: 90, stoxx600: 62, bonds: 148, gold: 314, balanced: 108, event: '2008 Financial Crisis' },
  { year: '2009', msciWorld: 117, stoxx600: 82, bonds: 153, gold: 390, balanced: 130 },
  { year: '2010', msciWorld: 131, stoxx600: 92, bonds: 161, gold: 506, balanced: 146 },
  { year: '2011', msciWorld: 124, stoxx600: 82, bonds: 174, gold: 557, balanced: 148 },
  { year: '2012', msciWorld: 144, stoxx600: 97, bonds: 193, gold: 596, balanced: 167 },
  { year: '2013', msciWorld: 182, stoxx600: 117, bonds: 189, gold: 429, balanced: 183 },
  { year: '2014', msciWorld: 200, stoxx600: 122, bonds: 213, gold: 422, balanced: 198 },
  { year: '2015', msciWorld: 198, stoxx600: 130, bonds: 215, gold: 378, balanced: 201 },
  { year: '2016', msciWorld: 213, stoxx600: 132, bonds: 222, gold: 410, balanced: 214 },
  { year: '2017', msciWorld: 261, stoxx600: 146, bonds: 224, gold: 464, balanced: 247 },
  { year: '2018', msciWorld: 238, stoxx600: 131, bonds: 226, gold: 457, balanced: 231 },
  { year: '2019', msciWorld: 304, stoxx600: 166, bonds: 239, gold: 541, balanced: 288 },
  { year: '2020', msciWorld: 353, stoxx600: 160, bonds: 249, gold: 673, balanced: 326, event: 'COVID-19 Shock' },
  { year: '2021', msciWorld: 430, stoxx600: 196, bonds: 241, gold: 649, balanced: 374 },
  { year: '2022', msciWorld: 352, stoxx600: 171, bonds: 198, gold: 646, balanced: 308, event: 'Rate & Inflation Shock' },
  { year: '2023', msciWorld: 436, stoxx600: 193, bonds: 212, gold: 731, balanced: 368 },
  { year: '2024', msciWorld: 520, stoxx600: 215, bonds: 218, gold: 920, balanced: 435 },
  { year: '2025', msciWorld: 585, stoxx600: 232, bonds: 224, gold: 1040, balanced: 485 },
  { year: '2026', msciWorld: 630, stoxx600: 245, bonds: 230, gold: 1110, balanced: 520 }
];

export default function HistoricalBacktestChart() {
  const [selectedAsset, setSelectedAsset] = useState('all');

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
            <History size={20} color="var(--maison-gold)" />
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)', fontWeight: 800 }}>
              Illustrative Market-Regime Scenarios
            </h3>
          </div>
          <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Synthetic educational examples—not observed market data or a historical backtest. These curves are not calculated from your selected strategy. No historical performance statistics are claimed.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            ['all', 'All Asset Classes'],
            ['msciWorld', 'Global equity illustration'],
            ['balanced', 'Balanced illustration'],
            ['bonds', 'EU Sovereign Bonds'],
            ['gold', 'Physical Gold']
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setSelectedAsset(id)}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-architectural)',
                background: selectedAsset === id ? 'var(--maison-obsidian)' : 'var(--bg-card-subtle)',
                color: selectedAsset === id ? '#ffffff' : 'var(--text-secondary)',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: '280px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={ILLUSTRATIVE_SERIES} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-architectural)" />
            <XAxis dataKey="year" stroke="var(--text-secondary)" fontSize={11} />
            <YAxis stroke="var(--text-secondary)" tickFormatter={(v) => `€${v}`} fontSize={11} />
            <Tooltip
              formatter={(val, name) => [`€${val}`, name]}
              contentStyle={{ 
                background: 'rgba(10, 18, 30, 0.92)', 
                backdropFilter: 'blur(16px)',
                color: '#ffffff', 
                borderRadius: '10px', 
                border: '1px solid rgba(197, 160, 89, 0.4)', 
                fontSize: '0.82rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)'
              }}
            />
            <Legend />
            {(selectedAsset === 'all' || selectedAsset === 'msciWorld') && (
              <Line type="monotone" dataKey="msciWorld" name="Global equity illustration" stroke="#38bdf8" strokeWidth={2.5} dot={false} />
            )}
            {(selectedAsset === 'all' || selectedAsset === 'balanced') && (
              <Line type="monotone" dataKey="balanced" name="Balanced illustration" stroke="#c5a059" strokeWidth={2.5} dot={false} />
            )}
            {(selectedAsset === 'all' || selectedAsset === 'bonds') && (
              <Line type="monotone" dataKey="bonds" name="EU Gov Bonds" stroke="#34d399" strokeWidth={1.8} strokeDasharray="4 4" dot={false} />
            )}
            {(selectedAsset === 'all' || selectedAsset === 'gold') && (
              <Line type="monotone" dataKey="gold" name="Gold Bullion" stroke="#fbbf24" strokeWidth={1.8} dot={false} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
