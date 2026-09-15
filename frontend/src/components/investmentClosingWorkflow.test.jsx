import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import InvestmentLaboratory from './InvestmentLaboratory';

vi.mock('recharts', async () => ({
  ...await vi.importActual('recharts'),
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
}));

const profile = {
  initial_amount: 10000, monthly_investment: 700, investment_years: 20,
  target_wealth: 400000, risk_profile: 'medium', investment_strategy: 'balanced_60_40',
};
const selected = {
  id: 'balanced_60_40', name: 'Balanced 60/40', p50: 100000, p10: 60000,
  expected_return: .05, expected_volatility: .09, median_max_drawdown: .18,
  annual_fee_rate: .0018, probability_target: .55,
  allocation: [{ key:'equity', name:'Global equity', weight:.6, color:'#173d29' }],
  instruments: [{ ticker:'EUNL', name:'World ETF', isin:'IE00TEST', ter:.002, role:'Core', risk:'Market risk' }],
};
const tax = {
  cost_basis: 70000, gross_terminal: 100000, gross_gain: 30000,
  taxable_gain_before_allowance: 21000, modeled_nontaxable_gain: 9000,
  taxable_gain_share: .7, saver_allowance: 1000, capital_tax_rate: .26375,
  estimated_liquidation_tax: 5275, after_tax_terminal: 94725, tax_drag: 5275,
  effective_tax_drag_rate: .17583, assumptions: ['Illustrative horizon liquidation.'],
  sensitivity_scenarios: [
    { id:'profile', label:'Current profile', description:'Current settings', saver_allowance:1000, capital_tax_rate:.26375, estimated_liquidation_tax:5275, after_tax_terminal:94725 },
    { id:'no_allowance', label:'Allowance used elsewhere', description:'No allowance remains', saver_allowance:0, capital_tax_rate:.26375, estimated_liquidation_tax:5539, after_tax_terminal:94461 },
  ],
};
const lab = {
  selected, selected_strategy:selected.id, strategies:[selected], tax_analysis:tax,
  goal_optimizer:{ headline:'Funding is conditional.' }, methodology:{ fee_model:'All-in fee.', risk_model:'Modeled risk.' },
  real_estate:{}, stress_matrix:[],
  implementation_plan:{ weighted_ter:.0016, orders:[{ ...selected.instruments[0], weight:1, initial_amount:10000, monthly_amount:700 }], disclaimer:'Illustrative only.' },
  investment_policy:{ execution_status:'gated', objective:'Fund the target.', tax_policy:'Review tax annually.', rebalancing_rule:'Annual.', monitoring_rule:'On change.', suitability_flags:[{ title:'Liquidity reserve below policy minimum', detail:'1.2 months funded.', resolution_code:'cash_flow' }] },
};

const renderPage = (subStep, props = {}) => {
  Element.prototype.scrollIntoView = vi.fn();
  return render(<InvestmentLaboratory profile={profile} updateProfile={vi.fn()} lab={lab} subStep={subStep} setSubStep={vi.fn()} nextStep={vi.fn()} {...props}/>);
};

describe('investment closing workflow', () => {
  it('switches tax sensitivities and updates the after-tax result', () => {
    renderPage(4);
    expect(screen.getByText(/94\.725/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name:/Allowance used elsewhere/i }));
    expect(screen.getByText(/94\.461/)).toBeInTheDocument();
    expect(screen.getByText('Taxable after allowance')).toBeInTheDocument();
  });

  it('renders reconciled orders and tracks implementation checks', () => {
    renderPage(5);
    const orderTable = screen.getByRole('table', { name:/monthly investment orders/i });
    expect(orderTable).toBeInTheDocument();
    expect(orderTable.textContent).toContain('IE00TEST');
    fireEvent.click(screen.getByText(/Confirm every ISIN/i));
    expect(screen.getByLabelText('25% of implementation checks complete')).toBeInTheDocument();
  });

  it('routes policy gates and requires acknowledgement before continuing', () => {
    const onReviewProfile = vi.fn();
    renderPage(6, { onReviewProfile });
    const proceed = screen.getByRole('button', { name:/Acknowledge policy to continue/i });
    expect(proceed).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name:/Review cash flow/i }));
    expect(onReviewProfile).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByText(/I reviewed the assumptions/i));
    expect(screen.getByRole('button', { name:/Proceed to Solvency/i })).toBeEnabled();
  });
});
