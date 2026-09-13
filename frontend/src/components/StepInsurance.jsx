import { useEffect, useMemo, useRef } from 'react';
import {
  AlertTriangle, ArrowLeft, ArrowRight, Building2, ChevronRight, CircleAlert,
  FileCheck2, HeartPulse, Info, Landmark, Printer, ShieldCheck, Stethoscope,
  Target, Umbrella, WalletCards
} from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import './StepInsurance.css';

const pages = [
  ['Risk map', 'Triage existential exposures', Umbrella],
  ['Income', 'Size disability protection', HeartPulse],
  ['Healthcare', 'Compare GKV and PKV', Stethoscope],
  ['Property', 'Protect assets and liabilities', Building2],
  ['Stress test', 'Test adverse scenarios', Target],
  ['Policy', 'Commit to implementation rules', FileCheck2]
];

const money = value => new Intl.NumberFormat('de-DE', {
  style: 'currency', currency: 'EUR', maximumFractionDigits: 0
}).format(Number(value || 0));

const labels = {
  existential: 'Existential risk',
  material: 'Asset & liability protection',
  participating: 'Convenience / optional cover',
  covered: 'Covered in supplied facts',
  gap: 'Unprotected gap',
  review: 'Review terms',
  not_applicable: 'Not applicable'
};

function Status({ value }) {
  return <span className={`insurance-status insurance-status--${value}`}>{labels[value] || value}</span>;
}

function Metric({ label, value, note }) {
  return <article className="insurance-metric"><span>{label}</span><strong>{value}</strong><small>{note}</small></article>;
}

function RiskRow({ item, onToggle }) {
  const applicable = item.status !== 'not_applicable';
  return (
    <article className={`insurance-risk-row insurance-risk-row--${item.status}`}>
      <div className="insurance-risk-meta">
        <div><Status value={item.status} /><span className="insurance-priority">Priority {item.priority}</span></div>
        <h2>{item.name}</h2>
        <p>{item.why}</p>
        <div className="insurance-decision"><CircleAlert size={15} /><span>{item.decision}</span></div>
      </div>
      <div className="insurance-risk-action">
        <span>Planning target</span><strong>{item.recommended_cover ? money(item.recommended_cover) : '—'}</strong>
        {applicable && <button type="button" className="insurance-link-button" onClick={() => onToggle(item.id)}>{item.status === 'active' ? 'Mark unverified' : 'Mark as existing'}</button>}
      </div>
    </article>
  );
}

function Assumptions({ lab }) {
  if (!lab) return null;
  return (
    <details className="insurance-assumptions">
      <summary><Info size={17} /> Model assumptions and sources</summary>
      <div>
        <ul>{(lab.assumptions || []).map(item => <li key={item}>{item}</li>)}</ul>
        <div className="insurance-source-list">{(lab.sources || []).map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label}</a>)}</div>
      </div>
    </details>
  );
}

