import React from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  PiggyBank,
  Scale,
  Shield,
  TrendingUp,
} from 'lucide-react';
import { FadeInUp } from './PageTransition';
import './StepWelcome.css';

const STATS = [
  { value: '§ 32a', unit: 'EStG', label: 'Statutory tax engine' },
  { value: '600', unit: 'draws', label: 'Simulation depth' },
  { value: '3-pillar', unit: 'model', label: 'Retirement planning' },
  { value: '0.00%', unit: 'fees', label: 'Product commissions' },
];

const PILLARS = [
  {
    icon: Shield,
    title: 'Protect your income',
    description: 'Prioritise existential risks and close the protection gaps that matter.',
  },
  {
    icon: Scale,
    title: 'Pay the right tax',
    description: 'Surface practical German tax opportunities with transparent assumptions.',
  },
  {
    icon: TrendingUp,
    title: 'Invest with confidence',
    description: 'Compare diversified strategies, drawdowns and goal probabilities.',
  },
  {
    icon: PiggyBank,
    title: 'Plan your retirement',
    description: 'Connect statutory, occupational and private income into one plan.',
  },
];

export default function StepWelcome({ nextStep, hasSavedProgress = false }) {
  return (
    <div className="welcome-shell">
      <FadeInUp delay={0.08}>
        <section className="welcome-hero" aria-labelledby="welcome-title">
          <div className="welcome-hero__copy">
            <span className="welcome-eyebrow">Independent financial planning · Germany</span>
            <h1 id="welcome-title">A clearer plan for every financial decision.</h1>
            <p className="welcome-hero__lead">
              Connect taxes, protection, investments and retirement in one evidence-led
              advisory plan—built around your household, not a product catalogue.
            </p>

            <div className="welcome-credentials" aria-label="Advisory principles">
              <span><CheckCircle2 aria-hidden="true" /> Independent and fee-only</span>
              <span><CheckCircle2 aria-hidden="true" /> Transparent calculations</span>
            </div>

            <div className="welcome-hero__actions">
              <button type="button" className="welcome-primary-action" onClick={nextStep}>
                {hasSavedProgress ? 'Continue my financial plan' : 'Build my financial plan'}
                <ArrowRight aria-hidden="true" />
              </button>
              <span className="welcome-duration">{hasSavedProgress ? 'Resume where you left off' : '8–10 minutes'} · No product commissions</span>
            </div>
          </div>

          <aside className="welcome-snapshot" aria-label="Planning desk overview">
            <div className="welcome-snapshot__heading">
              <span>Your planning desk</span>
              <h2>One plan. Four decisions.</h2>
            </div>

            <div className="welcome-snapshot__metrics">
              <SnapshotMetric icon={Scale} value="§ 32a" label="German tax engine" />
              <SnapshotMetric icon={Clock3} value="600" label="Simulation draws" />
            </div>

            <div className="welcome-fee-proof">
              <span>Product commissions</span>
              <strong>0.00%</strong>
            </div>
          </aside>

          <svg className="welcome-hero__signal" viewBox="0 0 420 150" aria-hidden="true">
            <path className="welcome-signal__guide" d="M0 132 C75 128 115 108 165 105 C220 101 245 71 292 66 C342 60 362 34 420 12" />
            <path className="welcome-signal__line" d="M0 132 C75 128 115 108 165 105 C220 101 245 71 292 66 C342 60 362 34 420 12" />
          </svg>
        </section>
      </FadeInUp>

      <section className="welcome-outcomes" aria-labelledby="outcomes-title">
        <div className="welcome-section-heading">
          <span className="welcome-eyebrow">Your advisory mandate</span>
          <h2 id="outcomes-title">Four decisions, resolved in the right order.</h2>
        </div>

        <div className="welcome-outcomes__grid">
          {PILLARS.map((pillar, index) => {
            const Icon = pillar.icon;
            return (
              <FadeInUp key={pillar.title} delay={0.12 + index * 0.045}>
                <article className="welcome-outcome-card">
                  <div className="welcome-outcome-card__topline">
                    <span className="welcome-outcome-card__icon"><Icon aria-hidden="true" /></span>
                    <span className="welcome-outcome-card__index">0{index + 1}</span>
                  </div>
                  <h3>{pillar.title}</h3>
                  <p>{pillar.description}</p>
                </article>
              </FadeInUp>
            );
          })}
        </div>
      </section>

      <FadeInUp delay={0.2}>
        <section className="welcome-proof" aria-label="Planning methodology">
          {STATS.map((stat) => (
            <div className="welcome-proof__metric" key={stat.label}>
              <div>
                <strong>{stat.value}</strong>
                <span>{stat.unit}</span>
              </div>
              <p>{stat.label}</p>
            </div>
          ))}
        </section>
      </FadeInUp>
    </div>
  );
}

function SnapshotMetric({ icon: Icon, value, label }) {
  return (
    <div className="welcome-snapshot-metric">
      <Icon aria-hidden="true" />
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
