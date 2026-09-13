import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import AuthModal from './AuthModal';

afterEach(cleanup);

describe('AuthModal', () => {
  it('renders at the document root so viewport centering is not constrained by the sticky header', () => {
    render(<AuthModal isOpen onClose={vi.fn()} />);

    expect(screen.getByRole('dialog').parentElement).toBe(document.body);
  });
});
