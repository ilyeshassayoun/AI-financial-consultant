import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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

  it('shows a readable recovery card and retries the failed section', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    let shouldFail = true;
    const RuntimePage = () => {
      if (shouldFail) throw new Error('Synthetic retry crash');
      return <h1>Section loaded</h1>;
    };

    render(<ErrorBoundary resetKey="profile"><RuntimePage /></ErrorBoundary>);

    expect(screen.getByRole('alert')).toHaveTextContent('Your saved inputs are safe');
    const retry = screen.getByRole('button', { name: 'Try Again' });
    expect(retry).toHaveStyle({ minHeight: '46px', color: '#ffffff' });

    shouldFail = false;
    fireEvent.click(retry);
    expect(screen.getByRole('heading', { name: 'Section loaded' })).toBeInTheDocument();
  });
});
