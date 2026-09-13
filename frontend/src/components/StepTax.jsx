import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, ArrowRight, BadgeEuro, BriefcaseBusiness, CircleAlert,
  FileCheck2, Info, Landmark, LineChart, Printer, ReceiptText, Scale,
  ShieldCheck, Users
} from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import SankeyTaxFlow from './SankeyTaxFlow';
import './StepTax.css';

const pages = [
  ['Readiness', 'Confirm the assessment facts', FileCheck2],
  ['Liability', 'Trace gross income to net cash', Landmark],
  ['Deductions', 'Test evidence-backed scenarios', BriefcaseBusiness],
  ['Household', 'Review social insurance and family rules', Users],
  ['Investments', 'Estimate taxable capital income', LineChart],
  ['Tax memo', 'Turn findings into an evidence plan', ReceiptText]
];

const money = value => new Intl.NumberFormat('de-DE', {
  style: 'currency', currency: 'EUR', maximumFractionDigits: 0
}).format(Number(value || 0));
const percent = value => `${(Number(value || 0) * 100).toFixed(1)}%`;

function Metric({ label, value, note }) {
  return <article className="tax-metric"><span>{label}</span><strong>{value}</strong>{note && <small>{note}</small>}</article>;
}

function Sources({ lab }) {
  return (
    <details className="tax-sources">
      <summary><Info size={17} /> Model scope, limitations and official sources</summary>
      <div>
        <ul>{lab.limitations?.map(item => <li key={item}>{item}</li>)}</ul>
        <div>{lab.sources?.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label}</a>)}</div>
      </div>
    </details>
  );
}

function Field({ label, hint, children }) {
  return <label className="tax-field"><span>{label}</span>{children}<small>{hint}</small></label>;
}

