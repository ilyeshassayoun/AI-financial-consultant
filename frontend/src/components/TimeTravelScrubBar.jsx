import React, { useState, useMemo } from 'react';
import { 
  Clock, RotateCcw, TrendingUp, 
  Baby, Home, Briefcase, Award, CheckCircle2
} from 'lucide-react';
import { useProfileStore } from '../stores/profileStore';

// Canonical Career Milestones (§ 3 spec_miner_fintech)
const DEFAULT_CAREER_MILESTONES = [
  {
    sequence: 0,
    type: 'ProfileInitialized',
    label: 'Career Entry (Age 26)',
    age: 26,
    icon: Briefcase,
    title: 'Junior Software Engineer',
    description: 'Initial market entry at €48,000 gross. Starting disciplined ETF accumulation.',
    delta: {
      age: 26,
      income: 48000,
      tax_class: 1,
      is_married: false,
      num_children: 0,
      monthly_investment: 300,
      initial_amount: 5000,
      has_property: false
    }
  },
  {
    sequence: 1,
    type: 'IncomeAdjusted',
    label: 'Senior Leap (Age 29)',
    age: 29,
    icon: TrendingUp,
    title: 'Senior FinTech Engineer',
    description: 'Salary bump to €72,000. Elevating monthly ETF investment to €750/mo.',
    delta: {
      age: 29,
      income: 72000,
      monthly_investment: 750,
      initial_amount: 25000
    }
  },
  {
    sequence: 2,
    type: 'ChildAdded',
    label: 'Family Formation (Age 32)',
    age: 32,
    icon: Baby,
    title: 'Family Formation & Tax Shield',
    description: 'Marriage and birth of first child. Kinderfreibetrag and Kindergeld activated.',
    delta: {
      age: 32,
      is_married: true,
      has_dependents: true,
      num_children: 1,
      children_under_25: 1,
      tax_class: 4,
      monthly_investment: 850
    }
  },
  {
    sequence: 3,
    type: 'PropertyPurchased',
    label: 'Real Estate (Age 35)',
    age: 35,
    icon: Home,
    title: 'Acquisition of Primary Residence',
    description: 'Purchased €420,000 apartment with €84,000 equity down-payment and 3.8% mortgage.',
    delta: {
      age: 35,
      has_property: true,
      property_price: 420000,
      property_down_payment: 84000,
      mortgage_rate: 0.038,
      mortgage_amortization: 0.02,
      housing_cost: 1650
    }
  },
  {
    sequence: 4,
    type: 'IncomeAdjusted',
    label: 'Staff Leadership (Age 39)',
    age: 39,
    icon: Award,
    title: 'Staff Architect & bAV Activation',
    description: 'Executive income of €105,000. Maximizing § 3 Nr. 63 bAV and €1,400/mo savings.',
    delta: {
      age: 39,
      income: 105000,
      monthly_investment: 1400,
      bav_contribution: 240
    }
  },
  {
    sequence: 5,
    type: 'GoalToggled',
    label: 'Independence (Age 45)',
    age: 45,
    icon: CheckCircle2,
    title: 'Financial Freedom Pivot',
    description: 'Accelerated target wealth €650,000 and target retirement age brought forward to 62.',
    delta: {
      age: 45,
      target_wealth: 650000,
      retirement_age: 62,
      monthly_investment: 1800
    }
  }
];

/**
 * Pure mathematical reducer to reconstruct historical snapshot state.
 * f(S_0, E_1...E_k) -> S_k
 */
function replayMilestones(baselineProfile, milestones, targetIndex) {
  let state = { ...baselineProfile, ...milestones[0].delta };

  for (let i = 1; i <= targetIndex; i++) {
    const milestone = milestones[i];
    if (!milestone) break;
    state = { ...state, ...milestone.delta };
  }

  return state;
}

/**
 * Quick statutory approximations for live milestone badges
 */
function computeMilestoneMetrics(profile) {
  const income = Number(profile.income) || 60000;
  const savings = Number(profile.monthly_investment) || 500;
  const age = Number(profile.age) || 30;

  // German § 32a EStG 2026 tariff zone estimation
  let marginalRate = 0.14;
  let taxZone = 'Zone 1 (Grundfreibetrag)';
  if (income > 277826) {
    marginalRate = 0.45;
    taxZone = 'Zone 5 (Reichensteuer 45%)';
  } else if (income > 66760) {
    marginalRate = 0.42;
    taxZone = 'Zone 4 (Spitzensteuersatz 42%)';
  } else if (income > 17005) {
    marginalRate = 0.24 + ((income - 17005) / 50000) * 0.18;
    taxZone = `Zone 2/3 (Proportional ${(marginalRate * 100).toFixed(1)}%)`;
  }

  // Monthly net wealth velocity
  const velocity = savings;

  // Estimated monthly Rentenlücke at this income and horizon
  const targetMonthlyPension = (income / 12) * 0.75;
  const yearsWorked = Math.max(1, age - 25);
  const entgeltpunktePerYear = Math.min(2.0, income / 50493);
  const estimatedStatePension = yearsWorked * entgeltpunktePerYear * 39.32;
  const pensionGap = Math.max(0, targetMonthlyPension - estimatedStatePension);

  return {
    marginalRate: (marginalRate * 100).toFixed(1) + '%',
    taxZone,
    velocity: '€' + velocity.toLocaleString('de-DE') + '/mo',
    pensionGap: '€' + Math.round(pensionGap).toLocaleString('de-DE') + '/mo'
  };
}