export default function StepInsurance({
  profile,
  updateProfile,
  nextStep,
  prevStep,
  analysis,
  subStep: controlledPage,
  setSubStep: setControlledPage,
  analysisStatus,
  analysisError,
  onRetryAnalysis
}) {
  const topRef = useRef(null);
  const page = Math.max(0, Math.min(pages.length - 1, Number(controlledPage || 0)));
  const setPage = setControlledPage || (() => {});
  const lab = analysis?.insurance_lab;

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    topRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  }, [page]);
  const needsById = useMemo(() => Object.fromEntries((lab?.needs || []).map(item => [item.id, item])), [lab]);

  if (!lab) {
    if (analysisStatus === 'error') {
      return (
        <section className="insurance-journey animate-fade-in-up" ref={topRef} aria-labelledby="insurance-title" style={{ padding: '32px 16px', boxSizing: 'border-box', maxWidth: '100%' }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-architectural)',
            borderTop: '3px solid var(--accent-coral)',
            borderRadius: '14px',
            padding: '32px 24px',
            textAlign: 'center',
            maxWidth: '540px',
            margin: '40px auto',
            boxShadow: 'var(--shadow-md)'
          }} role="alert">
            <AlertTriangle size={36} color="var(--accent-coral)" style={{ marginBottom: '16px' }} />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Risk Analysis Engine Offline
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '20px', lineHeight: 1.5 }}>
              {analysisError || 'Could not calculate insurance and human capital risk models. Your inputs remain saved locally.'}
            </p>
            <button
              type="button"
              className="btn-brand"
              onClick={onRetryAnalysis}
              style={{ padding: '10px 24px', borderRadius: '8px', fontWeight: 700, minHeight: '44px', cursor: 'pointer' }}
            >
              Retry Analysis
            </button>
          </div>
        </section>
      );
    }
    return <div className="insurance-loading" role="status"><ShieldCheck size={24} /> Building the protection needs analysis…</div>;
  }

  const togglePolicy = id => {
    const values = profile?.existing_insurances || [];
    const aliases = { liability: 'Liability', bu: 'BU', term_life: 'Risikoleben', contents: 'Contents', building: 'Building', motor: 'Motor', legal: 'Legal' };
    const token = aliases[id] || id;
    const index = values.map(value => String(value).toLowerCase()).indexOf(token.toLowerCase());
    updateProfile({ existing_insurances: index >= 0 ? values.filter((_, itemIndex) => itemIndex !== index) : [...values, token] });
  };
  const move = target => setPage(Math.max(0, Math.min(pages.length - 1, target)));
  const stressData = (lab.income_stress || []).map(item => ({ duration: `${item.months} mo`, Unprotected: item.without_repair, Protected: item.with_target_cover }));
  const activePage = pages[page];
  const PageIcon = activePage[2];

  return (
    <section className="insurance-journey animate-fade-in-up" ref={topRef} aria-labelledby="insurance-title">
      {page === 0 && (
        <header className="insurance-hero">
          <div>
            <span className="insurance-eyebrow">2026 protection architecture · explainable needs model</span>
            <h1 id="insurance-title">Protect the balance sheet in the right order</h1>
            <p>Separate existential risks from convenience cover, quantify each gap, then verify policy wording with a licensed broker or insurer.</p>
          </div>
          <div className={`insurance-readiness insurance-readiness--${lab.readiness || 'ready'}`}>
            <ShieldCheck size={20} />
            <div>
              <span>Execution status</span>
              <strong>{lab.readiness === 'gated' ? 'Gaps must be closed' : 'Ready for broker review'}</strong>
            </div>
          </div>
        </header>
      )}

      <div className="insurance-page animate-fade-in-up" key={page}>
        <div className="insurance-page-heading">
          <span><PageIcon size={20} /></span>
          <div>
            <small>Step {page + 1} of {pages.length}</small>
            <h2>{activePage[0]}</h2>
            <p>{activePage[1]}</p>
          </div>
        </div>

        {/* Sub-Step Indicator Bar */}
        <div style={{
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          paddingBottom: '12px',
          marginBottom: '18px',
          borderBottom: '1px solid var(--border-architectural)',
          scrollbarWidth: 'none'
        }}>
          {pages.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => move(idx)}
              style={{
                background: page === idx ? 'var(--maison-obsidian)' : 'var(--bg-card-subtle)',
                color: page === idx ? '#ffffff' : 'var(--text-secondary)',
                border: page === idx ? '1px solid var(--maison-gold)' : '1px solid var(--border-architectural)',
                padding: '8px 14px',
                minHeight: '44px',
                borderRadius: '8px',
                fontSize: '0.74rem',
                fontWeight: page === idx ? 800 : 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s var(--ease-luxury)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: page === idx ? 'var(--maison-gold)' : 'var(--border-architectural)',
                color: page === idx ? '#060b14' : 'var(--text-secondary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.62rem',
                fontWeight: 800
              }}>
                {idx + 1}
              </span>
              {p[0]}
            </button>
          ))}
        </div>

        {page === 0 && <>
          <div className="insurance-metrics-grid">
            <Metric label="Human capital at risk" value={money(lab.summary?.human_capital_present_value)} note="Present value, not gross salary × years" />
            <Metric label="Essential spending" value={`${money(lab.summary?.essential_monthly_spend)} / mo`} note="Housing, living, mobility and debt" />
            <Metric label="Liquidity reserve" value={lab.summary?.reserve_months == null ? 'Not required' : `${lab.summary.reserve_months} months`} note="Three months is the execution gate when essential spending is positive" />
          </div>
          <div className="insurance-section-intro"><div><h2>Prioritised protection register</h2><p>Scores rank severity and applicability. They are not product ratings.</p></div><span>{(lab.missing_essential || []).length} essential gaps</span></div>
          <div className="insurance-risk-list">{(lab.needs || []).map(item => <RiskRow key={item.id} item={item} onToggle={togglePolicy} />)}</div>
        </>}

        {page === 1 && <div className="insurance-two-column">
          <div className="insurance-panel insurance-panel--focus">
            <div className="insurance-panel-heading"><HeartPulse size={20} /><div><h2>Disability benefit sizing</h2><p>A needs-based target protects essential cash flow without implying underwriting acceptance.</p></div></div>
            <div className="insurance-big-number"><span>Recommended monthly benefit</span><strong>{money(lab.summary?.bu_target_monthly)}</strong></div>
            <label className="insurance-field"><span>Existing BU benefit <strong>{money(profile?.bu_monthly_benefit ?? 0)}</strong></span><input type="range" min="0" max={Math.max(5000, (lab.summary?.bu_target_monthly ?? 2500) * 1.3)} step="50" value={profile?.bu_monthly_benefit || 0} onChange={event => updateProfile({ bu_monthly_benefit: Number(event.target.value) })} /></label>
            <div className="insurance-gap-line"><span>Unprotected monthly gap</span><strong>{money(lab.summary?.bu_gap_monthly)}</strong></div>
            <div className="insurance-callout"><CircleAlert size={18} /><p>Use anonymous risk pre-assessment before applying. Occupation, health history, exclusions and benefit escalation can matter more than the headline premium.</p></div>
          </div>
          <div className="insurance-panel"><h2>What an expert comparison checks</h2><ol className="insurance-check-list">
            <li><span>01</span><div><strong>Trigger definition</strong><p>Occupation-specific inability, forecast period and percentage threshold.</p></div></li>
            <li><span>02</span><div><strong>Contract wording</strong><p>Abstract referral waiver, worldwide cover, exclusions and retrospective benefits.</p></div></li>
            <li><span>03</span><div><strong>Future insurability</strong><p>Guaranteed increases without new medical questions after defined life events.</p></div></li>
            <li><span>04</span><div><strong>Inflation defence</strong><p>Pre-claim premium escalation and post-claim benefit escalation are separate.</p></div></li>
          </ol></div>
        </div>}

        {page === 2 && <div className="insurance-two-column">
          <div className="insurance-panel insurance-panel--focus">
            <div className="insurance-panel-heading"><Landmark size={20} /><div><h2>Eligibility is not suitability</h2><p>The 2026 annual compulsory-insurance threshold is {money(lab.health_decision?.threshold)}.</p></div></div>
            <div className="insurance-health-result"><span>{lab.health_decision?.eligible_for_comparison ? 'Comparison permitted' : 'GKV compulsory for this profile'}</span><strong>{(lab.health_decision?.income_headroom ?? 0) >= 0 ? '+' : ''}{money(lab.health_decision?.income_headroom)} headroom</strong><p>{lab.health_decision?.recommendation || ''}</p></div>
            <div className="insurance-callout"><Info size={18} /><p>{lab.health_decision?.warning || ''}</p></div>
          </div>
          <div className="insurance-panel"><h2>Lifetime decision checklist</h2><div className="insurance-comparison-list">{(lab.health_decision?.compare || []).map((item, index) => <div key={item}><span>{String(index + 1).padStart(2, '0')}</span><strong>{item}</strong><ChevronRight size={17} /></div>)}</div><div className="insurance-foot-metric"><span>Modelled GKV employee health share</span><strong>{money(lab.health_decision?.gkv_employee_health_estimate)} / mo</strong><small>Excludes care insurance and tariff-specific effects.</small></div></div>
        </div>}

        {page === 3 && <div className="insurance-card-grid">
          {['liability', 'term_life', 'building', 'motor', 'contents', 'legal'].map(id => needsById[id]).filter(Boolean).map(item => <article key={item.id} className="insurance-cover-card">
            <div><Status value={item.status} /><span>Priority {item.priority}</span></div><h2>{item.name}</h2><p>{item.why}</p>
            <dl><div><dt>Planning target</dt><dd>{item.recommended_cover ? money(item.recommended_cover) : 'Not applicable'}</dd></div><div><dt>Severity</dt><dd>{item.severity}</dd></div></dl>
            <small>{item.decision}</small>{item.status !== 'not_applicable' && <button type="button" className="insurance-secondary-button" onClick={() => togglePolicy(item.id)}>{item.status === 'active' ? 'Remove verification' : 'Mark as existing'}</button>}
          </article>)}
        </div>}

        {page === 4 && <div className="insurance-two-column insurance-two-column--chart">
          <div className="insurance-panel insurance-chart-panel"><h2>Income-loss capital shortfall</h2><p>Liquid capital consumed when essential spending continues during disability.</p><div className="insurance-chart" role="img" aria-label="Capital shortfall with current and target disability cover for twelve, thirty-six and sixty months"><ResponsiveContainer width="100%" height="100%"><BarChart data={stressData} margin={{ top: 20, right: 8, bottom: 0, left: 8 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="duration" tickLine={false} axisLine={false} /><YAxis tickFormatter={value => `${Math.round(value / 1000)}k`} tickLine={false} axisLine={false} width={48} /><Tooltip formatter={value => money(value)} /><Bar dataKey="Unprotected" fill="var(--accent-coral)" radius={[5, 5, 0, 0]} animationDuration={650} /><Bar dataKey="Protected" fill="var(--accent-emerald)" radius={[5, 5, 0, 0]} animationDuration={650} /></BarChart></ResponsiveContainer></div></div>
          <div className="insurance-panel"><h2>Scenario interpretation</h2><div className="insurance-scenario-list">{(lab.income_stress || []).map(item => <div key={item.months}><span>{item.months} months</span><strong>{money(item.capital_preserved)} preserved</strong><small>at the modelled target benefit</small></div>)}</div><div className="insurance-callout"><WalletCards size={18} /><p>This isolates income risk. It does not model claim probability, insurer acceptance, taxes or waiting-period interactions.</p></div></div>
        </div>}

        {page === 5 && <div className="insurance-policy">
          <div className="insurance-policy-header"><div><span>Household protection policy · {lab.model?.version || '2026.1'}</span><h2>Implementation mandate</h2><p>Prepared from the current household profile. Review after every material life event and at least annually.</p></div><button type="button" className="insurance-print-button" onClick={() => window.print()}><Printer size={17} /> Print / Save PDF</button></div>
          <div className="insurance-policy-grid"><section><h3>Execution gate</h3><strong>{lab.readiness === 'gated' ? 'Do not treat protection as complete' : 'Proceed to broker and policy review'}</strong><p>{(lab.missing_essential || []).length ? `Open essential gaps: ${lab.missing_essential.join(', ')}.` : 'No essential gap is visible from the supplied profile.'}</p></section><section><h3>Benefit targets</h3><strong>{money(lab.summary?.bu_target_monthly)} BU / month</strong><p>{lab.summary?.term_life_need ? `${money(lab.summary.term_life_need)} term-life capital target.` : 'No dependant-based term-life target modelled.'}</p></section></div>
          <ol className="insurance-implementation-list">{(lab.implementation || []).map((item, index) => <li key={item}><span>{index + 1}</span><p>{item}</p></li>)}</ol>
          <div className="insurance-signoff"><div><span>Household review</span><strong>________________________</strong></div><div><span>Broker / adviser review</span><strong>________________________</strong></div><div><span>Next annual review</span><strong>________________________</strong></div></div>
        </div>}

        <Assumptions lab={lab} />
      </div>

      <footer className="insurance-footer-nav">
        <button 
          type="button" 
          className="insurance-secondary-button" 
          onClick={() => {
            if (page > 0) move(page - 1);
            else if (prevStep) prevStep();
          }}
          style={{ minHeight: '44px' }}
        >
          <ArrowLeft size={17} /> {page === 0 ? 'Back to Mandate' : 'Previous'}
        </button>
        <span>Step {page + 1} of {pages.length}</span>
        {page < pages.length - 1 ? (
          <button type="button" className="insurance-primary-button" onClick={() => move(page + 1)} style={{ minHeight: '44px' }}>
            Continue <ArrowRight size={17} />
          </button>
        ) : (
          <button type="button" className="insurance-primary-button" onClick={nextStep} style={{ minHeight: '44px' }}>
            Proceed to Tax Optimization <ArrowRight size={17} />
          </button>
        )}
      </footer>
    </section>
  );
}
