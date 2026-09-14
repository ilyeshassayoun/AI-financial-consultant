import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ScenarioBanner from './ScenarioBanner';

describe('ScenarioBanner', () => {
  it('is hidden without hypothetical overrides', () => {
    render(<ScenarioBanner overrides={{}} />);
    expect(screen.queryByLabelText('Hypothetical scenario active')).not.toBeInTheDocument();
  });

  it('labels scenario values and requires an explicit apply action', () => {
    const onApply = vi.fn();
    const onReset = vi.fn();
    render(
      <ScenarioBanner
        overrides={{ monthly_investment: 900 }}
        onApply={onApply}
        onReset={onReset}
      />,
    );

    expect(screen.getByText(/Monthly funding: 900/)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: /Apply to profile/i }));
    expect(onApply).toHaveBeenCalledOnce();
    expect(onReset).not.toHaveBeenCalled();
  });
});