export default function StepTax({ profile, updateProfile, nextStep, prevStep, analysis, subStep: controlledPage, setSubStep: setControlledPage }) {
  const topRef = useRef(null);
  const [page1View, setPage1View] = useState('waterfall');
  const page = Math.max(0, Math.min(pages.length - 1, Number(controlledPage || 0)));
  const setPage = setControlledPage || (() => {});
  const lab = analysis?.tax_lab;

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    topRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  }, [page]);
  if (!lab) return <div className="tax-loading" role="status"><Scale size={24} /> Building the 2026 tax scenario lab…</div>;

  const move = target => setPage(Math.max(0, Math.min(pages.length - 1, target)));
  const activePage = pages[page];
  const PageIcon = activePage[2];
  const incomplete = lab.input_flags?.some(flag => /missing|limited/i.test(flag));
  const scenarioData = lab.scenarios.map(item => ({ ...item, Tax: item.annual_tax }));

  return (
    <section className="tax-journey animate-fade-in-up" ref={topRef} aria-labelledby="tax-title">
      {page === 0 && (
        <header className="tax-hero">
          <div>
            <span className="tax-eyebrow">Germany · tax year 2026 · deterministic planning estimate</span>
            <h1 id="tax-title">Build a defensible tax position from verified facts</h1>
            <p>Separate assessed liability from payroll withholding, compare full recalculations, and leave every material assumption visible.</p>
          </div>
          <div className={`tax-readiness ${incomplete ? 'is-incomplete' : ''}`}>
            <ShieldCheck size={20} />
            <div>
              <span>Model readiness</span>
              <strong>{incomplete ? 'Inputs need review' : 'Core facts consistent'}</strong>
            </div>
          </div>
        </header>
      )}

      <div className="tax-page animate-fade-in-up" key={page}>
        <div className="tax-page-heading">
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
                padding: '6px 12px',
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
                width: '16px',
                height: '16px',
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
          <div className="tax-metrics">
            <Metric label="Taxable income" value={money(lab.headline.taxable_income)} note="Modelled zvE, not gross salary" />
            <Metric label="Assessed tax" value={money(lab.headline.assessed_tax)} note="No refund can be inferred without withholding" />
            <Metric label="Marginal rate" value={percent(lab.headline.marginal_tax_rate)} note="Finite-difference estimate near current zvE" />
          </div>
          <div className="tax-two-column">
            <article className="tax-panel tax-panel--focus"><div className="tax-panel-heading"><Scale size={20} /><div><h2>Assessment basis</h2><p>{lab.assessment.warning}</p></div></div><dl className="tax-definition-list"><div><dt>Mode</dt><dd>{String(lab.assessment.mode || '').replaceAll('_', ' ')}</dd></div><div><dt>Payroll class</dt><dd>Steuerklasse {lab.assessment.withholding_tax_class}</dd></div><div><dt>Tax year</dt><dd>{lab.model.year}</dd></div><div><dt>Output</dt><dd>Planning estimate</dd></div></dl></article>
            <article className="tax-panel"><h2>Readiness review</h2><p>Resolve missing decisive facts before treating the estimate as advice.</p><div className={`tax-flag-list ${incomplete ? '' : 'is-ok'}`}>{lab.input_flags.map(flag => <div key={flag}><CircleAlert size={17} /><span>{flag}</span></div>)}</div></article>
          </div>
        </>}

        {page === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ display: 'inline-flex', background: 'var(--bg-card-subtle)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-architectural)', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => setPage1View('waterfall')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: page1View === 'waterfall' ? 'var(--maison-obsidian)' : 'transparent',
                    color: page1View === 'waterfall' ? '#ffffff' : 'var(--text-secondary)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Statutory Flow
                </button>
                <button
                  type="button"
                  onClick={() => setPage1View('sankey')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: page1View === 'sankey' ? 'var(--maison-obsidian)' : 'transparent',
                    color: page1View === 'sankey' ? '#ffffff' : 'var(--text-secondary)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Sankey Stream
                </button>
              </div>
            </div>

            {page1View === 'waterfall' ? (
              <div className="tax-two-column">
                <article className="tax-panel"><h2>Statutory deduction bridge</h2><div className="tax-stat-list">{lab.bridge.map(item => <div key={item.step}><span>{item.step}</span><strong>{item.delta ? (item.delta > 0 ? `+ ${money(item.delta)}` : `− ${money(Math.abs(item.delta))}`) : money(item.amount)}</strong></div>)}</div></article>
                <article className="tax-panel tax-panel--focus"><div className="tax-panel-heading"><Landmark size={20} /><div><h2>Income vs. assessment tax</h2><p>German progressive tariff (§ 32a EStG) calculation.</p></div></div><div className="tax-big-number"><span>Effective tax rate</span><strong>{percent(lab.headline.effective_tax_rate)}</strong><small>Assessed tax divided by gross income.</small></div><div className="tax-callout"><Info size={18} /><p>Payroll tax withholding (Lohnsteuerabzug) is a prepayment; final liability is settled on assessment.</p></div></article>
              </div>
            ) : (
              <article className="tax-panel" style={{ padding: '24px' }}>
                <h2>Interactive Household Tax &amp; Net Income Stream</h2>
                <p style={{ marginBottom: '16px' }}>Visualizing gross salary distribution into Taxes (§ 32a EStG), Social Security (KV, PV, RV, AV), and Net Disposable Income.</p>
                <SankeyTaxFlow 
                  profile={profile}
                  taxData={lab}
                  gross={profile.income || 60000}
                  taxes={lab.headline?.assessed_tax || 12000}
                  socialSecurity={lab.social_security?.total || 12500}
                  netIncome={Math.max(0, (profile.income || 60000) - (lab.headline?.assessed_tax || 12000) - (lab.social_security?.total || 12500))}
                />
              </article>
            )}
          </div>
        )}

        {page === 2 && <>
          <div className="tax-metrics">
            <Metric label="Current employment costs" value={money(lab.deductions.employment_expenses)} note="Commute, home office and allowances" />
            <Metric label="Modelled saving" value={money(lab.deductions.modelled_tax_saving)} note="Assessed tax without deductions minus current" />
            <Metric label="Next €1,000 deduction" value={money(lab.deductions.extra_1000_saving)} note="Marginal relief from additional deductible costs" />
          </div>
          <div className="tax-two-column tax-two-column--chart">
            <article className="tax-panel tax-chart-panel"><h2>Complete recalculation scenarios</h2><p>Each bar reruns the statutory estimate; it is not deduction × assumed rate.</p><div className="tax-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={scenarioData} margin={{ top: 16, right: 12, bottom: 48, left: 10 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" interval={0} angle={-12} textAnchor="end" height={72} tickLine={false} /><YAxis tickFormatter={value => `${Math.round(value / 1000)}k`} width={46} /><Tooltip formatter={value => money(value)} /><Bar dataKey="Tax" fill="var(--maison-gold)" radius={[6, 6, 0, 0]} animationDuration={650} /></BarChart></ResponsiveContainer></div></article>
            <article className="tax-panel"><h2>Evidence-backed effect</h2><div className="tax-stat-list"><div><span>Employment expenses</span><strong>{money(lab.deductions.employment_expenses)}</strong></div><div><span>Above lump sum</span><strong>{money(lab.deductions.above_lump_sum)}</strong></div><div><span>Modelled work-cost saving</span><strong>{money(lab.deductions.modelled_tax_saving)}</strong></div><div><span>Saving from extra €1,000</span><strong>{money(lab.deductions.extra_1000_saving)}</strong></div></div><div className="tax-callout"><BadgeEuro size={18} /><p>These are liability deltas, not a forecast refund. Actual settlement depends on withholding and prepayments.</p></div></article>
          </div>
        </>}

        {page === 3 && <div className="tax-two-column">
          <article className="tax-panel"><h2>Employee social insurance</h2><div className="tax-contribution-list">{lab.social_security.components.map(item => <div key={item.label}><span>{item.label}</span><strong>{money(item.amount)}</strong></div>)}</div><div className="tax-total"><span>Total employee share</span><strong>{money(lab.social_security.total)}</strong></div><p className="tax-note">Care employee rate: {percent(lab.social_security.care_employee_rate)} · {lab.social_security.children_under_25_assumed} children under 25 assumed · {lab.social_security.saxony ? 'Saxony shift applied' : 'outside Saxony'}</p></article>
          <article className="tax-panel tax-panel--focus"><h2>Household facts</h2><div className="tax-form-stack"><Field label="Children under 25" hint="Age-limited care-insurance reductions depend on this count."><input type="number" min="0" max="20" value={profile.children_under_25 ?? profile.num_children ?? 0} onChange={event => updateProfile({ children_under_25: Number(event.target.value) })} /></Field><label className="tax-switch"><input type="checkbox" checked={Boolean(profile.is_saxony)} onChange={event => updateProfile({ is_saxony: event.target.checked })} /><span><strong>Employment in Saxony</strong><small>Changes the employee/employer care contribution split.</small></span></label><label className="tax-switch"><input type="checkbox" checked={profile.joint_assessment !== false} onChange={event => updateProfile({ joint_assessment: event.target.checked })} /><span><strong>Joint assessment intended</strong><small>Requires eligibility and combined spouse taxable income.</small></span></label><Field label="Spouse gross income" hint="Captured for readiness; the current estimate does not yet combine it."><input type="number" min="0" value={profile.spouse_income ?? 0} onChange={event => updateProfile({ spouse_income: Number(event.target.value) })} /><span>€</span></Field></div></article>
        </div>}

        {page === 4 && <div className="tax-two-column">
          <article className="tax-panel tax-panel--focus"><div className="tax-panel-heading"><LineChart size={20} /><div><h2>Capital-income estimate</h2><p>A simplified realization scenario, not a broker tax statement.</p></div></div><div className="tax-form-stack"><Field label="Annual realized gains and distributions" hint="Use the broker annual statement where available."><input type="number" min="0" value={profile.annual_capital_gains ?? 0} onChange={event => updateProfile({ annual_capital_gains: Number(event.target.value) })} /><span>€</span></Field><Field label="Qualifying equity-fund share" hint="Set to zero for assets without the fund partial exemption."><input type="range" min="0" max="1" step="0.05" value={profile.equity_fund_share ?? 1} onChange={event => updateProfile({ equity_fund_share: Number(event.target.value) })} /><strong>{percent(profile.equity_fund_share ?? 1)}</strong></Field></div></article>
          <article className="tax-panel"><h2>Estimated tax bridge</h2><div className="tax-stat-list"><div><span>Gross capital income</span><strong>{money(lab.capital_income.gross_gain)}</strong></div><div><span>Fund partial exemption</span><strong>− {money(lab.capital_income.partial_exemption)}</strong></div><div><span>Saver allowance</span><strong>− {money(lab.capital_income.saver_allowance)}</strong></div><div><span>Taxable amount</span><strong>{money(lab.capital_income.taxable_amount)}</strong></div><div className="is-emphasis"><span>Estimated tax</span><strong>{money(lab.capital_income.estimated_tax)}</strong></div></div><p className="tax-note">{lab.capital_income.warning}</p></article>
        </div>}

        {page === 5 && <article className="tax-memo">
          <div className="tax-memo-header"><div><span>{lab.model.name} · {lab.model.version}</span><h2>Evidence and review mandate</h2><p>Prepared from the current profile. It is a planning memo, not a filed return or legal opinion.</p></div><button type="button" className="tax-print-button" onClick={() => window.print()}><Printer size={17} /> Print / Save PDF</button></div>
          <div className="tax-memo-grid"><section><h3>Annual assessed tax</h3><strong>{money(lab.headline.assessed_tax)}</strong><p>Refund / balance: not calculated without withholding and prepayments.</p></section><section><h3>Evidence status</h3><strong>{lab.documents.filter(item => item.required).length} priority records</strong><p>Retain source documents before claiming deductions.</p></section></div>
          <div className="tax-memo-body"><section><h3>Review workflow</h3><ol>{lab.workflow.map(item => <li key={item}>{item}</li>)}</ol></section><section><h3>Document register</h3><div className="tax-document-list">{lab.documents.map(item => <div key={item.id}><span className={item.required ? 'is-required' : ''}>{item.required ? 'Priority' : 'If applicable'}</span><div><strong>{item.label}</strong><small>{item.reason}</small></div></div>)}</div></section></div>
          <div className="tax-signoff"><div><span>Household review</span><strong>____________________</strong></div><div><span>Tax professional review</span><strong>____________________</strong></div><div><span>Evidence complete</span><strong>____________________</strong></div></div>
        </article>}

        <Sources lab={lab} />
      </div>

      <footer className="tax-footer">
        <button 
          type="button" 
          className="tax-secondary-button" 
          onClick={() => {
            if (page > 0) move(page - 1);
            else if (prevStep) prevStep();
          }}
        >
          <ArrowLeft size={17} /> {page === 0 ? 'Back to Risk Shield' : 'Previous'}
        </button>
        <span>Step {page + 1} of {pages.length}</span>
        {page < pages.length - 1 ? (
          <button type="button" className="tax-primary-button" onClick={() => move(page + 1)}>
            Continue <ArrowRight size={17} />
          </button>
        ) : (
          <button type="button" className="tax-primary-button" onClick={nextStep}>
            Proceed to Asset Allocation <ArrowRight size={17} />
          </button>
        )}
      </footer>
    </section>
  );
}
