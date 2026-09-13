import React, { useCallback } from 'react';
import { 
  TrendingUp, PiggyBank, Bot, ChevronRight, CheckCircle2,
  Sparkles, Lock, ArrowUpRight, Scale, Landmark, Star, Award
} from 'lucide-react';

const features = [
  {
    icon: TrendingUp,
    title: 'Quantitative Investment Lab',
    description: '1,000-draw Monte Carlo stochastic simulations with Cholesky asset correlation. Real TER fee-drag modeling and § 20 InvStG 30% partial tax exemption.',
    badge: '§ 20 InvStG',
    metric: '+3.4% Net Alpha'
  },
  {
    icon: Scale,
    title: 'Statutory Tax Optimization',
    description: 'Full German progressive income tax engine (§ 32a EStG) with Werbungskosten, Homeoffice-Pauschale, Vorsorgeaufwendungen, and Splittingtarif.',
    badge: '§ 32a EStG',
    metric: 'Up to €2,850/yr'
  },
  {
    icon: PiggyBank,
    title: '3-Pillar Pension Solvency',
    description: 'Actuarial DRV statutory pension gap modeling with real Entgeltpunkte valuation, bAV corporate subsidy optimization, and 4% SWR longevity planning.',
    badge: 'SGB VI · DIN 77230',
    metric: '100% Solvency Plan'
  },
  {
    icon: Bot,
    title: 'AI Private Wealth Concierge',
    description: 'Real-time streaming advisory desk grounded in German statutory law. Every calculation cites its exact legal basis — explainable and verified.',
    badge: 'RAG-Grounded',
    metric: 'Instant Insights'
  },
];

const stats = [
  { value: '§ 32a', unit: 'EStG', label: 'Statutory Tax Engine' },
  { value: '1,000', unit: 'Scenarios', label: 'Monte Carlo Simulations' },
  { value: '3-Pillar', unit: 'Model', label: 'Rentenlücke Gap Analysis' },
  { value: '0.00%', unit: 'Commission', label: 'Fiduciary Independence' },
];

const trustPillars = [
  {
    icon: Lock,
    title: 'Client-Side Data Sovereignty',
    desc: 'Audit calculations are processed transiently. Your personal financial ledger is never monetized, indexed, or sold.'
  },
  {
    icon: Award,
    title: 'Actuarial Precision Standard',
    desc: 'Aligned with DIN 77230 base financial analysis standards and German federal statutory tables (2026 fiscal year).'
  },
  {
    icon: Scale,
    title: 'Full Formula Lineage',
    desc: 'Every projection discloses its exact legal references and calculation mechanics — no black-box advisory formulas.'
  },
  {
    icon: CheckCircle2,
    title: 'GDPR Art. 17 Compliance',
    desc: 'One-click full cryptographic purge of all locally stored audit session profiles with zero trace retention.'
  },
];

const testimonials = [
  {
    quote: 'The tax bridge and Werbungskosten simulation showed me exactly where I was leaking capital across federal brackets.',
    author: 'Principal Software Architect',
    location: 'Munich, Bavaria',
    focus: 'Tax Alpha & ETF Strategy'
  },
  {
    quote: 'The Monte Carlo retirement lab completely changed my portfolio horizon. Seeing sequence-of-returns risk quantified is invaluable.',
    author: 'Managing Director',
    location: 'Frankfurt am Main',
    focus: 'Rentenlücke & Asset Allocation'
  },
  {
    quote: 'Finally a German wealth consultation platform with institutional rigor. Explains the exact statutory rationale behind every recommendation.',
    author: 'Senior Medical Consultant',
    location: 'Hamburg',
    focus: 'PKV Decision & Liability Defense'
  },
];

