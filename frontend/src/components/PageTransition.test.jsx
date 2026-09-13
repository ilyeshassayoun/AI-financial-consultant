import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { PageTransition } from './PageTransition';

afterEach(cleanup);

describe('PageTransition', () => {
  it('removes the previous section immediately when the route changes', () => {
    const { rerender } = render(<PageTransition transitionKey="portal"><button>Old page action</button></PageTransition>);
    rerender(<PageTransition transitionKey="invest"><button>New page action</button></PageTransition>);
    expect(screen.getByRole('button', { name: 'New page action' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Old page action' })).not.toBeInTheDocument();
  });
});
