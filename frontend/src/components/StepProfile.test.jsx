import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StepProfile from './StepProfile';

vi.mock('./AIConsultantWidget', () => ({ default: () => null }));
vi.mock('./InteractiveCashFlow', () => ({ default: () => null }));
afterEach(cleanup);

describe('Profile render regression', () => {
  const analysis = {
    advisory_plan: {
      financial_resilience_score: 73,
      score_components: { liquidity: 12, cash_flow: 15, debt: 20, protection: 4, retirement: 18 },
      household_kpis: {
        emergency_fund_months: 2.5,
        emergency_fund_target: 12000,
        savings_rate: 0.15,
        debt_service_ratio: 0,
        retirement_funding_ratio: 0.9,
      },
      protection_needs: { bu_target_monthly: 2500, bu_gap_monthly: 2499 },
    },
  };

  it.each([0, 1, 2, 3, 4, 5])('renders substep %s with a minimal profile', subStep => {
    const { container } = render(<StepProfile profile={{}} subStep={subStep} updateProfile={vi.fn()} />);
    expect(container.textContent.length).toBeGreaterThan(0);
  });

  it('renders the authoritative backend resilience assessment', () => {
    render(<StepProfile profile={{ bu_monthly_benefit: 1 }} analysis={analysis} subStep={5} updateProfile={vi.fn()} />);

    expect(screen.getByLabelText('Overall resilience score 73 out of 100')).toBeInTheDocument();
    expect(screen.getByText('€2,499 monthly gap')).toBeInTheDocument();
    expect(screen.queryByText(/80% of net earnings/i)).not.toBeInTheDocument();
  });

  it('shows a pending state instead of inventing a score before analysis completes', () => {
    render(<StepProfile profile={{}} subStep={5} updateProfile={vi.fn()} />);

    expect(screen.getByLabelText('Overall resilience score pending analysis')).toBeInTheDocument();
  });

  it('lets clients move directly between profile stages from the compact rail', async () => {
    const setSubStep = vi.fn();
    render(<StepProfile profile={{}} subStep={0} setSubStep={setSubStep} updateProfile={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: '2. Timeline: Set the planning horizon' }));

    expect(setSubStep).toHaveBeenCalledWith(1);
  });

  it('exposes progress and selected goals to assistive technology', () => {
    render(<StepProfile profile={{ goals: ['freedom'] }} subStep={0} updateProfile={vi.fn()} />);

    expect(screen.getByRole('progressbar', { name: 'Profile setup progress' })).toHaveAttribute('aria-valuenow', '1');
    expect(screen.getByRole('button', { name: /Financial Freedom & Early Retirement/i })).toHaveAttribute('aria-pressed', 'true');
  });
});
