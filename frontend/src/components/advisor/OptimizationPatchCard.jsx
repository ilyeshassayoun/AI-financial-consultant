import React, { useState } from 'react';
import { ArrowUpRight, CheckCircle2, Sparkles, TrendingUp, X } from 'lucide-react';

export default function OptimizationPatchCard({ proposal, onPreview, onApply, onDismiss }) {
  const [status, setStatus] = useState(proposal.status || 'pending');

  const handlePreview = () => {
    setStatus('previewing');
    onPreview?.(proposal.patch);
  };

  const handleApply = () => {
    setStatus('applied');
    onApply?.(proposal.patch);
  };

  return (
    <article
      data-testid="optimization-patch-card"
      style={{
        marginTop: '10px', padding: '14px 16px', borderRadius: '12px',
        background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-architectural, #d8dee8)',
        borderLeft: '4px solid var(--maison-gold, #c5a059)', boxShadow: '0 4px 16px rgba(16, 34, 61, 0.08)',
        display: 'flex', flexDirection: 'column', gap: '8px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={15} color="var(--maison-gold, #c5a059)" />
          <strong style={{ fontSize: '0.84rem', color: 'var(--text-primary, #0f172a)' }}>
            {proposal.title || 'Optimization Proposal'}
          </strong>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={() => onDismiss(proposal.proposal_id)}
            aria-label="Dismiss proposal"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary, #94a3b8)', padding: '2px' }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {proposal.description && (
        <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-secondary, #475569)', lineHeight: 1.4 }}>
          {proposal.description}
        </p>
      )}

      {proposal.impact && Object.keys(proposal.impact).length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '2px' }}>
          {Object.entries(proposal.impact).map(([key, value]) => (
            <span
              key={key}
              style={{
                fontSize: '0.7rem', padding: '3px 8px', borderRadius: '6px',
                background: 'rgba(5, 150, 105, 0.1)', border: '1px solid rgba(5, 150, 105, 0.3)',
                color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px'
              }}
            >
              <TrendingUp size={11} />
              {key.replace(/_/g, ' ')}: {String(value)}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
        <button
          type="button"
          onClick={handlePreview}
          style={{
            flex: 1, padding: '7px 12px', borderRadius: '6px',
            border: '1px solid var(--border-architectural, #cbd5e1)',
            background: status === 'previewing' ? 'var(--bg-card-subtle, #f1f5f9)' : '#ffffff',
            color: 'var(--text-primary, #0f172a)', fontSize: '0.75rem', fontWeight: 700,
            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px'
          }}
        >
          <span>{status === 'previewing' ? 'Previewing...' : 'Preview Impact'}</span>
        </button>

        <button
          type="button"
          onClick={handleApply}
          disabled={status === 'applied'}
          style={{
            flex: 1, padding: '7px 12px', borderRadius: '6px',
            border: '1px solid var(--maison-gold, #c5a059)',
            background: status === 'applied' ? '#059669' : 'var(--maison-obsidian, #10223d)',
            color: '#ffffff', fontSize: '0.75rem', fontWeight: 700,
            cursor: status === 'applied' ? 'default' : 'pointer', display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center', gap: '5px'
          }}
        >
          {status === 'applied' ? (
            <><CheckCircle2 size={13} /><span>Applied to Profile</span></>
          ) : (
            <><ArrowUpRight size={13} color="var(--maison-gold, #c5a059)" /><span>Apply to Profile</span></>
          )}
        </button>
      </div>
    </article>
  );
}
