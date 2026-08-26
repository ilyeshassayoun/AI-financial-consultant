import React from 'react';
import { Bot, Sparkles, Zap, MessageSquare } from 'lucide-react';

export default function AIConsultantWidget({ insight, onApplyPatch, onOpenChat }) {
  if (!insight) return null;

  const { title, verdict, urgency, health_impact, key_metrics, recommended_actions } = insight;
  const isHigh = urgency === 'HIGH';

  return (
    <div 
      className="solid-card animate-fade-in-up"
      style={{
        background: 'var(--bg-card)',
        border: `1.5px solid ${isHigh ? 'var(--maison-gold)' : 'var(--border-architectural)'}`,
        borderRadius: '16px',
        padding: '24px',
        boxShadow: 'var(--shadow-elevated)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Decorative Top Accent Line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3.5px',
        background: isHigh ? 'linear-gradient(90deg, var(--maison-obsidian), var(--maison-gold))' : 'linear-gradient(90deg, var(--maison-gold), var(--border-architectural))'
      }} />

      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'var(--maison-obsidian)',
            color: 'var(--maison-gold)',
            padding: '8px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-elevated)',
            border: '1px solid var(--maison-gold-border)'
          }}>
            <Bot size={18} color="var(--maison-gold)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{title || 'Ilyes AI Live Consultation'}</span>
              <span className="badge badge-brand" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                <Sparkles size={12} color="var(--maison-gold)" /> LIVE PLANNING MODEL
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>German household planning estimate</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {health_impact && (
            <span style={{ background: 'var(--bg-card-subtle)', color: 'var(--text-primary)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, border: '1px solid var(--border-architectural)' }}>
              {health_impact}
            </span>
          )}
          <span style={{
            background: isHigh ? 'var(--maison-obsidian)' : 'var(--bg-card-subtle)',
            color: isHigh ? 'var(--maison-gold)' : 'var(--text-primary)',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '0.72rem',
            fontWeight: 800,
            letterSpacing: '0.04em',
            border: isHigh ? '1px solid var(--maison-gold-border)' : '1px solid var(--border-architectural)'
          }}>
            {isHigh ? 'ATTENTION REQUIRED' : 'BASE CASE ON TRACK'}
          </span>
        </div>
      </div>

      {/* AI Diagnostic Commentary */}
      <div style={{ background: 'var(--bg-card-subtle)', padding: '16px 18px', borderRadius: '10px', borderLeft: '4px solid var(--maison-gold)', fontSize: '0.86rem', color: 'var(--text-primary)', lineHeight: '1.6' }}>
        {verdict}
      </div>

      {/* Real-time Calculated Metrics */}
      {key_metrics && key_metrics.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
          {key_metrics.map((metric, idx) => (
            <div key={idx} style={{ background: 'var(--bg-card)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-architectural)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>{metric.label}</div>
              <div className="tabular-nums" style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>{metric.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* One-Click AI Optimizers & Direct Consultation Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', paddingTop: '12px', borderTop: '1px solid var(--border-architectural)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
            <Zap size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '2px', color: 'var(--maison-gold)' }} />
            1-CLICK AI OPTIMIZERS:
          </span>
          {recommended_actions && recommended_actions.map((act) => (
            <button
              key={act.id}
              type="button"
              onClick={() => onApplyPatch && onApplyPatch(act.patch)}
              className="btn-secondary"
              style={{
                fontSize: '0.75rem',
                padding: '6px 12px',
                borderRadius: '6px',
                background: 'var(--bg-card-subtle)',
                borderColor: 'var(--border-architectural)',
                color: 'var(--text-primary)',
                fontWeight: 700
              }}
            >
              <Zap size={11} color="var(--maison-gold)" />
              {act.label}
            </button>
          ))}
        </div>

        {onOpenChat && (
          <button
            type="button"
            onClick={() => onOpenChat(verdict)}
            className="btn-brand"
            style={{ fontSize: '0.78rem', padding: '8px 14px', borderRadius: '6px' }}
          >
            <MessageSquare size={13} /> Ask AI to Elaborate
          </button>
        )}
      </div>

    </div>
  );
}
