import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

function Page({ fail }) {
  if (fail) throw new Error('Synthetic page crash');
  return <h1>Portal recovered</h1>;
}

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('ErrorBoundary route recovery', () => {
  it('recovers when the route changes, but not on unrelated rerenders', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { rerender } = render(<ErrorBoundary resetKey="profile"><Page fail /></ErrorBoundary>);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    rerender(<ErrorBoundary resetKey="profile"><Page fail={false} /></ErrorBoundary>);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    rerender(<ErrorBoundary resetKey="welcome"><Page fail={false} /></ErrorBoundary>);
    expect(screen.getByRole('heading', { name: 'Portal recovered' })).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });
});
