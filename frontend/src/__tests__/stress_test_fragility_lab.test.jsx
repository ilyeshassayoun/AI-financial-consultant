import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StressTestFragilityLab from '../components/StressTestFragilityLab';

// Mock Recharts responsive container to render children reliably in JSDOM
vi.mock('recharts', async () => {
  const original = await vi.importActual('recharts');
  return {
    ...original,
    ResponsiveContainer: ({ children }) => <div data-testid="responsive-container" style={{ width: 800, height: 400 }}>{children}</div>
  };
});

describe('StressTestFragilityLab', () => {
  const mockProfile = {
    age: 35,
    retirement_age: 67,
    initial_amount: 100000,
    monthly_investment: 800,
    target_wealth: 500000,
    safe_withdrawal_rate: 0.035,
    investment_strategy: 'balanced_60_40'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the fragility laboratory with headline and all 3 historical crisis regimes', async () => {
    render(<StressTestFragilityLab profile={mockProfile} />);

    expect(screen.getByRole('heading', { name: /historical regime stress testing & fragility lab/i })).toBeInTheDocument();
    expect(screen.getByText(/2008 Global Financial Crisis/i)).toBeInTheDocument();
    expect(screen.getByText(/2000 Dot-Com Crash/i)).toBeInTheDocument();
    expect(screen.getByText(/1973-1974 Stagflation Shock/i)).toBeInTheDocument();
  });

  it('switches between historical crises and updates quantitative drawdown KPIs', async () => {
    render(<StressTestFragilityLab profile={mockProfile} />);

    // Default is 2008 GFC
    expect(screen.getByText(/2008 Global Financial Crisis/i)).toBeInTheDocument();
    expect(screen.getByText(/Recovery Horizon/i)).toBeInTheDocument();

    // Click Dot-Com Crash
    const dotComButton = screen.getByText(/2000 Dot-Com Crash/i).closest('button');
    fireEvent.click(dotComButton);

    await waitFor(() => {
      expect(screen.getByText(/Tech Bubble Unwind & 3-Year Grinding Equity Bear Market/i)).toBeInTheDocument();
    });

    // Click 1973 Stagflation Shock
    const stagflationButton = screen.getByText(/1973-1974 Stagflation Shock/i).closest('button');
    fireEvent.click(stagflationButton);

    await waitFor(() => {
      expect(screen.getByText(/OPEC Oil Embargo, Inflation Spiral/i)).toBeInTheDocument();
      expect(screen.getByText(/Real Purchasing Loss/i)).toBeInTheDocument();
    });
  });

  it('toggles decumulation Sequence-of-Returns Risk (SRR) mode and exposes safe withdrawal rate slider', async () => {
    render(<StressTestFragilityLab profile={mockProfile} initialMode="accumulation" />);

    // Click Decumulation (SRR)
    const decumulationButton = screen.getByRole('button', { name: /decumulation \(srr\)/i });
    fireEvent.click(decumulationButton);

    expect(screen.getByText(/Decumulation Sequence-of-Returns Risk \(SRR\) Stress Mode/i)).toBeInTheDocument();
    const slider = screen.getByLabelText(/Withdrawal Rate/i);
    expect(slider).toBeInTheDocument();

    // Adjust withdrawal rate
    fireEvent.change(slider, { target: { value: '0.045' } });
    expect(screen.getByText(/Withdrawal Rate: 4.5%/i)).toBeInTheDocument();
  });

  it('toggles between capital wealth trajectory and peak-to-trough drawdown curve views', async () => {
    render(<StressTestFragilityLab profile={mockProfile} />);

    const drawdownViewButton = screen.getByRole('button', { name: /drawdown \(%\)/i });
    fireEvent.click(drawdownViewButton);

    expect(screen.getByText(/Peak-to-Trough Drawdown Curve/i)).toBeInTheDocument();

    const capitalViewButton = screen.getByRole('button', { name: /capital \(€\)/i });
    fireEvent.click(capitalViewButton);

    expect(screen.getByText(/Nominal vs Real Wealth Trajectory/i)).toBeInTheDocument();
  });

  it('operates reliably offline using mathematical multi-asset simulation fallback', async () => {
    // Force network failure
    global.fetch = vi.fn().mockRejectedValue(new Error('Network Offline'));

    render(<StressTestFragilityLab profile={{ ...mockProfile, initial_amount: 50000 }} />);

    expect(await screen.findByText(/Offline approximation · server model unavailable/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Recovery Horizon/i)).toBeInTheDocument();
      expect(screen.getByText(/Calibrated Safe Withdrawal Rate/i)).toBeInTheDocument();
    });
  });
});
