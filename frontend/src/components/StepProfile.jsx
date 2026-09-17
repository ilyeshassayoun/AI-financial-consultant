import React, { useState } from 'react';
import AIConsultantWidget from './AIConsultantWidget';
import { 
  GoalsStage, 
  TimelineStage, 
  CashFlowStage, 
  AccountsStage, 
  FinancialHealthStage, 
  ProfileJourneyNavigation 
} from './profile';
import './StepProfile.css';

export default function StepProfile({ 
  profile = {}, 
  updateProfile, 
  nextStep, 
  prevStep, 
  analysis, 
  subStep: propSubStep, 
  setSubStep: propSetSubStep, 
  onApplyPatch, 
  onOpenChat 
}) {
  const [localSubStep, setLocalSubStep] = useState(0);
  const subStep = Number.isFinite(propSubStep)
    ? Math.max(0, Math.min(5, propSubStep))
    : (Number.isFinite(localSubStep) ? Math.max(0, Math.min(5, localSubStep)) : 0);

  const setSubStep = (updaterOrVal) => {
    if (propSetSubStep) {
      propSetSubStep(updaterOrVal);
    } else {
      setLocalSubStep(updaterOrVal);
    }
  };

  const subStepTitles = [
    '1. Financial Goals',
    '2. Personal Timeline',
    '3. Cash Flow Details',
    '4. AI Cash Flow Verdict',
    '5. Current Accounts & Assets',
    '6. Financial Health Audit'
  ];

  const stageLabels = ['Goals', 'Timeline', 'Cash flow', 'Review', 'Accounts', 'Health'];
  const stageDescriptions = [
    'Choose what matters most',
    'Set the planning horizon',
    'Map income and resilience',
    'Read the adviser verdict',
    'Record current holdings',
    'See the complete audit'
  ];

  const safeProfile = profile || {};
  const currentAge = Number(safeProfile.age) || 30;
  const retirementAge = Number(safeProfile.retirement_age) || 67;
  const workingYearsRemaining = Math.max(1, retirementAge - currentAge);

  const advisoryPlan = analysis?.advisory_plan;
  const score = Number.isFinite(advisoryPlan?.financial_resilience_score)
    ? advisoryPlan.financial_resilience_score
    : null;

  const scoreComponents = advisoryPlan?.score_components || {};
  const componentScore = (key) => Number.isFinite(scoreComponents[key])
    ? Math.round(Math.max(0, Math.min(20, scoreComponents[key])) * 5)
    : null;
  const hasLiquidity = componentScore('liquidity') !== null && componentScore('liquidity') >= 80;
  const householdKpis = advisoryPlan?.household_kpis || {};
  const monthlyCapacity = Number(
    householdKpis.free_cash_flow_after_investing ?? householdKpis.monthly_surplus
  );
  const formattedMonthlyCapacity = Number.isFinite(monthlyCapacity)
    ? new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }).format(monthlyCapacity)
    : '—';

  const planFeasible = advisoryPlan?.plan_feasible === true;
  const priorityAction = advisoryPlan?.action_plan?.find((item) => item.priority === 1);

  const cockpitCopy = [
    'Start with the outcome, then make every euro support it.',
    `${workingYearsRemaining} earning years give your plan time to compound.`,
    'Cash flow is the engine of every recommendation that follows.',
    hasLiquidity ? 'Your liquidity base is ready for the next decision.' : 'Cash resilience needs attention before risk-taking increases.',
    'Existing protection and assets prevent duplicate recommendations.',
    score === null
      ? 'Complete the inputs to calculate your household resilience.'
      : !planFeasible
        ? 'Your current monthly plan exceeds the capacity available after household commitments.'
        : priorityAction
          ? `Resolve the foundation priority first: ${priorityAction.title}.`
          : score >= 80
            ? 'Modeled resilience is strong across the five planning signals.'
            : 'The model has found a small number of high-impact priorities.'
  ];

  const clientGoals = Array.isArray(safeProfile.goals) ? safeProfile.goals : ['freedom', 'etf_wealth'];
  const toggleGoal = (id) => {
    const updated = clientGoals.includes(id) 
      ? clientGoals.filter(x => x !== id)
      : [...clientGoals, id];
    updateProfile({ goals: updated });
  };

  const existingInsurances = Array.isArray(safeProfile.existing_insurances) ? safeProfile.existing_insurances : ['Liability'];
  const existingAssets = Array.isArray(safeProfile.existing_assets) ? safeProfile.existing_assets : ['etf'];

  const toggleInsuranceHolding = (id) => {
    const updated = existingInsurances.includes(id) 
      ? existingInsurances.filter(x => x !== id) 
      : [...existingInsurances, id];
    updateProfile({ existing_insurances: updated });
  };

  const toggleAssetHolding = (id) => {
    const updated = existingAssets.includes(id) 
      ? existingAssets.filter(x => x !== id) 
      : [...existingAssets, id];
    updateProfile({ existing_assets: updated });
  };

  const aiInsight = analysis?.ai_consultations?.profile;

  return (
    <>
      <ProfileJourneyNavigation
        subStep={subStep}
        subStepTitles={subStepTitles}
        stageLabels={stageLabels}
        stageDescriptions={stageDescriptions}
        cockpitCopy={cockpitCopy}
        score={score}
        cockpitMetrics={[
          { value: score === null ? '—' : `${Math.round(score)}%`, label: 'model resilience' },
          { value: formattedMonthlyCapacity, label: 'monthly capacity' },
          { value: `${workingYearsRemaining} yr`, label: 'time horizon' },
        ]}
        setSubStep={setSubStep}
        nextStep={nextStep}
        prevStep={prevStep}
        onOpenChat={onOpenChat}
      >
        {subStep === 0 && (
          <GoalsStage 
            clientGoals={clientGoals} 
            onToggleGoal={toggleGoal} 
          />
        )}

        {subStep === 1 && (
          <TimelineStage 
            profile={safeProfile} 
            updateProfile={updateProfile} 
          />
        )}

        {(subStep === 2 || subStep === 3) && (
          <CashFlowStage 
            profile={safeProfile} 
            updateProfile={updateProfile} 
            analysis={analysis} 
            subStep={subStep} 
          />
        )}

        {subStep === 4 && (
          <AccountsStage 
            existingInsurances={existingInsurances} 
            existingAssets={existingAssets} 
            onToggleInsurance={toggleInsuranceHolding} 
            onToggleAsset={toggleAssetHolding} 
          />
        )}

        {subStep === 5 && (
          <FinancialHealthStage 
            analysis={analysis} 
          />
        )}
      </ProfileJourneyNavigation>

      {subStep === 0 && aiInsight && (
        <details className="profile-journey__adviser-detail">
          <summary>View the detailed AI adviser note</summary>
          <AIConsultantWidget
            insight={aiInsight}
            onApplyPatch={onApplyPatch}
            onOpenChat={onOpenChat}
          />
        </details>
      )}
    </>
  );
}
