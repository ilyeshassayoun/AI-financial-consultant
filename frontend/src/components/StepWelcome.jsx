import React from 'react';
import { 
  ArrowRight, Shield, Landmark, TrendingUp, Sparkles, CheckCircle2, 
  Scale, PiggyBank, Bot, Lock, Award, ChevronRight, ShieldCheck, 
  BarChart3, Zap, Layers3
} from 'lucide-react';
import { FadeInUp } from './PageTransition';

const stockPath = "M 0 94 C 12 92, 18 86, 26 84 C 34 82, 40 72, 48 68 C 58 64, 64 48, 74 42 C 84 36, 90 18, 100 4";
const stockArea = "M 0 94 C 12 92, 18 86, 26 84 C 34 82, 40 72, 48 68 C 58 64, 64 48, 74 42 C 84 36, 90 18, 100 4 L 100 100 L 0 100 Z";
const secondaryPath = "M 0 98 C 18 96, 32 88, 46 80 C 60 72, 75 58, 88 44 C 94 36, 98 22, 100 14";
const emaPath = "M 0 96 C 25 90, 50 74, 75 48 C 88 34, 95 18, 100 6";

const STATS = [
  { value: '§ 32a', unit: 'EStG', label: 'Statutory Tax Engine', note: 'Progressive tariff & deductions' },
  { value: '1,000', unit: 'Draws', label: 'Monte Carlo Simulations', note: 'Stochastic wealth dispersion' },
  { value: '3-Pillar', unit: 'Model', label: 'Rentenlücke Gap Analysis', note: 'DRV, bAV & private capital' },
  { value: '0.00%', unit: 'Comm.', label: 'Fiduciary Independence', note: '100% fee-only & neutral' },
];

const PILLARS = [
  {
    icon: Shield,
    title: 'Income & Family Protection',
    desc: 'DIN 77230 existential risk defense, occupational disability (BU) sizing, and statutory vs private healthcare headroom.',
    badge: 'DIN 77230',
    metric: 'Full Shield'
  },
  {
    icon: Scale,
    title: 'Statutory Tax Optimization',
    desc: 'Full German progressive income tax engine (§ 32a EStG) with Werbungskosten, Homeoffice-Pauschale, and Vorsorgeaufwand.',
    badge: '§ 32a EStG',
    metric: 'Up to €2,850/yr'
  },
  {
    icon: TrendingUp,
    title: 'Quantitative ETF Laboratory',
    desc: '1,000-draw Monte Carlo simulations with real TER fee drag and § 20 InvStG 30% partial tax exemption modeling.',
    badge: '§ 20 InvStG',
    metric: '+3.4% Alpha'
  },
  {
    icon: PiggyBank,
    title: '3-Pillar Pension Solvency',
    desc: 'Actuarial DRV statutory pension gap modeling with Entgeltpunkte tracking, corporate bAV subsidy, and 4% SWR longevity planning.',
    badge: 'SGB VI',
    metric: '100% Solvency'
  },
];

const TRUST_FACTORS = [
  {
    icon: Lock,
    title: 'Client-Side Data Sovereignty',
    desc: 'Financial calculations are processed transiently. Your personal financial ledger is never monetized, indexed, or sold.'
  },
  {
    icon: Award,
    title: 'Actuarial Precision Standard',
    desc: 'Strictly aligned with DIN 77230 base financial analysis standards and German federal statutory tables (2026 fiscal year).'
  },
  {
    icon: Scale,
    title: 'Full Formula Lineage',
    desc: 'Every projection discloses its exact legal references and calculation mechanics — no black-box advisory formulas.'
  },
  {
    icon: ShieldCheck,
    title: 'GDPR Art. 17 Compliance',
    desc: 'One-click full cryptographic purge of all locally stored audit session profiles with zero trace retention.'
  },
];

