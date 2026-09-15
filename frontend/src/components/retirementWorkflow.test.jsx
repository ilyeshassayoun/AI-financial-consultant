import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StressTestFragilityLab from './StressTestFragilityLab';
import StepRetirement from './StepRetirement';
import { fetchStressTest } from '../services/apiService';

vi.mock('../services/apiService', () => ({ fetchStressTest: vi.fn() }));
vi.mock('recharts', async () => ({
  ...await vi.importActual('recharts'),
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
}));

describe('retirement workflow regressions', () => {
  it('renders the real server response and sends the selected withdrawal amount', async () => {
    fetchStressTest.mockResolvedValue({
      description: 'Server scenario received', max_drawdown_pct: -.2,
      max_drawdown_real_pct: -.25, recovery_horizon_years: 3, trough_month: 12,
      trajectory: [{ year: 2008, month: 12, nominal_value: 80000, real_value: 75000, drawdown: -.2, drawdown_real: -.25 }],
      srr_metrics: { survival_probability: .84, safe_withdrawal_rate_calibrated: .033 },
    });
    render(<StressTestFragilityLab initialMode="decumulation" profile={{ target_wealth: 120000, safe_withdrawal_rate: .04 }} />);
    expect(await screen.findByText(/Server scenario received/)).toBeInTheDocument();
    expect(fetchStressTest).toHaveBeenCalledWith(expect.objectContaining({ monthly_cashflow: -400 }), expect.any(AbortSignal));
    fireEvent.change(screen.getByLabelText(/Withdrawal Rate/i), { target: { value: '.045' } });
    await waitFor(() => expect(fetchStressTest).toHaveBeenLastCalledWith(expect.objectContaining({ monthly_cashflow: -450 }), expect.any(AbortSignal)));
    expect(document.body.textContent).not.toContain('NaN');
  });

  it('opens the full plan review from the final retirement page', () => {
    Element.prototype.scrollIntoView = vi.fn();
    const onReviewPlan = vi.fn();
    render(<StepRetirement profile={{}} analysis={{ retirement_lab: {} }} subStep={5} onReviewPlan={onReviewPlan} />);
    fireEvent.click(screen.getByRole('button', { name: /Review full financial plan/ }));
    expect(onReviewPlan).toHaveBeenCalledOnce();
  });
});
