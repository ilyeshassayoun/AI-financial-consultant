import React from 'react';
import { ExternalLink, Scale } from 'lucide-react';

export default function StatutoryCitations({ citations }) {
  if (!citations.length) return null;

  return (
    <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
      {citations.map((citation, index) => (
        <a
          key={`${citation.statute}-${index}`}
          href={citation.official_url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: '0.68rem', padding: '3px 8px', borderRadius: '6px',
            background: 'rgba(197, 160, 89, 0.14)', border: '1px solid var(--maison-gold, #c5a059)',
            color: 'var(--text-primary, #0f172a)', textDecoration: 'none', display: 'inline-flex',
            alignItems: 'center', gap: '4px', fontWeight: 700
          }}
        >
          <Scale size={11} color="var(--maison-gold, #c5a059)" />
          <span>{citation.statute} · {citation.title || 'German Federal Statute'}</span>
          <ExternalLink size={10} />
        </a>
      ))}
    </div>
  );
}
