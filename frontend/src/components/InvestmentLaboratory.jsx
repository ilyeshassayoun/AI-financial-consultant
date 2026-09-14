import { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, AlertTriangle, ArrowLeft, ArrowRight, ArrowUpRight, ChartNoAxesCombined, Check, CircleDollarSign, Compass, FileText, Info, Layers3, Printer, Scale, ShieldCheck, Sparkles, Target, TrendingDown } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from 'recharts';
import StressTestFragilityLab from './StressTestFragilityLab';
import PropertyView from './PropertyView';
import { screenInvestment } from './investmentSuitability';
import BrokerDepotSimulator from './BrokerDepotSimulator';
import './InvestmentLaboratory.css';

const money = value => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value || 0);
const pct = (value, digits = 1) => `${((value || 0) * 100).toFixed(digits)}%`;
const requiredAnnualReturn = (initial, monthly, years, target) => {
  const periods = Math.max(1, Math.round(years * 12));
  const futureValue = annualRate => {
    const monthlyRate = annualRate / 12;
    if (Math.abs(monthlyRate) < 1e-8) return initial + monthly * periods;
    const growth = Math.pow(1 + monthlyRate, periods);
    return initial * growth + monthly * ((growth - 1) / monthlyRate);
  };
  if (target <= futureValue(0)) return 0;
  let low = 0;
  let high = .35;
  for (let index = 0; index < 60; index += 1) {
    const middle = (low + high) / 2;
    if (futureValue(middle) < target) low = middle;
    else high = middle;
  }
  return (low + high) / 2;
};
const requiredMonthlyContribution = (initial, years, target, annualRate) => {
  const periods = Math.max(1, Math.round(years * 12));
  const monthlyRate = annualRate / 12;
  if (Math.abs(monthlyRate) < 1e-8) return Math.max(0, (target - initial) / periods);
  const growth = Math.pow(1 + monthlyRate, periods);
  return Math.max(0, (target - initial * growth) * monthlyRate / (growth - 1));
};

const guideSteps = [
  ['goals', 'Goal optimizer', 'Repair the funding plan'],
  ['risk', 'Risk capacity', 'Set the guardrails'],
  ['strategy', 'Strategy match', 'Choose the engine'],
  ['test', 'Outcome testing', 'Pressure-test the plan'],
  ['tax', 'Tax architecture', 'Measure after-tax wealth'],
  ['build', 'Implementation', 'Select the instruments'],
  ['decision', 'Policy statement', 'Commit to the rules']
];

