import React from 'react';
import { User, Clock } from 'lucide-react';

export default function TimelineStage({ profile = {}, updateProfile }) {
  const currentAge = Number(profile.age) || 30;
  const retirementAge = Number(profile.retirement_age) || 67;
  const workingYearsRemaining = Math.max(1, retirementAge - currentAge);
  const goldenYears = Math.max(1, 90 - retirementAge);
  const totalHorizonYears = workingYearsRemaining + goldenYears;

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="stage-intro-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ background: 'var(--maison-gold-subtle)', padding: '10px', borderRadius: '10px', color: 'var(--text-primary)' }}>
          <User size={24} strokeWidth={1.5} />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>Personal Timeline &amp; Career Horizon</h3>
          <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>Your active wealth accumulation window and statutory family parameters.</p>
        </div>
      </div>

      {/* Lifecycle Timeline Track */}
      <div className="profile-lifecycle" style={{ background: 'var(--bg-card-subtle)', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-architectural)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
            WEALTH LIFECYCLE HORIZON
          </span>
          <span className="badge badge-brand" style={{ fontSize: '0.72rem', padding: '3px 9px' }}>
            <Clock size={12} /> {workingYearsRemaining} Earning Years Remaining
          </span>
        </div>

        <div style={{ display: 'flex', width: '100%', height: '9px', borderRadius: '5px', overflow: 'hidden', border: '1px solid var(--border-architectural)' }}>
          <div style={{ width: `${(workingYearsRemaining / totalHorizonYears) * 100}%`, background: 'var(--maison-gold)' }} title="Active Accumulation Phase" />
          <div style={{ width: `${(goldenYears / totalHorizonYears) * 100}%`, background: 'var(--text-primary)' }} title="Golden Retirement Phase" />
        </div>

        <div className="profile-lifecycle__labels" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
          <span>● Current Age ({currentAge})</span>
          <span>● Target Retirement ({retirementAge})</span>
          <span>● Longevity (90+)</span>
        </div>
      </div>

      {/* Sliders & Checkboxes in Responsive Grid */}
      <div className="profile-timeline-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
        <div style={{ background: 'var(--bg-card-subtle)', padding: '16px 18px', borderRadius: '12px', border: '1px solid var(--border-architectural)' }}>
          <label htmlFor="current-age-slider" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
            <span>Current Age</span>
            <span className="tabular-nums" style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.1rem' }}>{currentAge} yrs</span>
          </label>
          <input 
            id="current-age-slider"
            aria-label="Current Age"
            type="range" 
            min="18" 
            max="70" 
            value={currentAge} 
            onChange={e => updateProfile({ age: parseInt(e.target.value, 10) })} 
            style={{ width: '100%' }} 
          />
        </div>

        <div style={{ background: 'var(--bg-card-subtle)', padding: '16px 18px', borderRadius: '12px', border: '1px solid var(--border-architectural)' }}>
          <label htmlFor="retirement-age-slider" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
            <span>Target Retirement Age</span>
            <span className="tabular-nums" style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.1rem' }}>{retirementAge} yrs</span>
          </label>
          <input 
            id="retirement-age-slider"
            aria-label="Target Retirement Age"
            type="range" 
            min={Math.max(55, currentAge + 1)} 
            max="75" 
            value={retirementAge} 
            onChange={e => updateProfile({ retirement_age: parseInt(e.target.value, 10) })} 
            style={{ width: '100%' }} 
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label className="hover-lift" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-card-subtle)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-architectural)', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={Boolean(profile.is_married)}
              onChange={e => updateProfile({ is_married: e.target.checked })} 
            />
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>Married (Joint Tax Assessment)</div>
          </label>

          <label className="hover-lift" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-card-subtle)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-architectural)', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={Boolean(profile.has_dependents)}
              onChange={e => updateProfile({ has_dependents: e.target.checked })} 
            />
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>Has Dependents (Kinderfreibetrag)</div>
          </label>
        </div>
      </div>
    </div>
  );
}