export default function LandingPage({ onGetStarted }) {
  const handleStart = useCallback(() => {
    if (onGetStarted) {
      onGetStarted();
    } else {
      window.location.href = '/app';
    }
  }, [onGetStarted]);

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--color-obsidian-950, #060b14)', 
      color: '#f8fafc', 
      fontFamily: 'var(--font-body)',
      overflowX: 'hidden'
    }}>
      
      {/* Background Architectural Ambient Glow */}
      <div style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        background: `
          radial-gradient(circle at 50% -10%, rgba(197, 160, 89, 0.15), transparent 50%),
          radial-gradient(circle at 90% 40%, rgba(16, 28, 46, 0.6), transparent 40%),
          radial-gradient(circle at 10% 80%, rgba(197, 160, 89, 0.06), transparent 40%)
        `,
      }} />

      {/* Top Header / Brand Navigation */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 48px',
        borderBottom: '1px solid rgba(226, 210, 176, 0.15)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(6, 11, 20, 0.88)',
        backdropFilter: 'blur(16px)',
      }}>
        {/* Brand Crest & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #101c2e, #060b14)',
            border: '1px solid var(--maison-gold, #c5a059)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(197, 160, 89, 0.2)'
          }}>
            <Landmark size={18} color="var(--maison-gold, #c5a059)" />
          </div>
          <div>
            <div style={{ 
              fontFamily: 'var(--font-serif)', 
              fontStyle: 'italic', 
              fontWeight: 700, 
              fontSize: '1.25rem', 
              color: '#f8fafc',
              letterSpacing: '-0.02em',
              lineHeight: 1.1
            }}>
              Ilyes H.
            </div>
            <div style={{ 
              fontSize: '0.62rem', 
              color: 'var(--maison-gold, #c5a059)', 
              letterSpacing: '0.12em', 
              fontWeight: 700, 
              textTransform: 'uppercase' 
            }}>
              Private Wealth Advisory
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button 
            onClick={handleStart}
            style={{
              padding: '10px 24px',
              borderRadius: 8,
              border: '1px solid var(--maison-gold, #c5a059)',
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #101c2e 0%, #1e2f47 100%)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: 13,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 2px 14px rgba(197, 160, 89, 0.2)',
              transition: 'all 0.25s var(--ease-luxury)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-1.5px)';
              e.currentTarget.style.boxShadow = '0 4px 22px rgba(197, 160, 89, 0.35)';
              e.currentTarget.style.borderColor = '#dfc27d';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 14px rgba(197, 160, 89, 0.2)';
              e.currentTarget.style.borderColor = 'var(--maison-gold, #c5a059)';
            }}
          >
            Launch Advisory Desk <ArrowUpRight size={15} color="var(--maison-gold, #c5a059)" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ 
        position: 'relative', 
        zIndex: 1, 
        textAlign: 'center', 
        padding: '90px 32px 70px', 
        maxWidth: 1040, 
        margin: '0 auto' 
      }}>
        {/* Eyebrow Pill */}
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: 10,
          padding: '6px 18px', 
          borderRadius: 100, 
          background: 'rgba(197, 160, 89, 0.1)', 
          border: '1px solid rgba(197, 160, 89, 0.35)', 
          fontSize: 12, 
          fontWeight: 700, 
          color: 'var(--maison-gold, #c5a059)', 
          marginBottom: 28, 
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          boxShadow: '0 0 20px rgba(197, 160, 89, 0.12)'
        }}>
          <Sparkles size={13} color="var(--maison-gold, #c5a059)" />
          <span>Statutory German Wealth Advisory · 2026 Fiscal Framework</span>
        </div>

        {/* Main Headline */}
        <h1 style={{ 
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(2.5rem, 5.2vw, 4.4rem)', 
          fontWeight: 700, 
          lineHeight: 1.1, 
          letterSpacing: '-0.02em', 
          marginBottom: 24, 
          color: '#ffffff',
          textShadow: '0 2px 20px rgba(0,0,0,0.5)'
        }}>
          Statutory Precision.<br />
          <span style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #dfc27d 60%, #c5a059 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontStyle: 'italic',
            fontFamily: 'var(--font-serif)'
          }}>
            Private Wealth Engineering.
          </span>
        </h1>

        {/* Description */}
        <p style={{ 
          fontSize: '1.15rem', 
          color: 'rgba(241, 245, 249, 0.72)', 
          maxWidth: 720, 
          margin: '0 auto 40px', 
          lineHeight: 1.7,
          fontWeight: 400
        }}>
          Institutional financial modeling for German professionals and expatriates. 
          Deterministic tax bracket arbitrage (§ 32a EStG), DRV pension gap liquidation, and 
          multi-scenario Monte Carlo ETF simulations — private, sovereign, and explainable.
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={handleStart}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: 10, 
              padding: '16px 38px', 
              borderRadius: 10, 
              border: '1px solid var(--maison-gold, #c5a059)', 
              cursor: 'pointer', 
              background: 'linear-gradient(135deg, #101c2e 0%, #1e3350 100%)', 
              color: '#ffffff', 
              fontWeight: 700, 
              fontSize: 16, 
              boxShadow: '0 4px 28px rgba(197, 160, 89, 0.28)', 
              transition: 'all 0.25s var(--ease-luxury)' 
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 36px rgba(197, 160, 89, 0.45)';
              e.currentTarget.style.borderColor = '#dfc27d';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 28px rgba(197, 160, 89, 0.28)';
              e.currentTarget.style.borderColor = 'var(--maison-gold, #c5a059)';
            }}
          >
            Start Free Consultation <ChevronRight size={18} color="var(--maison-gold, #c5a059)" />
          </button>
        </div>

        {/* Micro Guarantee */}
        <div style={{ 
          marginTop: 24, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: 20, 
          fontSize: 12, 
          color: 'rgba(241, 245, 249, 0.5)',
          flexWrap: 'wrap'
        }}>
          <span>✦ Zero Sales Commission</span>
          <span>✦ 100% Client-Side Privacy</span>
          <span>✦ DIN 77230 Actuarial Standards</span>
        </div>
      </section>

      {/* Institutional Stats Bar */}
      <section style={{ 
        position: 'relative', 
        zIndex: 1, 
        display: 'flex', 
        justifyContent: 'center', 
        borderTop: '1px solid rgba(226, 210, 176, 0.12)', 
        borderBottom: '1px solid rgba(226, 210, 176, 0.12)', 
        background: 'rgba(10, 18, 30, 0.65)',
        padding: '36px 20px', 
        flexWrap: 'wrap', 
        gap: 0 
      }}>
        {stats.map((s, i) => (
          <div 
            key={i} 
            style={{ 
              textAlign: 'center', 
              padding: '0 44px', 
              borderRight: i < stats.length - 1 ? '1px solid rgba(226, 210, 176, 0.12)' : 'none',
              minWidth: 180
            }}
          >
            <div style={{ 
              fontSize: '2.4rem', 
              fontWeight: 800, 
              color: 'var(--maison-gold, #c5a059)', 
              letterSpacing: '-0.03em',
              fontFamily: 'var(--font-mono)'
            }}>
              {s.value}
            </div>
            <div style={{ fontSize: 13, color: '#f8fafc', marginTop: 4, fontWeight: 700 }}>
              {s.label}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(241, 245, 249, 0.45)', marginTop: 2 }}>
              {s.unit}
            </div>
          </div>
        ))}
      </section>

      {/* Advisory Pillars Grid */}
      <section style={{ 
        position: 'relative', 
        zIndex: 1, 
        maxWidth: 1240, 
        margin: '0 auto', 
        padding: '100px 32px' 
      }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <div style={{ 
            fontSize: 12, 
            fontWeight: 700, 
            color: 'var(--maison-gold, #c5a059)', 
            letterSpacing: '0.1em', 
            textTransform: 'uppercase',
            marginBottom: 10 
          }}>
            Institutional Wealth Modules
          </div>
          <h2 style={{ 
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', 
            fontWeight: 700, 
            color: '#ffffff',
            letterSpacing: '-0.02em',
            margin: 0
          }}>
            Built on Verifiable Statutory Frameworks
          </h2>
          <p style={{ 
            fontSize: 16, 
            color: 'rgba(241, 245, 249, 0.65)', 
            maxWidth: 580, 
            margin: '12px auto 0' 
          }}>
            Every recommendation is calculated deterministically from statutory formulas and mathematical simulation models.
          </p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: 24 
        }}>
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div 
                key={i}
                style={{ 
                  background: 'rgba(16, 28, 46, 0.65)', 
                  border: '1px solid rgba(226, 210, 176, 0.15)', 
                  borderRadius: 18, 
                  padding: 32, 
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.25s var(--ease-luxury)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.25)'
                }}
                onMouseEnter={e => { 
                  e.currentTarget.style.borderColor = 'rgba(197, 160, 89, 0.5)'; 
                  e.currentTarget.style.background = 'rgba(20, 35, 58, 0.85)';
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(197, 160, 89, 0.18)';
                }}
                onMouseLeave={e => { 
                  e.currentTarget.style.borderColor = 'rgba(226, 210, 176, 0.15)'; 
                  e.currentTarget.style.background = 'rgba(16, 28, 46, 0.65)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.25)';
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: 'rgba(197, 160, 89, 0.12)',
                      border: '1px solid rgba(197, 160, 89, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Icon size={22} color="var(--maison-gold, #c5a059)" />
                    </div>
                    <span style={{ 
                      fontSize: 11, 
                      fontWeight: 700, 
                      padding: '4px 10px', 
                      borderRadius: 100, 
                      background: 'rgba(197, 160, 89, 0.12)', 
                      border: '1px solid rgba(197, 160, 89, 0.3)', 
                      color: 'var(--maison-gold, #c5a059)', 
                      letterSpacing: '0.04em' 
                    }}>
                      {f.badge}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 19, fontWeight: 700, marginBottom: 10, color: '#ffffff' }}>
                    {f.title}
                  </h3>
                  <p style={{ fontSize: 14, color: 'rgba(241, 245, 249, 0.65)', lineHeight: 1.65 }}>
                    {f.description}
                  </p>
                </div>

                <div style={{ 
                  marginTop: 24, 
                  paddingTop: 16, 
                  borderTop: '1px solid rgba(226, 210, 176, 0.1)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between' 
                }}>
                  <span style={{ fontSize: 12, color: 'rgba(241, 245, 249, 0.5)' }}>Target Benchmark</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--maison-gold, #c5a059)', fontFamily: 'var(--font-mono)' }}>
                    {f.metric}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Trust & Governance Section */}
      <section style={{ 
        position: 'relative', 
        zIndex: 1, 
        background: 'rgba(10, 18, 30, 0.5)', 
        borderTop: '1px solid rgba(226, 210, 176, 0.12)', 
        borderBottom: '1px solid rgba(226, 210, 176, 0.12)', 
        padding: '80px 32px' 
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ 
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', 
              fontWeight: 700, 
              color: '#ffffff',
              margin: 0 
            }}>
              Institutional Governance &amp; Privacy
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(241, 245, 249, 0.6)', marginTop: 8 }}>
              Built for discerning clients who demand confidentiality, mathematical rigor, and fiduciary purity.
            </p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
            gap: 24 
          }}>
            {trustPillars.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} style={{ display: 'flex', gap: 14 }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'rgba(197, 160, 89, 0.12)',
                    border: '1px solid rgba(197, 160, 89, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 2
                  }}>
                    <Icon size={16} color="var(--maison-gold, #c5a059)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, color: '#f8fafc' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: 13, color: 'rgba(241, 245, 249, 0.6)', lineHeight: 1.6 }}>
                      {item.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Case Studies / Testimonials */}
      <section style={{ 
        position: 'relative', 
        zIndex: 1, 
        maxWidth: 1200, 
        margin: '0 auto', 
        padding: '90px 32px' 
      }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ 
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', 
            fontWeight: 700, 
            color: '#ffffff',
            margin: 0 
          }}>
            Client Experiences
          </h2>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: 24 
        }}>
          {testimonials.map((t, i) => (
            <div 
              key={i} 
              style={{ 
                background: 'rgba(16, 28, 46, 0.65)', 
                border: '1px solid rgba(226, 210, 176, 0.15)', 
                borderRadius: 16, 
                padding: 30,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={14} fill="var(--maison-gold, #c5a059)" color="var(--maison-gold, #c5a059)" />
                  ))}
                </div>
                <p style={{ 
                  fontSize: 15, 
                  color: 'rgba(241, 245, 249, 0.85)', 
                  lineHeight: 1.65, 
                  marginBottom: 20,
                  fontStyle: 'italic'
                }}>
                  "{t.quote}"
                </p>
              </div>

              <div style={{ borderTop: '1px solid rgba(226, 210, 176, 0.1)', paddingTop: 14 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  {t.author}
                </p>
                <p style={{ fontSize: 12, color: 'var(--maison-gold, #c5a059)', margin: '2px 0 0', fontWeight: 600 }}>
                  {t.location} · {t.focus}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section style={{ 
        position: 'relative', 
        zIndex: 1, 
        textAlign: 'center', 
        padding: '80px 32px 110px', 
        background: 'linear-gradient(180deg, transparent, rgba(197, 160, 89, 0.08))' 
      }}>
        <h2 style={{ 
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(2rem, 4vw, 3rem)', 
          fontWeight: 700, 
          letterSpacing: '-0.02em', 
          marginBottom: 16,
          color: '#ffffff'
        }}>
          Initiate Your Confidential Advisory
        </h2>
        <p style={{ fontSize: 16, color: 'rgba(241, 245, 249, 0.65)', marginBottom: 36 }}>
          Instant comprehensive audit. Zero account friction. Full client sovereignty.
        </p>
        <button 
          onClick={handleStart}
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 10, 
            padding: '18px 48px', 
            borderRadius: 12, 
            border: '1px solid var(--maison-gold, #c5a059)', 
            cursor: 'pointer', 
            background: 'linear-gradient(135deg, #101c2e 0%, #1e3350 100%)', 
            color: '#ffffff', 
            fontWeight: 700, 
            fontSize: 17, 
            boxShadow: '0 4px 36px rgba(197, 160, 89, 0.35)', 
            transition: 'all 0.25s var(--ease-luxury)' 
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 48px rgba(197, 160, 89, 0.55)';
            e.currentTarget.style.borderColor = '#dfc27d';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 36px rgba(197, 160, 89, 0.35)';
            e.currentTarget.style.borderColor = 'var(--maison-gold, #c5a059)';
          }}
        >
          Open Client Advisory Desk <ChevronRight size={20} color="var(--maison-gold, #c5a059)" />
        </button>
      </section>

      {/* Footer */}
      <footer style={{ 
        position: 'relative', 
        zIndex: 1, 
        borderTop: '1px solid rgba(226, 210, 176, 0.12)', 
        padding: '36px 48px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: 16,
        background: 'rgba(6, 11, 20, 0.95)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Landmark size={18} color="var(--maison-gold, #c5a059)" />
          <span style={{ 
            fontFamily: 'var(--font-serif)', 
            fontStyle: 'italic', 
            fontWeight: 700, 
            fontSize: 15,
            color: '#f8fafc'
          }}>
            Ilyes H. Private Wealth
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(241, 245, 249, 0.4)', maxWidth: 540, textAlign: 'center' }}>
          Statutory financial educational modeling platform. Calculations are based on German statutory frameworks (EStG, SGB, InvStG). Consult a certified Steuerberater for formal filing.
        </div>
        <div style={{ fontSize: 12, color: 'rgba(241, 245, 249, 0.4)' }}>
          © {new Date().getFullYear()} Ilyes Private Wealth Advisory
        </div>
      </footer>
    </div>
  );
}