export default function InvestmentLaboratory({ profile, updateProfile, lab, subStep: controlledPage, setSubStep: setControlledPage, nextStep, prevStep, analysisStatus, analysisError, onRetryAnalysis, onPreviewScenario }) {
  const guideTopRef = useRef(null);
  const page = Math.max(0, Math.min(guideSteps.length - 1, Number(controlledPage || 0)));
  const setPage = setControlledPage || (() => {});
  const [testView, setTestView] = useState('projection');
  const [buildView, setBuildView] = useState('allocation');
  const answers = {
    priority: profile.investment_priority ?? 'balanced',
    lossTolerance: profile.investment_loss_tolerance ?? profile.risk_profile ?? 'medium',
    liquidity: profile.investment_liquidity ?? 'long',
  };
  const strategies = lab?.strategies;
  const selected = lab?.selected || strategies?.[0];
  const comparison = useMemo(() => (strategies || []).map(item => ({ name: item.name.replace('Global ', '').replace('Evidence ', ''), median: item.p50, adverse: item.p10 })), [strategies]);
  const requiredReturn = useMemo(() => requiredAnnualReturn(Number(profile.initial_amount || 0), Number(profile.monthly_investment || 0), Number(profile.investment_years || 20), Number(profile.target_wealth || 0)), [profile.initial_amount, profile.monthly_investment, profile.investment_years, profile.target_wealth]);
  const requiredMonthly = useMemo(() => requiredMonthlyContribution(Number(profile.initial_amount || 0), Number(profile.investment_years || 20), Number(profile.target_wealth || 0), Number(selected?.expected_return || 0)), [profile.initial_amount, profile.investment_years, profile.target_wealth, selected?.expected_return]);
  const screening = screenInvestment(profile, answers);
  const recommendationId = screening.recommendationId;
  const recommendation = (strategies || []).find(item => item.id === recommendationId);
  const localGate = screening.reason || (analysisStatus && analysisStatus !== 'success'
    ? 'Refresh the analysis before relying on this policy or implementing a strategy.' : null);
  const displayedPolicy = localGate ? {
    ...lab?.investment_policy,
    execution_status: 'gated',
    suitability_flags: [...(lab?.investment_policy?.suitability_flags || []),
      { title: 'Current suitability review', detail: localGate }],
  } : lab?.investment_policy || {};


  useEffect(() => {
    guideTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [page]);

  if (!selected && analysisStatus === 'error') {
    const errorHeading = 'Investment model unavailable';
    const isRedundantDetail = Boolean(
      analysisError && analysisError.trim().toLowerCase() === errorHeading.toLowerCase()
    );
    const errorDescription = (!analysisError || isRedundantDetail)
      ? 'The analysis service did not return a result. Please try again.'
      : analysisError;

    return (
      <div className="investment-lab investment-lab--loading investment-lab--error" role="alert">
        <AlertTriangle size={34} aria-hidden="true" />
        <div>
          <strong>{errorHeading}</strong>
          <p>{errorDescription}</p>
          <button type="button" className="btn-brand" onClick={onRetryAnalysis}>Retry analysis</button>
        </div>
      </div>
    );
  }

  if (!selected) return (
    <div className="investment-lab investment-lab--loading" role="status" aria-live="polite">
      <span className="investment-loading-orbit" aria-hidden="true" />
      <div>
        <strong>Preparing your institutional model</strong>
        <p>Running comparable portfolio paths and checking the funding assumptions…</p>
      </div>
    </div>
  );

  const move = target => setPage(Math.max(0, Math.min(guideSteps.length - 1, target)));
  const continueGuide = () => {
    if (page === 1 && recommendationId && recommendationId !== lab.selected_strategy) updateProfile({ investment_strategy: recommendationId });
    move(page + 1);
  };
  const answer = (key, value) => {
    const field = { priority: 'investment_priority', lossTolerance: 'investment_loss_tolerance', liquidity: 'investment_liquidity' }[key];
    updateProfile({ [field]: value });
  };
  const currentStep = guideSteps[page];

  return (
    <section className="investment-journey animate-fade-in-up" ref={guideTopRef} aria-labelledby="investment-lab-title">
      {page === 0 && (
        <header className="investment-hero">
          <div>
            <span className="investment-eyebrow">Quantitative ETF Allocation · Core Quantitative Comparison</span>
            <h1 id="investment-lab-title">Investment Strategy Laboratory</h1>
            <p>{lab.methodology?.simulations_per_strategy ?? '—'}-draw Monte Carlo simulations with an all-in annual fee assumption and illustrative German horizon-liquidation tax estimates across five strategies.</p>
          </div>
          <div className="investment-readiness">
            <Sparkles size={20} color="var(--maison-gold)" />
            <div>
              <span>Simulation Engine</span>
              <strong>{lab.methodology?.simulations_per_strategy?.toLocaleString() || '—'} draws / strategy</strong>
            </div>
          </div>
        </header>
      )}

      {analysisStatus === 'stale' && (
        <div className="investment-lab__stale" role="status">
          Your financial inputs changed. Refresh the analysis before relying on these projections.
        </div>
      )}

      {localGate && <div className="guide-fiduciary-warning" role="alert"><ShieldCheck size={18} /><p>{localGate} You may inspect scenarios, but this is not an implementation approval.</p></div>}
      <div className="investment-page animate-fade-in-up" key={page}>
        <div className="investment-page-heading">
          <span><Compass size={20} /></span>
          <div>
            <small>Step {page + 1} of {guideSteps.length}</small>
            <h2>{currentStep[1]}</h2>
            <p>{currentStep[2]}</p>
          </div>
        </div>

        <details className="tax-methodology"><summary>Model costs and risk definitions</summary><p>{lab.methodology?.fee_model}</p><p>All-in annual fee: {pct(selected.annual_fee_rate, 2)}. Expected returns shown are after this modeled cost.</p><p>{lab.methodology?.risk_model}</p></details>
        {page === 0 && <GoalPage profile={profile} updateProfile={updateProfile} previewScenario={onPreviewScenario || updateProfile} selected={selected} requiredReturn={requiredReturn} requiredMonthly={requiredMonthly} optimizer={lab.goal_optimizer}/>} 
        {page === 1 && <RiskPage answers={answers} answer={answer} recommendation={recommendation}/>} 
        {page === 2 && <StrategyPage strategies={strategies || []} selected={selected} selectedId={lab.selected_strategy} recommendedId={recommendationId} updateProfile={updateProfile}/>} 
        {page === 3 && <TestPage view={testView} setView={setTestView} selected={selected} comparison={comparison} target={lab.target_wealth} matrix={lab.stress_matrix || []} profile={profile}/>}
        {page === 4 && <TaxPage tax={lab.tax_analysis || selected.tax || {}} selected={selected}/>}
        {page === 5 && <BuildPage view={buildView} setView={setBuildView} selected={selected} property={lab.real_estate || {}} profile={profile} updateProfile={updateProfile}/>} 
        {page === 6 && <DecisionPage selected={selected} profile={profile} policy={displayedPolicy} tax={lab.tax_analysis || {}} optimizer={lab.goal_optimizer || {}} onChangeStrategy={() => move(2)}/>}
      </div>

      <footer className="investment-footer-nav">
        <button 
          type="button" 
          className="investment-secondary-button" 
          onClick={() => {
            if (page > 0) move(page - 1);
            else if (prevStep) prevStep();
          }}
        >
          <ArrowLeft size={17} /> {page === 0 ? 'Back to Tax Optimization' : 'Previous'}
        </button>
        <span>Step {page + 1} of {guideSteps.length}</span>
        {page < guideSteps.length - 1 ? (
          <button type="button" className="investment-primary-button" onClick={continueGuide}>
            {page === 1 ? (recommendationId ? 'Apply match & continue' : 'Continue without applying a match') : 'Continue'} <ArrowRight size={17} />
          </button>
        ) : (
          <button type="button" className="investment-primary-button" onClick={nextStep}>
            Proceed to Solvency &amp; Retirement <ArrowRight size={17} />
          </button>
        )}
      </footer>
    </section>
  );
}

function GoalPage({ profile, updateProfile, previewScenario, selected, requiredReturn, requiredMonthly, optimizer = {} }) {
  const optimizedReturn = optimizer.required_return ?? requiredReturn;
  const optimizedMonthly = optimizer.required_monthly ?? requiredMonthly;
  const contributionGap = optimizedMonthly - Number(profile.monthly_investment || 0);
  return <div className="guide-goals">
    <div className="guide-intro"><Compass/><div><h3>Start with the destination—not the product.</h3><p>The mandate is viable only when the savings rate, time horizon and required return agree with each other.</p></div></div>
    <div className="guide-goal-layout">
      <div className="investment-lab__controls" aria-label="Investment goal assumptions">
        <label>Initial capital<div><span>€</span><input type="number" min="0" value={profile.initial_amount || 0} onChange={e => updateProfile({ initial_amount: Number(e.target.value) })}/></div></label>
        <label>Monthly contribution<div><span>€</span><input type="number" min="0" value={profile.monthly_investment || 0} onChange={e => updateProfile({ monthly_investment: Number(e.target.value) })}/></div></label>
        <label>Investment horizon<div><input type="number" min="5" max="50" value={profile.investment_years || 20} onChange={e => updateProfile({ investment_years: Number(e.target.value) })}/><span>years</span></div></label>
        <label>Target wealth<div><span>€</span><input type="number" min="0" value={profile.target_wealth || 500000} onChange={e => updateProfile({ target_wealth: Number(e.target.value) })}/></div></label>
      </div>
      <FundingChart selected={selected} target={profile.target_wealth}/>
    </div>
    <div className={`guide-funding-status is-${optimizer.status || 'conditional'}`}><Target/><div><span>Funding diagnosis</span><strong>{optimizer.headline || 'Review the funding margin before selecting products.'}</strong></div></div>
    <div className="guide-specialist-diagnostic"><div><span>Required annual return</span><strong>{pct(optimizedReturn)}</strong><small>{optimizedReturn > selected.expected_return ? 'Above the selected strategy assumption' : 'Within the selected strategy assumption'}</small></div><div><span>Monthly funding at assumed return</span><strong>{money(optimizedMonthly)}</strong><small>{contributionGap > 0 ? `${money(contributionGap)} above the current contribution` : 'Current contribution meets the deterministic base case'}</small></div><div><span>Modeled success probability</span><strong>{pct(selected.probability_target, 0)}</strong><small>Based on identical simulated shocks</small></div></div>
    {optimizer.levers && <GoalRepairPanel optimizer={optimizer} previewScenario={previewScenario}/>} 
  </div>;
}

function FundingChart({ selected, target }) {
  return <article className="guide-funding-chart"><div className="lab-chart-title"><div><span>Funding trajectory</span><h2>Contributions versus modeled median</h2></div></div><div><ResponsiveContainer width="100%" height="100%"><AreaChart data={selected.timeline} margin={{ top: 14, right: 10, left: 2, bottom: 0 }}><defs><linearGradient id="fundingMedian" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1f5b3b" stopOpacity=".35"/><stop offset="1" stopColor="#1f5b3b" stopOpacity=".02"/></linearGradient></defs><CartesianGrid vertical={false} stroke="#e5ebe2"/><XAxis dataKey="year" tickLine={false} axisLine={false} tick={{fontSize:12}}/><YAxis tickFormatter={value => `€${Math.round(value/1000)}k`} tickLine={false} axisLine={false} width={56} tick={{fontSize:12}}/><Tooltip formatter={value => money(value)} contentStyle={{borderRadius:12}}/><ReferenceLine y={target} stroke="#b88d38" strokeDasharray="6 5" label={{ value:'Goal', fill:'#876a2f', fontSize:12 }}/><Area type="monotone" dataKey="p50" name="Modeled median" stroke="#173d29" strokeWidth={3} fill="url(#fundingMedian)" animationDuration={1200}/><Area type="monotone" dataKey="contributions" name="Contributions" stroke="#9a7b3e" strokeWidth={2} strokeDasharray="5 4" fill="transparent" animationDuration={900}/></AreaChart></ResponsiveContainer></div></article>;
}

function GoalRepairPanel({ optimizer, previewScenario }) {
  const best = optimizer.best_probability_strategy || {};
  const levers = [
    { id:'contribution', label:'Increase monthly funding', value:`${money(optimizer.required_monthly)}/mo`, detail:`Add ${money(optimizer.additional_monthly)} per month`, apply:() => previewScenario({ monthly_investment:optimizer.required_monthly }) },
    { id:'horizon', label:'Extend the time horizon', value:`${optimizer.required_years} years`, detail:`Add ${optimizer.additional_years} years`, apply:() => previewScenario({ investment_years:optimizer.required_years }) },
    { id:'target', label:'Reset to after-tax median', value:money(optimizer.revised_target), detail:`Reduce by ${money(optimizer.target_reduction)}`, apply:() => previewScenario({ target_wealth:optimizer.revised_target }) },
    { id:'risk', label:'Review the risk budget', value:best.name || 'No improvement', detail:`Goal probability ${pct(best.probability,0)}`, apply:() => best.id && previewScenario({ investment_strategy:best.id }) }
  ];
  return (
    <section className="guide-repair-panel" aria-labelledby="goal-repair-title">
      <header className="guide-repair-header">
        <span>Goal repair menu</span>
        <h3 id="goal-repair-title">Four controlled ways to close the funding gap</h3>
        <p>Change one lever at a time. Increasing market risk is shown last because it is the least controllable solution.</p>
      </header>
      <div className="guide-repair-grid">
        {levers.map((lever, index) => (
          <article className={`guide-repair-card guide-repair-card--${lever.id}`} key={lever.id}>
            <div className="guide-repair-card__heading">
              <span className="guide-repair-card__index">0{index + 1}</span>
              <small>{lever.label}</small>
            </div>
            <strong className="guide-repair-card__value">{lever.value}</strong>
            <p>{lever.detail}</p>
            <button
              type="button"
              className="guide-repair-card__action"
              aria-label={`Apply ${lever.label.toLowerCase()} scenario`}
              onClick={lever.apply}
            >
              <span>Apply scenario</span>
              <ArrowUpRight size={16} aria-hidden="true" />
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function RiskPage({ answers, answer, recommendation }) {
  const lossBudget = answers.lossTolerance === 'low' ? .10 : answers.lossTolerance === 'high' ? .35 : .20;
  const recoveryGain = lossBudget / (1 - lossBudget);
  return <div className="guide-risk">
    <div className="guide-intro"><Scale/><div><h3>Separate willingness to take risk from financial capacity.</h3><p>Choose the answer you could follow during a real drawdown, not the one that looks best in a rising market.</p></div></div>
    <ChoiceGroup title="What matters most?" value={answers.priority} onChange={value => answer('priority', value)} choices={[["growth","Maximum long-term growth","Accept wider outcome ranges"],["balanced","Balanced progress","Trade some upside for ballast"],["income","Income & real assets","Favor yield and inflation sensitivity"],["stability","Capital stability","Minimize portfolio swings"]]}/>
    <ChoiceGroup title="How would you react to a major temporary decline?" value={answers.lossTolerance} onChange={value => answer('lossTolerance', value)} choices={[["low","10% feels severe","I may need to reduce risk"],["medium","20% is tolerable","I can stay invested with a plan"],["high","35%+ is acceptable","I understand deep equity drawdowns"]]}/>
    <ChoiceGroup title="When might invested money be needed?" value={answers.liquidity} onChange={value => answer('liquidity', value)} choices={[["short","Within 3 years","Capital access is important"],["medium","In 4–9 years","Some flexibility is required"],["long","10+ years","Funds can remain invested"]]}/>
    {answers.liquidity === 'short' && <div className="guide-fiduciary-warning"><ShieldCheck size={18}/><p><strong>Capital-preservation gate:</strong> money required within three years should generally remain outside this growth portfolio in cash or short-duration high-quality instruments.</p></div>}
    <div className="guide-risk-diagnostic"><div className="guide-loss-budget"><span>Declared temporary-loss budget</span><strong>-{pct(lossBudget, 0)}</strong><div><i style={{width:`${lossBudget * 200}%`}}/><b style={{left:`${lossBudget * 200}%`}}/></div><small>A {pct(lossBudget,0)} decline requires a {pct(recoveryGain,0)} gain simply to recover.</small></div><div className="guide-match-preview"><span>Specialist rule-based match</span><strong>{recommendation?.name ?? 'No growth-portfolio match'}</strong><p>{recommendation?.why ?? 'Resolve the capital-preservation constraints before choosing an implementation plan.'}</p></div></div>
  </div>;
}

function ChoiceGroup({ title, value, choices, onChange }) {
  return <fieldset className="guide-choice-group"><legend>{title}</legend><div role="radiogroup" aria-label={title}>{choices.map(([id, label, hint]) => <button type="button" role="radio" key={id} className={value === id ? 'is-active' : ''} onClick={() => onChange(id)} aria-checked={value === id}><i aria-hidden="true">{value === id && <Check size={12}/>}</i><strong>{label}</strong><small>{hint}</small></button>)}</div></fieldset>;
}

function StrategyPage({ strategies, selected, selectedId, recommendedId, updateProfile }) {
  return <div className="guide-strategy">
    <div className="guide-intro"><ChartNoAxesCombined/><div><h3>Compare the complete risk–return trade-off.</h3><p>The recommended label reflects your answers. You remain in control and can inspect or choose any strategy.</p></div></div>
    <div className="guide-strategy-tabs" role="radiogroup" aria-label="Available investment strategies">{strategies.map(strategy => {
      const active = strategy.id === selectedId;
      const recommended = strategy.id === recommendedId;
      return <button key={strategy.id} type="button" role="radio" className={`${active ? 'is-active' : ''} ${recommended ? 'is-recommended' : ''}`} onClick={() => updateProfile({ investment_strategy: strategy.id })} aria-checked={active}><span>{recommended ? 'Best match' : strategy.subtitle}</span><strong>{strategy.name}</strong></button>;
    })}</div>
    <div className="guide-strategy-analysis">
      <StrategyFrontier strategies={strategies} selectedId={selectedId} recommendedId={recommendedId}/>
      <article className="guide-specialist-view"><span>Specialist assessment</span><h3>{selected.name}</h3><p>{selected.why}</p><div><section><small>Expected return</small><strong>{pct(selected.expected_return)}</strong></section><section><small>Model volatility</small><strong>{pct(selected.expected_volatility)}</strong></section><section><small>Goal probability</small><strong>{pct(selected.probability_target,0)}</strong></section><section><small>Tail outcome ES95</small><strong>{money(selected.expected_shortfall_95)}</strong></section></div><footer><ShieldCheck size={17}/><p><strong>Implementation test:</strong> {selected.instruments.length} named instruments, annual rebalancing, and a ±5 percentage-point drift rule.</p></footer></article>
    </div>
  </div>;
}

function StrategyFrontier({ strategies, selectedId, recommendedId }) {
  const data = strategies.map(item => ({ id:item.id, name:item.name, risk:item.expected_volatility*100, return:item.expected_return*100, probability:Math.max(12,item.probability_target*100) }));
  return <article className="guide-frontier"><div className="lab-chart-title"><div><span>Forward-looking opportunity set</span><h2>Expected return versus modeled risk</h2></div><small>Bubble size = goal probability</small></div><div><ResponsiveContainer width="100%" height="100%"><ScatterChart margin={{top:14,right:16,bottom:12,left:0}}><CartesianGrid stroke="#e3e9e0" strokeDasharray="3 3"/><XAxis type="number" dataKey="risk" name="Risk" unit="%" domain={[4,17]} tick={{fontSize:12}} label={{value:'Annual volatility',position:'insideBottom',offset:-8,fontSize:12}}/><YAxis type="number" dataKey="return" name="Return" unit="%" domain={[3.5,7.5]} tick={{fontSize:12}} label={{value:'Expected return',angle:-90,position:'insideLeft',fontSize:12}}/><ZAxis type="number" dataKey="probability" range={[150,650]}/><Tooltip cursor={{strokeDasharray:'4 4'}} content={({active,payload}) => active && payload?.[0] ? <div className="frontier-tooltip"><strong>{payload[0].payload.name}</strong><span>Return {payload[0].payload.return.toFixed(1)}%</span><span>Risk {payload[0].payload.risk.toFixed(1)}%</span></div> : null}/><Scatter data={data} animationDuration={1200}>{data.map(item => <Cell key={item.id} fill={item.id===selectedId?'#173d29':item.id===recommendedId?'#c2a15c':'#91a497'} stroke={item.id===selectedId?'#c2a15c':'#fff'} strokeWidth={item.id===selectedId?4:2}/>)}</Scatter></ScatterChart></ResponsiveContainer></div><p>Higher expected return is not automatically superior. The mandate must survive the volatility and tail-loss budget shown here.</p></article>;
}

function TestPage({ view, setView, selected, comparison, target, matrix, profile }) {
  return <div><div className="guide-intro"><Activity/><div><h3>Test both the expected journey and the uncomfortable one.</h3><p>Switch between outcome distributions and crisis analogues before accepting the strategy.</p></div></div><ViewSwitch view={view} setView={setView} options={[["projection","Probability map"],["stress","Crisis laboratory"]]}/>{view === 'projection' ? <ProjectionView selected={selected} comparison={comparison} target={target}/> : <StressView matrix={matrix} profile={profile}/>}</div>;
}

function TaxPage({ tax, selected }) {
  const chartData = [
    { name:'Contributions', value:tax.cost_basis || 0, color:'#7892a1' },
    { name:'Gross median', value:tax.gross_terminal || selected.p50, color:'#173d29' },
    { name:'After tax', value:tax.after_tax_terminal || selected.p50, color:'#c2a15c' }
  ];
  return <div className="guide-tax">
    <div className="guide-intro"><CircleDollarSign/><div><h3>Optimize after-tax wealth—not the headline return.</h3><p>This page estimates a full liquidation at the planning horizon and separates cost basis, taxable gains, exemptions and tax drag.</p></div></div>
    <div className="tax-outcome-grid"><article className="tax-chart"><div className="lab-chart-title"><div><span>Tax outcome bridge</span><h2>Gross versus estimated after-tax capital</h2></div></div><div><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{top:12,right:8,bottom:0,left:8}}><CartesianGrid vertical={false} stroke="#e5eae3"/><XAxis dataKey="name" tick={{fontSize:12}} axisLine={false} tickLine={false}/><YAxis tickFormatter={value => `€${Math.round(value/1000)}k`} tick={{fontSize:12}} axisLine={false} tickLine={false}/><Tooltip formatter={value => money(value)} contentStyle={{borderRadius:12}}/><Bar dataKey="value" radius={[8,8,0,0]} animationDuration={1100}>{chartData.map(item => <Cell key={item.name} fill={item.color}/>)}</Bar></BarChart></ResponsiveContainer></div></article>
      <article className="tax-verdict"><span>Estimated horizon result</span><h3>{money(tax.after_tax_terminal)}</h3><p>after tax versus {money(tax.gross_terminal)} gross median capital</p><div><section><small>Estimated tax drag</small><strong>{money(tax.tax_drag)}</strong></section><section><small>Taxable gain share</small><strong>{pct(tax.taxable_gain_share)}</strong></section><section><small>Saver allowance</small><strong>{money(tax.saver_allowance)}</strong></section><section><small>Modeled tax rate</small><strong>{pct(tax.capital_tax_rate,2)}</strong></section></div></article>
    </div>
    <div className="tax-policy-grid"><article><span>01</span><FileText/><strong>Use the allowance deliberately</strong><p>The model uses a {money(tax.saver_allowance)} saver allowance for the selected assessment mode. Place the exemption order where taxable distributions or advance lump sums arise.</p></article><article><span>02</span><Layers3/><strong>Preserve fund exemptions</strong><p>The estimate applies a 30% partial exemption to qualifying equity-fund gains. Verify that every selected fund actually qualifies.</p></article><article><span>03</span><Scale/><strong>Control realization</strong><p>Coordinate sales with loss pots, allowances and rebalancing. A portfolio decision should not be driven by tax alone.</p></article></div>
    <details className="tax-methodology"><summary>Specialist assumptions and model limitations</summary><div>{(tax.assumptions || []).map(item => <p key={item}><Info size={14}/>{item}</p>)}</div></details>
  </div>;
}

function BuildPage({ view, setView, selected, property, profile, updateProfile }) {
  return <div><div className="guide-intro"><Layers3/><div><h3>Translate the strategy into investable building blocks.</h3><p>Review the fund shortlist and compare liquid diversification with a concentrated leveraged property case.</p></div></div><ViewSwitch view={view} setView={setView} options={[["allocation","ETF implementation"],["property","Property alternative"]]}/>{view === 'allocation' ? <AllocationView selected={selected} profile={profile}/> : <PropertyView property={property} selected={selected} profile={profile} updateProfile={updateProfile}/>}</div>;
}

function ViewSwitch({ view, setView, options }) {
  return <nav className="investment-lab__tabs" aria-label="Page analysis views">{options.map(([id, label]) => <button type="button" key={id} className={view === id ? 'is-active' : ''} onClick={() => setView(id)}>{label}</button>)}</nav>;
}

function DecisionPage({ selected, profile, policy, tax, optimizer, onChangeStrategy }) {
  const printPolicy = () => window.print();
  return <div className="guide-decision"><section className="ips-document" id="investment-policy-statement"><header className="ips-header"><div><span>Investment Policy Statement</span><h3>{selected.name}</h3><p>Personal investment mandate · educational planning draft</p></div><div className={`ips-status is-${policy.execution_status || 'review'}`}><small>Execution status</small><strong>{policy.execution_status === 'gated' ? 'Resolve suitability gates' : 'Eligible for final review'}</strong></div></header>
    {(policy.suitability_flags || []).length > 0 && <div className="ips-gates"><h4><AlertTriangle size={18}/>Suitability gates before investing</h4>{policy.suitability_flags.map(flag => <article key={flag.title}><strong>{flag.title}</strong><p>{flag.detail}</p></article>)}</div>}
    <div className="ips-objective"><span>Primary objective</span><strong>{policy.objective || `Fund ${money(profile.target_wealth)} over ${profile.investment_years} years.`}</strong><p>{optimizer.headline}</p></div>
    <div className="ips-section-grid"><article><span>01 · Funding policy</span><h4>{money(profile.initial_amount)} initial + {money(profile.monthly_investment)}/month</h4><p>Automate contributions only after the emergency-reserve and debt gates are satisfied.</p></article><article><span>02 · Risk policy</span><h4>{pct(selected.expected_volatility)} modeled volatility</h4><p>Adverse P10 {money(selected.p10)} · median drawdown -{pct(selected.median_max_drawdown)}.</p></article><article><span>03 · Strategic allocation</span><div className="ips-allocation">{selected.allocation.map(item => <div key={item.key}><i style={{background:item.color}}/><span>{item.name}</span><strong>{pct(item.weight,0)}</strong></div>)}</div></article><article><span>04 · Tax policy</span><h4>{money(tax.after_tax_terminal)} after-tax median</h4><p>{policy.tax_policy}</p></article><article><span>05 · Rebalancing policy</span><h4>Annual review · ±5% bands</h4><p>{policy.rebalancing_rule}</p></article><article><span>06 · Monitoring policy</span><h4>Review material life changes</h4><p>{policy.monitoring_rule}</p></article></div>
    <div className="ips-implementation"><h4>Illustrative instruments for review</h4>{selected.instruments.map(item => <div key={item.isin}><strong>{item.ticker}</strong><span>{item.name}</span><small>{item.isin} · TER {pct(item.ter,2)}</small></div>)}</div>
    <footer className="ips-signoff"><div><span>Investor acknowledgement</span><i/></div><div><span>Review date</span><i/></div><p>This policy documents decision rules; it does not guarantee outcomes or replace regulated personal tax or investment advice.</p></footer></section>
    <div className="ips-actions"><button type="button" onClick={onChangeStrategy}>Change strategy</button><button type="button" className="ips-print" onClick={printPolicy}><Printer size={16}/>Print / Save PDF</button></div></div>;
}

function ProjectionView({ selected, comparison, target }) {
  return <div className="lab-projection"><article className="lab-chart-card lab-chart-card--wide"><div className="lab-chart-title"><div><span>Wealth cone</span><h2>Range of simulated outcomes</h2></div><div className="lab-legend"><i className="p90"/>Optimistic <i className="p50"/>Median <i className="p10"/>Adverse</div></div><div className="lab-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={selected.timeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}><defs><linearGradient id="range90" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#bda05f" stopOpacity=".36"/><stop offset="1" stopColor="#bda05f" stopOpacity=".02"/></linearGradient><linearGradient id="range50" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#173d29" stopOpacity=".5"/><stop offset="1" stopColor="#173d29" stopOpacity=".03"/></linearGradient></defs><CartesianGrid vertical={false} stroke="#e8ece5" strokeDasharray="3 3"/><XAxis dataKey="year" tickLine={false} axisLine={false}/><YAxis tickFormatter={v => `€${Math.round(v/1000)}k`} tickLine={false} axisLine={false} width={55}/><Tooltip formatter={(v,n) => [money(v),n]} contentStyle={{ borderRadius: 12, border: '1px solid #dce3d8' }}/><Area type="monotone" dataKey="p90" name="Optimistic P90" stroke="#bda05f" fill="url(#range90)" animationDuration={900}/><Area type="monotone" dataKey="p50" name="Median P50" stroke="#173d29" strokeWidth={3} fill="url(#range50)" animationDuration={1000}/><Area type="monotone" dataKey="p10" name="Adverse P10" stroke="#b85d52" strokeDasharray="5 5" fill="transparent" animationDuration={1100}/><Area type="monotone" dataKey="contributions" name="Deposits" stroke="#8a988d" fill="transparent" strokeWidth={1.5}/></AreaChart></ResponsiveContainer></div><div className="lab-target-line"><Target size={15}/>Goal {money(target)} · probability {pct(selected.probability_target,0)}</div></article><article className="lab-chart-card"><div className="lab-chart-title"><div><span>Core Quantitative Comparison</span><h2>Median vs adverse result</h2></div></div><div className="lab-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={comparison} layout="vertical" margin={{ left: 10, right: 10 }}><CartesianGrid horizontal={false} stroke="#e8ece5"/><XAxis type="number" tickFormatter={v => `€${Math.round(v/1000)}k`} axisLine={false}/><YAxis dataKey="name" type="category" width={92} tick={{ fontSize: 10 }} axisLine={false}/><Tooltip formatter={v => money(v)} contentStyle={{ borderRadius:12 }}/><Bar dataKey="median" name="Median" fill="#173d29" radius={[0,5,5,0]} animationDuration={900}/><Bar dataKey="adverse" name="Adverse" fill="#c7a866" radius={[0,5,5,0]} animationDuration={1100}/></BarChart></ResponsiveContainer></div></article></div>;
}

function AllocationView({ selected, profile }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
    <div className="lab-allocation">
      <article className="lab-chart-card"><div className="lab-chart-title"><div><span>Risk budget</span><h2>What actually drives the portfolio</h2></div></div><div className="lab-donut-wrapper"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={selected.allocation} dataKey="weight" nameKey="name" innerRadius={66} outerRadius={98} paddingAngle={2} animationDuration={900}>{selected.allocation.map(item => <Cell key={item.key} fill={item.color}/>)}</Pie><Tooltip formatter={v => pct(v,0)}/></PieChart></ResponsiveContainer><div className="lab-donut-center"><strong>{pct(selected.expected_volatility)}</strong><span>model volatility</span></div></div><ul className="lab-allocation-list">{selected.allocation.map(item => <li key={item.key}><i style={{ background:item.color }}/><span>{item.name}</span><strong>{pct(item.weight,0)}</strong></li>)}</ul></article>
      <article className="lab-instruments"><div className="lab-chart-title"><div><span>Implementation shortlist</span><h2>Named instruments and their jobs</h2></div><ShieldCheck/></div>{selected.instruments.map(item => <div className="lab-instrument" key={item.isin}><div className="lab-instrument__ticker">{item.ticker}</div><div><strong>{item.name}</strong><span>{item.isin} · TER {pct(item.ter,2)}</span><p>{item.role}</p><small>Risk: {item.risk}</small></div><ArrowUpRight/></div>)}</article>
    </div>
    <BrokerDepotSimulator monthlyContribution={profile?.monthly_investment} initialAmount={profile?.initial_amount} selectedStrategy={selected} />
  </div>;
}

function StressView({ matrix, profile }) {
  const data = matrix.map(item => ({ ...item, gfc:Math.round(item.gfc*100), covid:Math.round(item.covid*100), rate_shock:Math.round(item.rate_shock*100), stagflation:Math.round(item.stagflation*100) }));
  return <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
    <StressTestFragilityLab profile={profile} initialMode="accumulation" />
    <div className="lab-stress">
      <article className="lab-chart-card lab-chart-card--wide"><div className="lab-chart-title"><div><span>Historical analogues</span><h2>How allocations behave when diversification is needed</h2></div><div className="scenario-badge">Illustrative shocks</div></div><div className="lab-chart lab-chart--stress"><ResponsiveContainer width="100%" height="100%"><BarChart data={data}><CartesianGrid vertical={false} stroke="#e8ece5"/><XAxis dataKey="name" tick={{fontSize:10}} interval={0} axisLine={false}/><YAxis unit="%" axisLine={false}/><Tooltip formatter={v => `${v}%`} contentStyle={{borderRadius:12}}/><Legend/><Bar dataKey="gfc" name="Global financial crisis" fill="#7f3838" radius={[4,4,0,0]} animationDuration={700}/><Bar dataKey="covid" name="Fast equity shock" fill="#b85d52" radius={[4,4,0,0]} animationDuration={850}/><Bar dataKey="rate_shock" name="Rate shock" fill="#c49a55" radius={[4,4,0,0]} animationDuration={1000}/><Bar dataKey="stagflation" name="Stagflation" fill="#7e8f78" radius={[4,4,0,0]} animationDuration={1150}/></BarChart></ResponsiveContainer></div></article>
      <aside className="lab-risk-notes"><TrendingDown/><h2>Drawdown capacity is a constraint</h2><p>A strategy is only suitable if the investor can remain invested through its plausible loss range. The lowest modeled decline is not automatically “best”: lower risk generally lowers expected terminal wealth.</p><div><strong>Rebalancing rule</strong><span>Review annually or at ±5 percentage-point drift.</span></div><div><strong>Liquidity rule</strong><span>Keep emergency reserves outside this portfolio.</span></div><div><strong>Decision rule</strong><span>Choose a strategy consistent with your capacity, goals and liquidity needs; a high backtest return is not a suitability test.</span></div></aside>
    </div>
  </div>;
}
