import { useEffect, useRef } from 'react';
import {
  AlertTriangle, ArrowLeft, ArrowRight, BadgeEuro, CalendarClock, CircleAlert,
  FileCheck2, Gauge, Info, Landmark, LineChart, Printer, Scale, ShieldCheck,
  TrendingUp
} from 'lucide-react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart as ReLineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import StressTestFragilityLab from './StressTestFragilityLab';
import './StepRetirement.css';

const pages = [
  ['Mandate', 'Set the retirement income target', Scale],
  ['Pillars', 'Reconcile income in today’s euros', Landmark],
  ['DRV record', 'Audit pension points and access factor', FileCheck2],
  ['Timing', 'Compare retirement-age scenarios', CalendarClock],
  ['Withdrawals', 'Test longevity and sequence risk', LineChart],
  ['Policy', 'Commit to savings and review rules', ShieldCheck]
];
const colors = ['#173d30', '#b38343', '#597c69', '#9aa99f'];
const money = value => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Number(value || 0));
const percent = value => new Intl.NumberFormat('de-DE', { style: 'percent', maximumFractionDigits: 1 }).format(Number(value || 0));

function Metric({ label, value, note }) {
  return <article className="ret-metric"><span>{label}</span><strong>{value}</strong>{note && <small>{note}</small>}</article>;
}

function Field({ label, hint, children }) {
  return <label className="ret-field"><span>{label}</span>{children}<small>{hint}</small></label>;
}

function Scope({ lab }) {
  if (!lab) return null;
  return (
    <details className="ret-scope">
      <summary><Info size={17} /> Assumptions, limitations and official sources</summary>
      <div>
        <ul>{(lab.limitations || []).map(item => <li key={item}>{item}</li>)}</ul>
        <div>{(lab.sources || []).map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label}</a>)}</div>
      </div>
    </details>
  );
}

