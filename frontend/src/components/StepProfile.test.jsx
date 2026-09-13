import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import StepProfile from './StepProfile';

vi.mock('./AIConsultantWidget', () => ({ default: () => null }));
vi.mock('./InteractiveCashFlow', () => ({ default: () => null }));
afterEach(cleanup);

describe('Profile render regression', () => {
  it.each([0, 1, 2, 3, 4, 5])('renders substep %s with a minimal profile', subStep => {
    const { container } = render(<StepProfile profile={{}} subStep={subStep} updateProfile={vi.fn()} />);
    expect(container.textContent.length).toBeGreaterThan(0);
  });

  it.each([[undefined, '500'], [0, '0'], [725, '725']])('renders investment %s in the financial audit', (amount, label) => {
    render(<StepProfile profile={{ monthly_investment: amount }} subStep={5} updateProfile={vi.fn()} />);
    expect(screen.getByText(`€${label} / mo (TER 0.14%)`)).toBeInTheDocument();
  });
});