export default function StepWelcome({ nextStep }) {
  return (
    <div style={{ 
      position: 'relative', 
      width: '100%',
      display: 'flex', 
      flexDirection: 'column', 
      gap: '64px',
      padding: '24px 0 80px 0',
      maxWidth: '1360px', 
      margin: '0 auto',
      boxSizing: 'border-box'
    }}>
      
      {/* Background Architectural Chart with Animated Traveling Beam */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden'
      }}>
        <svg 
          viewBox="0 0 100 100" 
          preserveAspectRatio="none" 
          style={{ 
            position: 'absolute', 
            width: '100%', 
            height: '100%', 
            inset: 0,
            opacity: 0.85
          }}
        >
          <defs>
            <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--maison-gold)" stopOpacity="0.10" />
              <stop offset="60%" stopColor="var(--maison-gold)" stopOpacity="0.02" />
              <stop offset="100%" stopColor="var(--maison-gold)" stopOpacity="0" />
            </linearGradient>
            
            <linearGradient id="lineGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--border-architectural)" stopOpacity="0.2" />
              <stop offset="45%" stopColor="var(--maison-gold)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="var(--text-primary)" stopOpacity="0.9" />
            </linearGradient>

            <linearGradient id="beamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--maison-gold)" stopOpacity="0" />
              <stop offset="50%" stopColor="var(--maison-gold)" stopOpacity="1" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
            </linearGradient>

            <filter id="goldGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid lines */}
          <line x1="0" y1="25" x2="100" y2="25" stroke="var(--border-architectural)" strokeOpacity="0.15" strokeDasharray="1 3" vectorEffect="non-scaling-stroke" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="var(--border-architectural)" strokeOpacity="0.15" strokeDasharray="1 3" vectorEffect="non-scaling-stroke" />
          <line x1="0" y1="75" x2="100" y2="75" stroke="var(--border-architectural)" strokeOpacity="0.15" strokeDasharray="1 3" vectorEffect="non-scaling-stroke" />

          {/* Area Fill */}
          <path d={stockArea} fill="url(#areaGrad)" />

          {/* Projection Bands */}
          <path d={secondaryPath} fill="none" stroke="var(--maison-gold)" strokeOpacity="0.14" strokeWidth="1.2" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
          <path d={emaPath} fill="none" stroke="var(--maison-gold)" strokeOpacity="0.25" strokeWidth="1.2" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />

          {/* Primary Base Line */}
          <path d={stockPath} fill="none" stroke="url(#lineGrad)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />

          {/* Traveling Pulse Beam */}
          <path 
            d={stockPath} 
            fill="none" 
            stroke="url(#beamGrad)" 
            strokeWidth="3.2" 
            strokeLinejoin="round" 
            strokeLinecap="round" 
            vectorEffect="non-scaling-stroke" 
            pathLength="100" 
            style={{ 
              strokeDasharray: '20 80', 
              animation: 'stockFlow 8s linear infinite',
              filter: 'url(#goldGlow)'
            }} 
          />

          {/* Summit Radar Beacon */}
          <g transform="translate(100, 4)">
            <circle cx="0" cy="0" r="1.5" fill="var(--maison-gold)" />
            <circle cx="0" cy="0" r="3.5" fill="none" stroke="var(--maison-gold)" strokeWidth="0.8" style={{ animation: 'radarPing 3s cubic-bezier(0, 0.2, 0.8, 1) infinite' }} />
            <circle cx="0" cy="0" r="6.5" fill="none" stroke="var(--maison-gold)" strokeOpacity="0.4" strokeWidth="0.6" style={{ animation: 'radarPing 3s cubic-bezier(0, 0.2, 0.8, 1) infinite', animationDelay: '1.2s' }} />
          </g>
        </svg>

        <style>{`
          @keyframes stockFlow {
            0% { stroke-dashoffset: 100; }
            100% { stroke-dashoffset: -100; }
          }
          @keyframes radarPing {
            0% { transform: scale(0.6); opacity: 1; }
            100% { transform: scale(3.5); opacity: 0; }
          }
        `}</style>
      </div>

      {/* SECTION 1: HERO & CORE VALUE PROPOSITION */}
      <div 
        style={{ 
          position: 'relative', 
          zIndex: 1, 
          width: '100%', 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', 
          gap: 'clamp(24px, 4vw, 48px)', 
          alignItems: 'center' 
        }}
      >
        
        {/* Left Hero Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', textAlign: 'left' }}>
          
          <FadeInUp delay={0.06}>
            <div style={{
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '10px',
              background: 'var(--bg-card)', 
              backdropFilter: 'blur(16px)',
              padding: '6px 16px', 
              borderRadius: '30px',
              border: '1px solid var(--maison-gold-border)',
              boxShadow: 'var(--shadow-xs)',
              width: 'fit-content'
            }}>
              <div style={{ 
                width: '20px', 
                height: '20px', 
                borderRadius: '6px', 
                background: 'linear-gradient(135deg, var(--maison-pine-deep), var(--maison-obsidian))', 
                border: '1px solid var(--maison-gold)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <Sparkles size={11} strokeWidth={2.2} color="var(--maison-gold)" />
              </div>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                GERMAN STATUTORY WEALTH PLANNING 2026
              </span>
              <span style={{ width: '1px', height: '11px', background: 'var(--maison-gold)', opacity: 0.4 }} />
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--maison-gold)' }}>
                DIN 77230 · § 32a EStG
              </span>
            </div>
          </FadeInUp>

          <FadeInUp delay={0.12}>
            <h1 style={{ 
              fontSize: 'clamp(2.4rem, 4.2vw, 4.2rem)', 
              lineHeight: '1.08', 
              color: 'var(--text-primary)', 
              margin: 0, 
              letterSpacing: '-0.03em',
              fontWeight: 800
            }}>
              Your German Finances,<br />Built with Institutional Rigor.
            </h1>
          </FadeInUp>

          <FadeInUp delay={0.18}>
            <p style={{ 
              fontSize: '1.05rem', 
              color: 'var(--text-secondary)', 
              lineHeight: '1.65', 
              margin: 0, 
              maxWidth: '620px' 
            }}>
              Independent, fee-only actuarial consultation grounded in German statutory law. Optimize your income tax (§ 32a EStG), close your statutory pension gap (SGB VI), and simulate low-cost ETF portfolios with 1,000 Monte Carlo draws.
            </p>
          </FadeInUp>

          <FadeInUp delay={0.22}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
              <Credential icon={<CheckCircle2 size={16} color="var(--accent-emerald)" />} text="100% Fee-Only &amp; Independent" />
              <Credential icon={<CheckCircle2 size={16} color="var(--accent-emerald)" />} text="German Statutory Tax Engine (§ 32a)" />
              <Credential icon={<CheckCircle2 size={16} color="var(--accent-emerald)" />} text="Monte Carlo Wealth Lab (§ 20 InvStG)" />
            </div>
          </FadeInUp>

          <FadeInUp delay={0.26}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap', marginTop: '6px' }}>
              <button 
                type="button" 
                onClick={nextStep} 
                style={{ 
                  fontSize: '1rem', 
                  fontWeight: 800,
                  padding: '16px 36px', 
                  borderRadius: '30px', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  background: 'linear-gradient(135deg, var(--maison-pine-deep) 0%, var(--maison-obsidian) 100%)',
                  color: '#ffffff',
                  border: '1px solid var(--maison-gold)',
                  boxShadow: '0 4px 20px rgba(197, 160, 89, 0.28)',
                  cursor: 'pointer',
                  transition: 'all 0.25s var(--ease-luxury)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 28px rgba(197, 160, 89, 0.42)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(197, 160, 89, 0.28)';
                }}
              >
                <span>Launch Actuarial Analysis</span>
                <ArrowRight size={18} color="var(--maison-gold)" />
              </button>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Takes ~3 min · 100% Client-Side Private
              </span>
            </div>
          </FadeInUp>
        </div>

        {/* Right Column: 4 Strategic Pillars */}
        <FadeInUp delay={0.16}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px' }}>
            {PILLARS.map((p) => {
              const Icon = p.icon;
              return (
                <div 
                  key={p.title}
                  style={{ 
                    padding: '18px 20px', 
                    borderRadius: '14px', 
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-architectural)',
                    boxShadow: 'var(--shadow-xs)',
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '14px',
                    transition: 'all 0.25s var(--ease-luxury)',
                    cursor: 'default'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.borderColor = 'var(--maison-gold)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'var(--border-architectural)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
                  }}
                >
                  <div style={{ 
                    background: 'rgba(197, 160, 89, 0.12)', 
                    border: '1px solid var(--maison-gold-border)',
                    padding: '10px', 
                    borderRadius: '10px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexShrink: 0 
                  }}>
                    <Icon size={18} color="var(--maison-gold)" strokeWidth={1.8} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {p.title}
                      </span>
                      <span style={{ 
                        fontSize: '0.62rem', 
                        fontFamily: 'var(--font-mono)', 
                        fontWeight: 700, 
                        padding: '2px 7px', 
                        borderRadius: '5px', 
                        background: 'var(--bg-card-subtle)', 
                        color: 'var(--maison-gold)',
                        border: '1px solid var(--border-architectural)'
                      }}>
                        {p.badge}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
                      {p.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </FadeInUp>

      </div>

      {/* SECTION 2: STATUTORY METRICS STRIP */}
      <FadeInUp delay={0.28}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', 
          gap: '16px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-architectural)',
          borderRadius: '18px',
          padding: 'clamp(16px, 3vw, 28px)',
          boxShadow: 'var(--shadow-sm)',
          position: 'relative',
          zIndex: 1
        }}>
          {STATS.map((s, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span className="tabular-nums" style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
                  {s.value}
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--maison-gold)' }}>
                  {s.unit}
                </span>
              </div>
              <span style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {s.label}
              </span>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                {s.note}
              </span>
            </div>
          ))}
        </div>
      </FadeInUp>

      {/* SECTION 3: TRUST & DATA SOVEREIGNTY ARCHITECTURE */}
      <FadeInUp delay={0.34}>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--maison-gold)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              FIDUCIARY GUARANTEE &amp; PRIVACY
            </span>
            <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 1.8rem)', fontWeight: 800, color: 'var(--text-primary)', margin: '6px 0 8px 0', letterSpacing: '-0.02em' }}>
              Engineered for Sovereignty &amp; Transparency
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.55' }}>
              Unlike commission-driven brokers, this platform operates on an open-source mathematical framework with strict client-side data isolation.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '16px' }}>
            {TRUST_FACTORS.map((t) => {
              const Icon = t.icon;
              return (
                <div 
                  key={t.title}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-architectural)',
                    borderRadius: '16px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    textAlign: 'left'
                  }}
                >
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'var(--bg-card-subtle)',
                    border: '1px solid var(--border-architectural)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--maison-gold)'
                  }}>
                    <Icon size={18} strokeWidth={1.75} />
                  </div>
                  <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)', fontWeight: 800 }}>
                    {t.title}
                  </strong>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    {t.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </FadeInUp>

      {/* SECTION 4: FINAL LAUNCH CALLOUT */}
      <FadeInUp delay={0.4}>
        <div style={{
          position: 'relative',
          zIndex: 1,
          background: 'linear-gradient(135deg, var(--maison-obsidian) 0%, #0a1320 100%)',
          border: '1px solid var(--maison-gold)',
          borderRadius: '24px',
          padding: '40px 36px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '24px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          color: '#ffffff'
        }}>
          <div style={{ maxWidth: '640px', textAlign: 'left' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--maison-gold)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              ACTUARIAL FINANCIAL ENGINE
            </span>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '6px 0 8px 0', color: '#ffffff' }}>
              Ready to Stress-Test Your Financial Strategy?
            </h3>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.5' }}>
              Generate your full 360° financial plan across German taxes, insurance shields, ETF investments, and DRV statutory pensions in 3 minutes.
            </p>
          </div>

          <button 
            type="button" 
            onClick={nextStep} 
            style={{ 
              fontSize: '0.96rem', 
              fontWeight: 800,
              padding: '16px 36px', 
              borderRadius: '30px', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '12px',
              background: 'linear-gradient(135deg, var(--maison-gold) 0%, #d4b36a 100%)',
              color: '#060b14',
              border: 'none',
              boxShadow: '0 4px 20px rgba(197, 160, 89, 0.4)',
              cursor: 'pointer',
              transition: 'all 0.25s var(--ease-luxury)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 28px rgba(197, 160, 89, 0.6)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(197, 160, 89, 0.4)';
            }}
          >
            <span>Start Free Analysis</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </FadeInUp>

    </div>
  );
}

function Credential({ icon, text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', color: 'var(--text-primary)', fontWeight: 700 }}>
      {icon} {text}
    </div>
  );
}