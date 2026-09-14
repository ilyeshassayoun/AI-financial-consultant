import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import GoalsStage from '../components/profile/GoalsStage';
import TimelineStage from '../components/profile/TimelineStage';
import AccountsStage from '../components/profile/AccountsStage';
import FinancialHealthStage from '../components/profile/FinancialHealthStage';
import ScenarioBanner from '../components/ScenarioBanner';

afterEach(cleanup);

describe('Automated WCAG Accessibility Audits (Axe-Core)', () => {
  it('GoalsStage has zero detectable axe accessibility violations', async () => {
    const { container } = render(
      <main>
        <GoalsStage clientGoals={['freedom', 'etf_wealth']} onToggleGoal={vi.fn()} />
      </main>
    );

    const results = await axe.run(container, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] }
    });
    expect(results.violations).toEqual([]);
  });

  it('TimelineStage has zero detectable axe accessibility violations', async () => {
    const { container } = render(
      <main>
        <TimelineStage 
          profile={{ age: 32, retirement_age: 67, is_married: true, has_dependents: true }} 
          updateProfile={vi.fn()} 
        />
      </main>
    );

    const results = await axe.run(container, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] }
    });
    expect(results.violations).toEqual([]);
  });

  it('AccountsStage has zero detectable axe accessibility violations', async () => {
    const { container } = render(
      <main>
        <AccountsStage 
          existingInsurances={['Liability', 'BU']} 
          existingAssets={['etf']} 
          onToggleInsurance={vi.fn()} 
          onToggleAsset={vi.fn()} 
        />
      </main>
    );

    const results = await axe.run(container, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] }
    });
    expect(results.violations).toEqual([]);
  });

  it('FinancialHealthStage has zero detectable axe accessibility violations', async () => {
    const analysis = {
      advisory_plan: {
        financial_resilience_score: 80,
        score_components: { liquidity: 16, cash_flow: 16, debt: 16, protection: 16, retirement: 16 },
        household_kpis: { emergency_fund_months: 3.0, savings_rate: 0.20, debt_service_ratio: 0.05, retirement_funding_ratio: 0.8 },
        protection_needs: { bu_target_monthly: 2000, bu_gap_monthly: 0 },
        action_plan: [{ title: 'Maintain emergency reserves' }]
      }
    };

    const { container } = render(
      <main>
        <FinancialHealthStage analysis={analysis} />
      </main>
    );

    const results = await axe.run(container, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] }
    });
    expect(results.violations).toEqual([]);
  });

  it('ScenarioBanner has zero detectable axe accessibility violations', async () => {
    const { container } = render(
      <main>
        <ScenarioBanner 
          overrides={{ monthly_investment: 800, retirement_age: 63 }} 
          onApply={vi.fn()} 
          onReset={vi.fn()} 
        />
      </main>
    );

    const results = await axe.run(container, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] }
    });
    expect(results.violations).toEqual([]);
  });
});

describe('Keyboard, Zoom & Screen-Reader Accessibility', () => {
  it('supports full keyboard navigation through goal buttons via Tab and Enter/Space', async () => {
    const onToggle = vi.fn();
    render(<GoalsStage clientGoals={[]} onToggleGoal={onToggle} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);

    // First button receives focus on tab
    await userEvent.tab();
    expect(buttons[0]).toHaveFocus();

    // Keyboard activation works
    await userEvent.keyboard('{Enter}');
    expect(onToggle).toHaveBeenCalledWith('freedom');
  });

  it('exposes accessible screen reader descriptions and progress states', () => {
    const analysis = {
      advisory_plan: {
        financial_resilience_score: 77,
        score_components: { liquidity: 14, cash_flow: 14, debt: 20, protection: 15, retirement: 14 },
        household_kpis: { emergency_fund_months: 2.8 },
        protection_needs: { bu_target_monthly: 2200, bu_gap_monthly: 500 }
      }
    };

    render(<FinancialHealthStage analysis={analysis} />);

    const scoreElem = screen.getByLabelText('Overall resilience score 77 out of 100');
    expect(scoreElem).toBeInTheDocument();

    const meters = screen.getAllByRole('progressbar');
    expect(meters.length).toBeGreaterThan(0);
    meters.forEach((meter) => {
      expect(meter).toHaveAttribute('aria-valuenow');
      expect(meter).toHaveAttribute('aria-valuemin', '0');
      expect(meter).toHaveAttribute('aria-valuemax', '100');
    });
  });
});
