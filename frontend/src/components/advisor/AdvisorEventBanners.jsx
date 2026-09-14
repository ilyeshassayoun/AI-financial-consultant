import React from 'react';
import { Sparkles, TrendingUp } from 'lucide-react';

export default function AdvisorEventBanners({ activeHighlight, deltaBadges }) {
  return (
    <>
      {activeHighlight && (
        <div
          data-testid="highlight-banner"
          style={{
            padding: '8px 16px', background: 'rgba(197, 160, 89, 0.12)',
            borderBottom: '1px solid rgba(197, 160, 89, 0.3)', display: 'flex',
            alignItems: 'center', gap: '8px', fontSize: '0.74rem',
            color: 'var(--text-primary, #0f172a)'
          }}
        >
          <Sparkles size={14} color="var(--maison-gold, #c5a059)" />
          <span>
            <strong>Focused Metric:</strong> {activeHighlight.target.replace(/_/g, ' ')}
            {activeHighlight.tooltip && ` — ${activeHighlight.tooltip}`}
          </span>
        </div>
      )}

      {deltaBadges.length > 0 && (
        <div
          data-testid="delta-badges-bar"
          style={{
            padding: '6px 16px', background: 'rgba(5, 150, 105, 0.08)',
            borderBottom: '1px solid rgba(5, 150, 105, 0.2)', display: 'flex',
            flexWrap: 'wrap', gap: '6px'
          }}
        >
          {deltaBadges.map((badge, index) => (
            <span
              key={`${badge.target}-${index}`}
              style={{
                fontSize: '0.68rem', padding: '2px 8px', borderRadius: '12px',
                background: '#059669', color: '#ffffff', fontWeight: 700,
                display: 'inline-flex', alignItems: 'center', gap: '4px'
              }}
            >
              <TrendingUp size={10} />
              {badge.target}: {badge.old_val || badge.old_value} → {badge.new_val || badge.new_value} ({badge.delta})
            </span>
          ))}
        </div>
      )}
    </>
  );
}
