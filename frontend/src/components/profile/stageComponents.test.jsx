import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GoalsStage from './GoalsStage';
import TimelineStage from './TimelineStage';
import AccountsStage from './AccountsStage';
import FinancialHealthStage from './FinancialHealthStage';
import ProfileJourneyNavigation from './ProfileJourneyNavigation';

afterEach(cleanup);

describe('GoalsStage', () => {
  it('renders all available goals and highlights selected ones', () => {
    const onToggle = vi.fn();
    render(<GoalsStage clientGoals={['freedom', 'property']} onToggleGoal={onToggle} />);

    expect(screen.getByText('2 Goals Selected')).toBeInTheDocument();
    const freedomBtn = screen.getByRole('button', { name: /Financial Freedom & Early Retirement/i });
    expect(freedomBtn).toHaveAttribute('aria-pressed', 'true');

    const taxBtn = screen.getByRole('button', { name: /Tax Optimization & Deductions/i });
    expect(taxBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('triggers onToggleGoal when a goal card is clicked', async () => {
    const onToggle = vi.fn();
    render(<GoalsStage clientGoals={[]} onToggleGoal={onToggle} />);

    await userEvent.click(screen.getByRole('button', { name: /Compound Wealth Accumulation/i }));
    expect(onToggle).toHaveBeenCalledWith('etf_wealth');
  });
});

describe('TimelineStage', () => {
  it('displays remaining earning years and longevity track', () => {
    const updateProfile = vi.fn();
    render(<TimelineStage profile={{ age: 35, retirement_age: 65, is_married: true }} updateProfile={updateProfile} />);

    expect(screen.getByText(/30 Earning Years Remaining/i)).toBeInTheDocument();
    expect(screen.getByText('35 yrs')).toBeInTheDocument();
    expect(screen.getByText('65 yrs')).toBeInTheDocument();
    expect(screen.getByLabelText(/Married \(Joint Tax Assessment\)/i)).toBeChecked();
  });

  it('calls updateProfile when changing sliders or checkboxes', async () => {
    const updateProfile = vi.fn();
    render(<TimelineStage profile={{ age: 30, retirement_age: 67, is_married: false }} updateProfile={updateProfile} />);

    await userEvent.click(screen.getByLabelText(/Married \(Joint Tax Assessment\)/i));
    expect(updateProfile).toHaveBeenCalledWith({ is_married: true });
  });
});

describe('AccountsStage', () => {
  it('renders insurance policies and asset categories with checked state', () => {
    const onToggleInsurance = vi.fn();
    const onToggleAsset = vi.fn();
    render(
      <AccountsStage 
        existingInsurances={['Liability', 'BU']} 
        existingAssets={['etf']} 
        onToggleInsurance={onToggleInsurance} 
        onToggleAsset={onToggleAsset} 
      />
    );

    expect(screen.getByText('2 Insurance / 1 Assets Active')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Personal Liability/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Global ETF Portfolio/i })).toBeInTheDocument();
  });

  it('toggles insurance and asset accounts when clicked', async () => {
    const onToggleInsurance = vi.fn();
    const onToggleAsset = vi.fn();
    render(
      <AccountsStage 
        existingInsurances={[]} 
        existingAssets={[]} 
        onToggleInsurance={onToggleInsurance} 
        onToggleAsset={onToggleAsset} 
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /Personal Liability/i }));
    expect(onToggleInsurance).toHaveBeenCalledWith('Liability');

    await userEvent.click(screen.getByRole('button', { name: /Global ETF Portfolio/i }));
    expect(onToggleAsset).toHaveBeenCalledWith('etf');
  });
});

describe('FinancialHealthStage', () => {
  it('displays the 5 solvency signals and DIN 77230 citations', () => {
    const analysis = {
      advisory_plan: {
        financial_resilience_score: 82,
        score_components: { liquidity: 18, cash_flow: 16, debt: 20, protection: 14, retirement: 14 },
        household_kpis: {
          emergency_fund_months: 3.5,
          emergency_fund_target: 10000,
          savings_rate: 0.22,
          debt_service_ratio: 0.05,
          retirement_funding_ratio: 0.85,
        },
        protection_needs: { bu_target_monthly: 2500, bu_gap_monthly: 0 },
        action_plan: [{ title: 'Automate ETF savings plan' }]
      },
      investment_lab: { selected: { p50: 320000 } },
      optimization: { summary: { total_potential_tax_savings: 1250 } }
    };

    render(<FinancialHealthStage analysis={analysis} />);

    expect(screen.getByText('82')).toBeInTheDocument();
    expect(screen.getByText('Emergency liquidity')).toBeInTheDocument();
    expect(screen.getByText('Cash-flow capacity')).toBeInTheDocument();
    expect(screen.getByText('Debt resilience')).toBeInTheDocument();
    expect(screen.getByText('Income protection')).toBeInTheDocument();
    expect(screen.getByText('Retirement funding')).toBeInTheDocument();
    expect(screen.getByText('Modeled benefit target met')).toBeInTheDocument();
    expect(screen.getByText('DIN-informed')).toBeInTheDocument();
  });
});

describe('ProfileJourneyNavigation', () => {
  it('renders step navigation, progressbar, and handles forward/backward controls', async () => {
    const setSubStep = vi.fn();
    const nextStep = vi.fn();
    const prevStep = vi.fn();

    render(
      <ProfileJourneyNavigation
        subStep={1}
        subStepTitles={['1. Goals', '2. Timeline', '3. Cash Flow']}
        stageLabels={['Goals', 'Timeline', 'Cash Flow']}
        stageDescriptions={['Pick goals', 'Plan horizon', 'Track flow']}
        cockpitCopy={['Goal advice', 'Timeline advice', 'Cashflow advice']}
        score={75}
        setSubStep={setSubStep}
        nextStep={nextStep}
        prevStep={prevStep}
      >
        <div data-testid="child-content">Child content</div>
      </ProfileJourneyNavigation>
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Profile setup progress' })).toHaveAttribute('aria-valuenow', '2');

    await userEvent.click(screen.getByRole('button', { name: /Previous/i }));
    expect(setSubStep).toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: /Continue/i }));
    expect(setSubStep).toHaveBeenCalled();
  });
});
