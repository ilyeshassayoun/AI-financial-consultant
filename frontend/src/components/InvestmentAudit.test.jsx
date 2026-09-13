import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import InvestmentLaboratory from './InvestmentLaboratory';
import PropertyView from './PropertyView';
import BrokerDepotSimulator from './BrokerDepotSimulator';
import HistoricalBacktestChart from './HistoricalBacktestChart';

vi.mock('recharts', async importOriginal => ({
  ...await importOriginal(), ResponsiveContainer: () => <div data-testid="chart-container" />,
}));

const selected = {
  id: 'balanced_60_40', name: 'Balanced 60/40', why: 'Educational comparison',
  allocation: [], instruments: [], timeline: [], p50: 200000,
};
const lab = {
  selected, selected_strategy: selected.id, strategies: [selected],
  investment_policy: { execution_status: 'eligible_for_review' },
  methodology: { simulations_per_strategy: 600 },
};

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('investment audit workflows', () => {
  it('does not apply a strategy when the stored suitability answers gate it', () => {
    const updateProfile = vi.fn(), setSubStep = vi.fn();
    render(<InvestmentLaboratory lab={lab} subStep={1} setSubStep={setSubStep}
      updateProfile={updateProfile} analysisStatus="success" profile={{
        investment_priority: 'income', investment_liquidity: 'short', investment_loss_tolerance: 'low',
      }} />);
    expect(screen.getByText('No growth-portfolio match')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Apply match & continue' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Continue without applying a match/ }));
    expect(updateProfile).not.toHaveBeenCalled();
    expect(setSubStep).toHaveBeenCalledWith(2);
  });

  it('writes questionnaire changes to the persistent profile boundary', () => {
    const updateProfile = vi.fn();
    render(<InvestmentLaboratory lab={lab} subStep={1} updateProfile={updateProfile} profile={{}} />);
    fireEvent.click(screen.getByRole('button', { name: /Within 3 years/ }));
    expect(updateProfile).toHaveBeenCalledWith({ investment_liquidity: 'short' });
  });

  it('cannot show an eligible policy by jumping past a suitability gate', () => {
    render(<InvestmentLaboratory lab={lab} subStep={6} updateProfile={vi.fn()}
      profile={{ investment_loss_tolerance: 'low' }} analysisStatus="success" />);
    expect(screen.getByText('Resolve suitability gates')).toBeInTheDocument();
    expect(screen.queryByText('Eligible for final review')).not.toBeInTheDocument();
  });

  it('does not approve policy results while analysis is stale', () => {
    render(<InvestmentLaboratory lab={lab} subStep={6} updateProfile={vi.fn()} profile={{}} analysisStatus="stale" />);
    expect(screen.getByText('Resolve suitability gates')).toBeInTheDocument();
  });

  it('renders unavailable IRR, infeasible occupancy and negative equity honestly', () => {
    render(<PropertyView selected={selected} profile={{ investment_years: 20 }} updateProfile={vi.fn()}
      property={{ levered_irr: null, break_even_occupancy: 1.8, occupancy_feasible: false, exit_equity: -228921 }} />);
    expect(screen.getByRole('heading', { name: 'Equity IRR not uniquely defined' })).toBeInTheDocument();
    expect(screen.getByText('Not achievable (180.0% required)')).toBeInTheDocument();
    expect(screen.getAllByText(/-228.921/)).toHaveLength(2);
  });

  it('allows a depreciation scenario in the property input', () => {
    const updateProfile = vi.fn();
    render(<PropertyView selected={selected} profile={{}} property={{}} updateProfile={updateProfile} />);
    const appreciation = screen.getByRole('spinbutton', { name: /Annual appreciation/ });
    expect(appreciation).toHaveAttribute('min', '-20');
    fireEvent.change(appreciation, { target: { value: '-5' } });
    expect(updateProfile).toHaveBeenCalledWith({ property_appreciation: -.05 });
  });

  it('downloads a real zero-contribution checklist without implying a broker transaction', () => {
    vi.useFakeTimers();
    let contents, filename;
    const NativeBlob = Blob, NativeURL = URL;
    vi.stubGlobal('Blob', class extends NativeBlob {
      constructor(parts, options) { super(parts, options); contents = parts.join(''); }
    });
    const revoke = vi.fn();
    vi.stubGlobal('URL', class extends NativeURL {
      static createObjectURL = vi.fn(() => 'blob:test-checklist');
      static revokeObjectURL = revoke;
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () { filename = this.download; });
    render(<BrokerDepotSimulator monthlyContribution={0} />);
    fireEvent.click(screen.getByRole('button', { name: /Download .* Setup Checklist/ }));
    const blueprint = JSON.parse(contents);
    expect(blueprint.monthly_contribution_eur).toBe(0);
    expect(blueprint.annual_contribution_eur).toBe(0);
    expect(blueprint.checklist.length).toBeGreaterThan(0);
    expect(filename).toBe('investment-setup-checklist.json');
    expect(screen.getByText(/No account, order or mandate was created/)).toBeInTheDocument();
    vi.runAllTimers();
    expect(revoke).toHaveBeenCalledWith('blob:test-checklist');
  });

  it('labels synthetic curves and removes unsupported performance statistics', () => {
    render(<HistoricalBacktestChart />);
    expect(screen.getByText(/Synthetic educational examples/)).toBeInTheDocument();
    expect(screen.queryByText(/Empirical Backtesting/)).not.toBeInTheDocument();
    expect(screen.queryByText('+1.8% Sharpe')).not.toBeInTheDocument();
    expect(screen.queryByText('2.4 Years')).not.toBeInTheDocument();
  });
});