export default function StepRetirement({
  profile,
  updateProfile,
  nextStep: _nextStep,
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
  const lab = analysis?.retirement_lab;

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    topRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  }, [page]);

  if (!lab) {
    if (analysisStatus === 'error') {
      return (
        <section className="ret-journey animate-fade-in-up" ref={topRef} aria-labelledby="ret-title" style={{ padding: '32px 16px', boxSizing: 'border-box', maxWidth: '100%' }}>
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
              Retirement Analysis Engine Offline
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '20px', lineHeight: 1.5 }}>
              {analysisError || 'Could not reach the statutory retirement adequacy engine. Your inputs remain saved locally.'}
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
    return <div className="ret-loading" role="status"><Gauge size={24} /> Building the retirement adequacy lab…</div>;
  }

  const move = target => setPage(Math.max(0, Math.min(pages.length - 1, target)));
  const activePage = pages[page];
  const PageIcon = activePage[2];
  const pillars = (lab.pillars || []).map(item => ({ ...item, Income: item.real_monthly }));
  const ageScenarios = (lab.retirement_age_scenarios || []).map(item => ({ ...item, Income: item.real_monthly_income, Gap: item.real_gap }));
  const readinessStatus = lab.readiness?.status || 'ready';

  return (
    <section className="ret-journey animate-fade-in-up" ref={topRef} aria-labelledby="ret-title">
      {page === 0 && (
        <header className="ret-hero">
          <div>
            <span className="ret-eyebrow">Germany · DRV reference values July 2026 · today-euro plan</span>
            <h1 id="ret-title">Design retirement income that survives inflation and sequence risk</h1>
            <p>Reconcile statutory entitlements, occupational benefits and private capital on one real-value basis before choosing a savings or withdrawal rule.</p>
          </div>
          <div className={`ret-readiness ${readinessStatus === 'incomplete' ? 'is-incomplete' : ''}`}>
            <ShieldCheck size={20} />
            <div>
              <span>Record readiness</span>
              <strong>{readinessStatus === 'incomplete' ? 'DRV record required' : 'Ready for review'}</strong>
            </div>
          </div>
        </header>
      )}

      <div className="ret-page animate-fade-in-up" key={page}>
        <div className="ret-page-heading">
          <span><PageIcon size={20} /></span>
          <div>
            <small>Step {page + 1} of {pages.length}</small>
            <h2>{activePage[0]}</h2>
            <p>{activePage[1]}</p>
          </div>
        </div>

        {page === 0 && <>
          <div className="ret-metrics">
            <Metric label="Target income today" value={`${money(lab.target?.real_monthly)} / mo`} note={`${percent(lab.target?.replacement_ratio)} of current modelled net income`} />
            <Metric label="Funded income today" value={`${money(lab.totals?.real_monthly)} / mo`} note="All pillars after planning deductions" />
            <Metric label="Unfunded real gap" value={`${money(lab.totals?.real_gap)} / mo`} note={`${percent(lab.totals?.funded_ratio)} target coverage`} />
          </div>
          <div className="ret-two-column">
            <article className="ret-panel ret-panel--focus">
              <h2>Planning horizon</h2>
              <div className="ret-form-stack">
                <Field label={`Retirement age · ${profile?.retirement_age ?? 67}`} hint="Early access requires separate eligibility verification.">
                  <input type="range" min={Math.max((profile?.age ?? 30) + 1, 60)} max="70" step="1" value={profile?.retirement_age ?? 67} onChange={event => updateProfile({ retirement_age: Number(event.target.value) })} />
                </Field>
                <Field label={`Longevity horizon · age ${profile?.longevity_age ?? 95}`} hint="Use a deliberately conservative planning age.">
                  <input type="range" min={Math.max((profile?.retirement_age || 67) + 1, 80)} max="110" step="1" value={profile?.longevity_age ?? 95} onChange={event => updateProfile({ longevity_age: Number(event.target.value) })} />
                </Field>
                <Field label={`Target replacement · ${percent(profile?.target_pension_ratio ?? 0.8)}`} hint="Applied to current modelled monthly net income.">
                  <input type="range" min="0.5" max="1.2" step="0.05" value={profile?.target_pension_ratio ?? 0.8} onChange={event => updateProfile({ target_pension_ratio: Number(event.target.value) })} />
                </Field>
              </div>
            </article>
            <article className="ret-panel">
              <h2>Readiness flags</h2>
              <p>Precise planning begins with the DRV record, not a salary shortcut.</p>
              <div className="ret-flag-list">
                {(lab.readiness?.flags || []).map(item => <div key={item}><CircleAlert size={17} /><span>{item}</span></div>)}
              </div>
            </article>
          </div>
        </>}

        {page === 1 && (
          <div className="ret-two-column ret-two-column--chart">
            <article className="ret-panel ret-chart-panel">
              <h2>Monthly income by pillar</h2>
              <p>After-deduction planning estimates expressed in today’s purchasing power.</p>
              <div className="ret-chart" role="img" aria-label="Real monthly retirement income from statutory, company, private and Riester pillars">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pillars} margin={{ top: 12, right: 12, bottom: 8, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} />
                    <YAxis tickFormatter={value => `${Math.round(value / 1000)}k`} width={42} />
                    <Tooltip formatter={value => money(value)} />
                    <Bar dataKey="Income" radius={[6, 6, 0, 0]} animationDuration={650}>
                      {pillars.map((item, index) => <Cell key={item.id || index} fill={colors[index % colors.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>
            <article className="ret-panel">
              <h2>Real versus nominal</h2>
              <div className="ret-stat-list">
                <div><span>Target today</span><strong>{money(lab.target?.real_monthly)}</strong></div>
                <div><span>Target at retirement, nominal</span><strong>{money(lab.target?.nominal_monthly)}</strong></div>
                <div><span>Income today-euro basis</span><strong>{money(lab.totals?.real_monthly)}</strong></div>
                <div><span>Income at retirement, nominal</span><strong>{money(lab.totals?.nominal_monthly)}</strong></div>
              </div>
              <div className="ret-callout">
                <BadgeEuro size={18} />
                <p>The gap is calculated only between values on the same today-euro basis. Nominal future euros are shown for cash-flow orientation, never mixed into adequacy.</p>
              </div>
            </article>
          </div>
        )}

        {page === 2 && (
          <div className="ret-two-column">
            <article className="ret-panel ret-panel--focus">
              <div className="tax-panel-heading"><FileCheck2 size={20} /><div><h2>DRV entitlement bridge</h2><p>Replace the estimated past record with the Entgeltpunkte from the latest Renteninformation.</p></div></div>
              <div className="ret-big-number"><span>Projected total points</span><strong>{lab.statutory?.ep_total ?? 0}</strong><small>{lab.statutory?.ep_past ?? 0} past + {lab.statutory?.ep_future ?? 0} future points</small></div>
              <Field label="Current recorded Entgeltpunkte" hint="Leave blank only if no DRV record is available.">
                <input type="number" min="0" step="0.01" value={profile?.current_entgeltpunkte ?? ''} placeholder="Not supplied" onChange={event => updateProfile({ current_entgeltpunkte: event.target.value === '' ? null : Number(event.target.value) })} />
              </Field>
            </article>
            <article className="ret-panel">
              <h2>Formula audit</h2>
              <div className="ret-stat-list">
                <div><span>2026 pension value</span><strong>{money(lab.statutory?.pension_value)} / point</strong></div>
                <div><span>Future points / year</span><strong>{lab.statutory?.ep_per_future_year ?? 0}</strong></div>
                <div><span>Access factor</span><strong>{lab.statutory?.access_factor != null ? (typeof lab.statutory.access_factor === 'number' ? lab.statutory.access_factor.toFixed(3) : lab.statutory.access_factor) : '1.000'}</strong></div>
                <div><span>Gross pension, today euros</span><strong>{money(lab.statutory?.real_gross)}</strong></div>
                <div className="is-emphasis"><span>Net planning estimate, today euros</span><strong>{money(lab.statutory?.real_net_estimate)}</strong></div>
              </div>
              <p className="ret-note">Planning deductions: {percent(lab.statutory?.health_care_rate)} health/care + {percent(lab.statutory?.tax_rate)} tax. Actual KVdR/PVdR status and tax depend on the retirement household.</p>
            </article>
          </div>
        )}

        {page === 3 && (
          <div className="ret-two-column ret-two-column--chart">
            <article className="ret-panel ret-chart-panel">
              <h2>Retirement timing trade-off</h2>
              <p>Statutory points, access factor and private accumulation are recalculated for each age.</p>
              <div className="ret-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <ReLineChart data={ageScenarios} margin={{ top: 14, right: 18, bottom: 4, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="age" tickFormatter={value => `Age ${value}`} />
                    <YAxis tickFormatter={value => `${Math.round(value / 1000)}k`} width={42} />
                    <Tooltip formatter={value => money(value)} />
                    <Line type="monotone" dataKey="Income" stroke="#173d30" strokeWidth={3} dot={{ r: 4 }} animationDuration={650} />
                    <Line type="monotone" dataKey="Gap" stroke="#b36b45" strokeWidth={2} strokeDasharray="5 5" />
                  </ReLineChart>
                </ResponsiveContainer>
              </div>
            </article>
            <article className="ret-panel">
              <h2>Scenario register</h2>
              <div className="ret-scenario-list">
                {(lab.retirement_age_scenarios || []).map(item => <div key={item.age}><span>Age {item.age}</span><strong>{money(item.real_monthly_income)} / mo</strong><small>Gap {money(item.real_gap)} · factor {item.access_factor}{item.eligibility_unverified ? ' · eligibility unverified' : ''}</small></div>)}
              </div>
              <div className="ret-callout">
                <CalendarClock size={18} />
                <p>Delaying can add contribution years and a 0.5% monthly statutory bonus after the regular age. Early scenarios still require DRV eligibility confirmation.</p>
              </div>
            </article>
          </div>
        )}

        {page === 4 && <>
          <div className="ret-withdraw-grid">
            {(lab.withdrawal_strategies || []).map(item => <article key={item.rate} className={item.rate === lab.assumptions?.withdrawal_rate ? 'is-selected' : ''}><span>{item.label}</span><strong>{percent(item.rate)}</strong><p>{money(item.real_monthly_income)} / month today</p><div><Gauge size={17} /><b>{percent(item.success_probability)} simulated durability</b></div><button type="button" onClick={() => updateProfile({ safe_withdrawal_rate: item.rate })}>Use this planning rate</button></article>)}
          </div>
          <div className="ret-two-column ret-two-column--chart">
            <article className="ret-panel ret-chart-panel">
              <h2>Private-capital path</h2>
              <p>Deterministic median-return path; contributions and inflation-adjusted capital remain visible.</p>
              <div className="ret-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={lab.timeline || []} margin={{ top: 12, right: 12, bottom: 4, left: 8 }}>
                    <defs>
                      <linearGradient id="retCapital" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--maison-gold)" stopOpacity={.4} />
                        <stop offset="95%" stopColor="var(--maison-gold)" stopOpacity={.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="age" tickFormatter={value => `Age ${value}`} />
                    <YAxis tickFormatter={value => `${Math.round(value / 1000)}k`} width={48} />
                    <Tooltip formatter={value => money(value)} />
                    <Area type="monotone" dataKey="real_capital" name="Today-euro capital" stroke="var(--maison-gold)" fill="url(#retCapital)" strokeWidth={2.5} />
                    <Line type="monotone" dataKey="contributions" stroke="var(--text-secondary)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </article>
            <article className="ret-panel">
              <h2>Tax-aware capital bridge</h2>
              <div className="ret-stat-list">
                <div><span>Gross terminal capital</span><strong>{money(lab.private_capital?.gross)}</strong></div>
                <div><span>Contributions</span><strong>{money(lab.private_capital?.contributions)}</strong></div>
                <div><span>Fund partial exemption</span><strong>− {money(lab.private_capital?.partial_exemption)}</strong></div>
                <div><span>Estimated liquidation tax</span><strong>− {money(lab.private_capital?.estimated_liquidation_tax)}</strong></div>
                <div className="is-emphasis"><span>Net planning capital</span><strong>{money(lab.private_capital?.net)}</strong></div>
              </div>
              <p className="ret-note">The simulation uses {lab.assumptions?.simulation_paths ? lab.assumptions.simulation_paths.toLocaleString() : '1,000'} seeded paths through age {lab.horizon?.longevity_age ?? 95}. Probability is model sensitivity, not a guarantee.</p>
            </article>
          </div>
          <div style={{ marginTop: '24px' }}>
            <StressTestFragilityLab profile={profile} initialMode="decumulation" />
          </div>
        </>}

        {page === 5 && (
          <article className="ret-policy">
            <div className="ret-policy-header">
              <div><span>{lab.model?.name || 'DRV Solvency Model'} · {lab.model?.version || '2026.1'}</span><h2>Retirement funding policy</h2><p>Expressed in today’s euros and prepared from the current profile. Review annually and after any material life event.</p></div>
              <button type="button" className="ret-print-button" onClick={() => window.print()}><Printer size={17} /> Print / Save PDF</button>
            </div>
            <div className="ret-policy-grid">
              <section><h3>Current real gap</h3><strong>{money(lab.totals?.real_gap)} / month</strong><p>{percent(lab.totals?.funded_ratio)} of the target is funded in the model.</p></section>
              <section><h3>Savings requirement</h3><strong>{money(lab.savings_gap?.required_monthly_total)} / month total</strong><p>{money(lab.savings_gap?.additional_monthly)} above the current private contribution.</p></section>
            </div>
            <ol className="ret-action-list">{(lab.actions || []).map((item, index) => <li key={item}><span>{index + 1}</span><p>{item}</p></li>)}</ol>
            <div className="ret-policy-assumptions">
              <div><span>Selected strategy</span><strong>{lab.assumptions?.selected_strategy || 'Balanced'}</strong></div>
              <div><span>Expected return / volatility</span><strong>{percent(lab.assumptions?.expected_nominal_return)} / {percent(lab.assumptions?.expected_volatility)}</strong></div>
              <div><span>Inflation / pension growth</span><strong>{percent(lab.assumptions?.inflation)} / {percent(lab.assumptions?.pension_growth)}</strong></div>
              <div><span>Withdrawal rule</span><strong>{percent(lab.assumptions?.withdrawal_rate)}</strong></div>
            </div>
            <div className="ret-signoff"><div><span>Household review</span><strong>____________________</strong></div><div><span>DRV / adviser review</span><strong>____________________</strong></div><div><span>Next annual review</span><strong>____________________</strong></div></div>
          </article>
        )}

        <Scope lab={lab} />
      </div>

      <footer className="ret-footer">
        <button 
          type="button" 
          className="ret-secondary-button" 
          onClick={() => {
            if (page > 0) move(page - 1);
            else if (prevStep) prevStep();
          }}
          style={{ minHeight: '44px' }}
        >
          <ArrowLeft size={17} /> {page === 0 ? 'Back to Investments' : 'Previous'}
        </button>
        <span>Step {page + 1} of {pages.length}</span>
        {page < pages.length - 1 ? (
          <button type="button" className="ret-primary-button" onClick={() => move(page + 1)} style={{ minHeight: '44px' }}>
            Continue <ArrowRight size={17} />
          </button>
        ) : (
          <button type="button" className="ret-primary-button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ minHeight: '44px' }}>
            Complete Advisory Plan <TrendingUp size={17} />
          </button>
        )}
      </footer>
    </section>
  );
}