export default function TimeTravelScrubBar() {
  const profile = useProfileStore((state) => state.profile);
  const previewScenario = useProfileStore((state) => state.previewScenario);
  const clearScenario = useProfileStore((state) => state.clearScenario);

  const liveIndex = DEFAULT_CAREER_MILESTONES.length; // Index representing the live present head
  const [selectedIndex, setSelectedIndex] = useState(liveIndex);
  const isTimeTraveling = selectedIndex < liveIndex;

  // Current replayed state
  const currentPreviewState = useMemo(() => {
    if (!isTimeTraveling) return null;
    return replayMilestones(profile, DEFAULT_CAREER_MILESTONES, selectedIndex);
  }, [profile, isTimeTraveling, selectedIndex]);

  // Derived live badges
  const liveMetrics = useMemo(() => {
    const activeData = currentPreviewState || profile;
    return computeMilestoneMetrics(activeData);
  }, [currentPreviewState, profile]);

  const handleScrub = (index) => {
    const newIdx = Math.max(0, Math.min(liveIndex, index));
    setSelectedIndex(newIdx);

    if (newIdx === liveIndex) {
      // Return to present: clear hypothetical scenario overrides without mutating DB
      clearScenario();
    } else {
      // Replay historical milestone and preview WITHOUT mutating DB
      const replayed = replayMilestones(profile, DEFAULT_CAREER_MILESTONES, newIdx);
      previewScenario(replayed);
    }
  };

  const handleReturnToPresent = () => {
    setSelectedIndex(liveIndex);
    clearScenario();
  };

  const activeMilestone = selectedIndex < liveIndex ? DEFAULT_CAREER_MILESTONES[selectedIndex] : null;

  return (
    <div
      data-testid="time-travel-scrub-bar"
      style={{
        marginTop: '16px',
        padding: '16px 20px',
        borderRadius: '16px',
        background: isTimeTraveling 
          ? 'linear-gradient(145deg, #0d1b2a, #1b263b)' 
          : 'var(--bg-card, #ffffff)',
        border: isTimeTraveling 
          ? '1px solid var(--maison-gold, #c5a059)' 
          : '1px solid var(--border-architectural, #d8dee8)',
        boxShadow: isTimeTraveling 
          ? '0 8px 32px rgba(197, 160, 89, 0.22)' 
          : '0 4px 20px rgba(16, 34, 61, 0.05)',
        color: isTimeTraveling ? '#ffffff' : 'var(--text-primary, #0f172a)',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* Top Banner & Status Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: isTimeTraveling ? 'rgba(197, 160, 89, 0.2)' : 'rgba(16, 34, 61, 0.08)',
              border: '1px solid var(--maison-gold, #c5a059)',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--maison-gold, #c5a059)'
            }}
          >
            <Clock size={16} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <strong style={{ fontSize: '0.9rem', fontFamily: 'var(--font-serif, Georgia, serif)' }}>
                Career Time-Travel Audit Bar
              </strong>
              <span
                style={{
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  background: isTimeTraveling ? '#b45309' : 'rgba(5, 150, 105, 0.2)',
                  color: isTimeTraveling ? '#fef3c7' : '#059669',
                  border: isTimeTraveling ? '1px solid #d97706' : '1px solid #059669'
                }}
              >
                {isTimeTraveling ? 'TIME-TRAVEL PREVIEW (HEAD PROTECTED)' : 'LIVE PRESENT HEAD (ACTIVE)'}
              </span>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: isTimeTraveling ? 'rgba(255, 255, 255, 0.7)' : 'var(--text-secondary, #64748b)' }}>
              Scrub across career events to inspect tax, savings velocity, and pension progression without mutating database head.
            </p>
          </div>
        </div>

        {/* Live Return Button */}
        {isTimeTraveling && (
          <button
            type="button"
            onClick={handleReturnToPresent}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: '1px solid var(--maison-gold, #c5a059)',
              background: 'var(--maison-gold, #c5a059)',
              color: '#0a121e',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
            }}
          >
            <RotateCcw size={13} />
            <span>Return to Live Head</span>
          </button>
        )}
      </div>

      {/* Scrub Track & Milestone Buttons */}
      <div style={{ position: 'relative', margin: '14px 0 10px' }}>
        <input
          data-testid="time-travel-slider"
          aria-label="Scrub career milestone timeline"
          type="range"
          min="0"
          max={liveIndex}
          step="1"
          value={selectedIndex}
          onChange={(e) => handleScrub(parseInt(e.target.value, 10))}
          style={{
            width: '100%',
            accentColor: 'var(--maison-gold, #c5a059)',
            cursor: 'pointer',
            height: '6px'
          }}
        />

        {/* Milestone Tick Labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
          {DEFAULT_CAREER_MILESTONES.map((m, idx) => {
            const isPassed = selectedIndex >= idx;
            const isCurrent = selectedIndex === idx;
            const Icon = m.icon;
            return (
              <button
                key={m.sequence}
                type="button"
                onClick={() => handleScrub(idx)}
                aria-label={`Scrub to ${m.label}`}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  opacity: isPassed ? 1 : 0.45,
                  transition: 'opacity 0.2s ease'
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: isCurrent ? 'var(--maison-gold, #c5a059)' : (isPassed ? '#10223d' : '#94a3b8'),
                    color: isCurrent ? '#0a121e' : '#ffffff',
                    border: '1px solid var(--border-architectural, #cbd5e1)',
                    display: 'grid',
                    placeItems: 'center'
                  }}
                >
                  <Icon size={12} />
                </div>
                <span style={{ fontSize: '0.66rem', fontWeight: isCurrent ? 800 : 500, color: isCurrent ? 'var(--maison-gold, #c5a059)' : 'inherit', whiteSpace: 'nowrap' }}>
                  {m.label}
                </span>
              </button>
            );
          })}
          {/* Live Head Tick */}
          <button
            type="button"
            onClick={() => handleScrub(liveIndex)}
            aria-label="Scrub to Live Present Head"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              opacity: selectedIndex === liveIndex ? 1 : 0.6
            }}
          >
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: selectedIndex === liveIndex ? '#059669' : '#475569',
                color: '#ffffff',
                border: '1px solid #059669',
                display: 'grid',
                placeItems: 'center'
              }}
            >
              <CheckCircle2 size={12} />
            </div>
            <span style={{ fontSize: '0.66rem', fontWeight: selectedIndex === liveIndex ? 800 : 500, color: selectedIndex === liveIndex ? '#059669' : 'inherit' }}>
              Present
            </span>
          </button>
        </div>
      </div>

      {/* Active Scrubbing Detail & Live Micro-Gauges */}
      <div
        style={{
          marginTop: '12px',
          padding: '12px 14px',
          borderRadius: '10px',
          background: isTimeTraveling ? 'rgba(0, 0, 0, 0.3)' : 'var(--bg-card-subtle, #f8fafc)',
          border: '1px solid var(--border-architectural, #e2e8f0)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        {/* Milestone Narrative */}
        <div style={{ flex: 1, minWidth: '240px' }}>
          {activeMilestone ? (
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--maison-gold, #c5a059)' }}>
                Milestone #{activeMilestone.sequence + 1}: {activeMilestone.title}
              </div>
              <div style={{ fontSize: '0.72rem', color: isTimeTraveling ? 'rgba(255, 255, 255, 0.75)' : 'var(--text-secondary, #64748b)', marginTop: '2px' }}>
                {activeMilestone.description}
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#059669' }}>
                Current Household Profile Head
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary, #64748b)', marginTop: '2px' }}>
                Displaying live verified inputs. Any changes here persist to your session storage.
              </div>
            </div>
          )}
        </div>

        {/* Live Gauges (Tax Bracket, Wealth Velocity, Rentenlücke) */}
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.64rem', textTransform: 'uppercase', color: isTimeTraveling ? 'rgba(255, 255, 255, 0.6)' : 'var(--text-secondary, #64748b)', display: 'block' }}>
              Tax Zone (§ 32a EStG)
            </span>
            <strong data-testid="live-tax-bracket" style={{ fontSize: '0.84rem', color: 'var(--maison-gold, #c5a059)' }}>
              {liveMetrics.marginalRate}
            </strong>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.64rem', textTransform: 'uppercase', color: isTimeTraveling ? 'rgba(255, 255, 255, 0.6)' : 'var(--text-secondary, #64748b)', display: 'block' }}>
              Wealth Velocity
            </span>
            <strong data-testid="live-wealth-velocity" style={{ fontSize: '0.84rem', color: '#059669' }}>
              {liveMetrics.velocity}
            </strong>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.64rem', textTransform: 'uppercase', color: isTimeTraveling ? 'rgba(255, 255, 255, 0.6)' : 'var(--text-secondary, #64748b)', display: 'block' }}>
              Rentenlücke Gap
            </span>
            <strong data-testid="live-pension-gap" style={{ fontSize: '0.84rem', color: '#b91c1c' }}>
              {liveMetrics.pensionGap}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
