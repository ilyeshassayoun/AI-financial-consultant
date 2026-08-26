import React from 'react';
import { ArrowRight, Shield, Landmark, TrendingUp, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';
import { FadeInUp } from './PageTransition';

const stockPath = "M 0 94 C 12 92, 18 86, 26 84 C 34 82, 40 72, 48 68 C 58 64, 64 48, 74 42 C 84 36, 90 18, 100 4";
const stockArea = "M 0 94 C 12 92, 18 86, 26 84 C 34 82, 40 72, 48 68 C 58 64, 64 48, 74 42 C 84 36, 90 18, 100 4 L 100 100 L 0 100 Z";
const secondaryPath = "M 0 98 C 18 96, 32 88, 46 80 C 60 72, 75 58, 88 44 C 94 36, 98 22, 100 14";
const emaPath = "M 0 96 C 25 90, 50 74, 75 48 C 88 34, 95 18, 100 6";

export default function StepWelcome({ nextStep }) {
  return (
    <div style={{ 
      position: 'relative', 
      width: '100%',
      minHeight: '80vh',
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center',
      alignItems: 'center',
      padding: '40px 0 60px 0',
      maxWidth: '1360px', 
      margin: '0 auto',
      boxSizing: 'border-box'
    }}>
      
      {/* Full-Page Scaled Background Architectural Chart */}
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
            {/* Area Gradients */}
            <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--maison-gold)" stopOpacity="0.10" />
              <stop offset="60%" stopColor="var(--maison-gold)" stopOpacity="0.02" />
              <stop offset="100%" stopColor="var(--maison-gold)" stopOpacity="0" />
            </linearGradient>
            
            {/* Structural Line Gradient */}
            <linearGradient id="lineGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--border-architectural)" stopOpacity="0.2" />
              <stop offset="45%" stopColor="var(--maison-gold)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="var(--text-primary)" stopOpacity="0.9" />
            </linearGradient>

            {/* High-Impact Animated Traveling Light Beam */}
            <linearGradient id="beamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--maison-gold)" stopOpacity="0" />
              <stop offset="50%" stopColor="var(--maison-gold)" stopOpacity="1" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
            </linearGradient>

            {/* Glowing Flare Filter */}
            <filter id="goldGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Institutional Horizontal Grid Lines */}
          <line x1="0" y1="25" x2="100" y2="25" stroke="var(--border-architectural)" strokeOpacity="0.15" strokeDasharray="1 3" vectorEffect="non-scaling-stroke" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="var(--border-architectural)" strokeOpacity="0.15" strokeDasharray="1 3" vectorEffect="non-scaling-stroke" />
          <line x1="0" y1="75" x2="100" y2="75" stroke="var(--border-architectural)" strokeOpacity="0.15" strokeDasharray="1 3" vectorEffect="non-scaling-stroke" />

          {/* Area Fill */}
          <path d={stockArea} fill="url(#areaGrad)" />

          {/* Secondary Target Projection Band */}
          <path 
            d={secondaryPath} 
            fill="none" 
            stroke="var(--maison-gold)" 
            strokeOpacity="0.14" 
            strokeWidth="1.2" 
            strokeDasharray="3 4" 
            vectorEffect="non-scaling-stroke" 
          />

          {/* Institutional EMA Trend Curve */}
          <path 
            d={emaPath} 
            fill="none" 
            stroke="var(--maison-gold)" 
            strokeOpacity="0.25" 
            strokeWidth="1.2" 
            strokeDasharray="2 3" 
            vectorEffect="non-scaling-stroke" 
          />

          {/* Primary Base Line */}
          <path 
            d={stockPath} 
            fill="none" 
            stroke="url(#lineGrad)" 
            strokeWidth="2" 
            strokeLinejoin="round" 
            strokeLinecap="round" 
            vectorEffect="non-scaling-stroke" 
          />

          {/* Dynamic Traveling Pulse Energy Beam */}
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

          {/* Animated Summit Beacon Point & Radar Rings */}
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

      {/* 2-Column Content Grid: Left Hero + Right 3 Pillar Cards */}
      <div 
        style={{ 
          position: 'relative', 
          zIndex: 1, 
          width: '100%', 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', 
          gap: '52px', 
          alignItems: 'center' 
        }}
      >
        
        {/* Left Column: Hero & Invitation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', textAlign: 'left' }}>
          
          <FadeInUp delay={0.08}>
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
                AI-Powered Wealth Advisory
              </span>
              <span style={{ width: '1px', height: '11px', background: 'var(--maison-gold)', opacity: 0.4 }} />
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--maison-gold)' }}>
                Personalized &amp; Instant
              </span>
            </div>
          </FadeInUp>

          <FadeInUp delay={0.14}>
            <h1 style={{ 
              fontSize: 'clamp(2.4rem, 4vw, 4rem)', 
              lineHeight: '1.1', 
              color: 'var(--text-primary)', 
              margin: 0, 
              letterSpacing: '-0.028em',
              fontWeight: 800
            }}>
              Your Financial Strategy, Built for Long-Term Growth.
            </h1>
          </FadeInUp>

          <FadeInUp delay={0.2}>
            <p style={{ 
              fontSize: '1.02rem', 
              color: 'var(--text-secondary)', 
              lineHeight: '1.65', 
              margin: 0, 
              maxWidth: '620px' 
            }}>
              Independent consultation for German tax optimization, income protection, and low-cost global ETF investing. No product sales or hidden commissions.
            </p>
          </FadeInUp>

          <FadeInUp delay={0.24}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '18px' }}>
              <Credential icon={<CheckCircle2 size={16} color="var(--accent-emerald)" />} text="100% Fee-Only &amp; Neutral" />
              <Credential icon={<CheckCircle2 size={16} color="var(--accent-emerald)" />} text="German Tax Analysis (§ 32a)" />
              <Credential icon={<CheckCircle2 size={16} color="var(--accent-emerald)" />} text="Global ETF Plan (§ 20 InvStG)" />
            </div>
          </FadeInUp>

          <FadeInUp delay={0.28}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap', marginTop: '6px' }}>
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
                <span>Start 360° Financial Plan</span>
                <ArrowRight size={18} color="var(--maison-gold)" />
              </button>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Takes 3 min · No registration
              </span>
            </div>
          </FadeInUp>
        </div>

        {/* Right Column: Three Pillars */}
        <FadeInUp delay={0.2}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <PillarCard 
              icon={<Shield size={20} color="var(--maison-gold)" strokeWidth={1.8} />} 
              title="Income &amp; Family Protection" 
              desc="Safeguard salary and livelihood against illness, disability, or liability risks."
              badge="DIN 77230"
            />
            <PillarCard 
              icon={<Landmark size={20} color="var(--maison-gold)" strokeWidth={1.8} />} 
              title="Smart German Tax Savings" 
              desc="Maximize refunds via commute, home office, and investment tax exemptions." 
              badge="§ 32a EStG"
            />
            <PillarCard 
              icon={<TrendingUp size={20} color="var(--maison-gold)" strokeWidth={1.8} />} 
              title="Long-Term ETF &amp; Pension Wealth" 
              desc="Build a diversified, low-cost ETF portfolio to close your pension gap." 
              badge="SGB VI / § 20 InvStG"
            />
          </div>
        </FadeInUp>

      </div>

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

function PillarCard({ icon, title, desc, badge }) {
  return (
    <div 
      style={{ 
        padding: '22px 24px', 
        borderRadius: '16px', 
        background: 'var(--bg-card)',
        border: '1px solid var(--border-architectural)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex', 
        alignItems: 'flex-start', 
        gap: '16px',
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
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      }}
    >
      <div style={{ 
        background: 'rgba(197, 160, 89, 0.12)', 
        border: '1px solid var(--maison-gold-border)',
        padding: '12px', 
        borderRadius: '12px', 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0 
      }}>
        {icon}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {title}
          </span>
          {badge && (
            <span style={{ 
              fontSize: '0.62rem', 
              fontFamily: 'var(--font-mono)', 
              fontWeight: 700, 
              padding: '2px 7px', 
              borderRadius: '5px', 
              background: 'var(--bg-card-subtle)', 
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-architectural)'
            }}>
              {badge}
            </span>
          )}
        </div>
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
          {desc}
        </p>
      </div>
    </div>
  );
}