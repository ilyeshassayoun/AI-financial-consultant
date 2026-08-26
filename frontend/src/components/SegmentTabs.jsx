import React from 'react';

export default function SegmentTabs({ tabs, activeTab, onTabChange }) {
  return (
    <div 
      role="tablist" 
      aria-label="Subsection Navigation"
      style={{
        display: 'flex',
        alignItems: 'center',
        background: 'var(--bg-card)',
        padding: '6px',
        borderRadius: '14px',
        border: '1px solid var(--border-architectural)',
        boxShadow: 'var(--shadow-elevated)',
        gap: '6px',
        width: '100%',
        boxSizing: 'border-box',
        overflowX: 'auto'
      }}
    >
      {tabs.map((tab, idx) => {
        const isActive = idx === activeTab;
        return (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(idx)}
            style={{
              flex: 1,
              minWidth: '120px',
              padding: '10px 14px',
              borderRadius: '9px',
              border: isActive ? '1px solid var(--maison-gold-border)' : '1px solid transparent',
              background: isActive ? 'var(--maison-obsidian)' : 'transparent',
              color: isActive ? 'var(--maison-gold)' : 'var(--text-secondary)',
              fontWeight: isActive ? '700' : '600',
              fontSize: '0.84rem',
              cursor: 'pointer',
              boxShadow: isActive ? 'var(--shadow-elevated)' : 'none',
              transition: 'all 0.24s var(--ease-luxury)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              textAlign: 'center'
            }}
          >
            <span style={{ 
              background: isActive ? 'var(--maison-gold-subtle)' : 'var(--bg-card-subtle)',
              color: isActive ? 'var(--maison-gold)' : 'var(--text-primary)', 
              fontSize: '0.68rem',
              fontWeight: 800,
              padding: '2px 7px',
              borderRadius: '4px',
              flexShrink: 0
            }}>
              0{idx + 1}
            </span>
            <span style={{ 
              whiteSpace: 'nowrap', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis',
              fontSize: '0.82rem',
              letterSpacing: '0.01em'
            }}>
              {tab.replace(/^\d+\.\s*/, '')}
            </span>
          </button>
        );
      })}
    </div>
  );
}
