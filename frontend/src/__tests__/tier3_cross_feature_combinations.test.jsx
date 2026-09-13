import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useProfileStore } from '../stores/profileStore';
import TopNav from '../components/TopNav';
import { PageTransition } from '../components/PageTransition';
import GDPRConsentModal from '../components/GDPRConsentModal';

vi.mock('recharts', async (importOriginal) => ({
  ...await importOriginal(),
  ResponsiveContainer: ({ children }) => <div data-testid="chart-container">{children}</div>,
}));

vi.mock('../components/AIConsultantWidget', () => ({ default: () => null }));
vi.mock('../components/InteractiveCashFlow', () => ({ default: () => null }));

beforeEach(() => {
  localStorage.clear();
  useProfileStore.getState().resetAll();
  Element.prototype.scrollIntoView = vi.fn();
  window.scrollTo = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Tier 3: Cross-Feature Combinations — Concurrency, Resize & State Flow', () => {
  describe('Navigating While State Updates', () => {
    it('preserves profile field updates dispatched simultaneously during step transitions', () => {
      let currentStep = 'profile';
      const handleSetStep = vi.fn((step) => {
        currentStep = step;
        useProfileStore.getState().setCurrentStep(step);
      });

      const { rerender } = render(
        <TopNav currentStep={currentStep} setStep={handleSetStep} />
      );

      // Perform store update and step transition in the same tick
      act(() => {
        useProfileStore.getState().updateProfile({ income: 92000, church_tax: true });
        fireEvent.click(screen.getByRole('button', { name: 'Tax Optimization' }));
      });

      expect(handleSetStep).toHaveBeenCalledWith('tax');
      rerender(<TopNav currentStep="tax" setStep={handleSetStep} />);

      const storeState = useProfileStore.getState();
      expect(storeState.profile.income).toBe(92000);
      expect(storeState.profile.church_tax).toBe(true);
      expect(storeState.currentStep).toBe('tax');
    });

    it('retains subStepMap state across cross-step jumps', () => {
      const store = useProfileStore.getState();

      // Configure subStep positions across multiple tabs
      act(() => {
        store.setSubStepMap({
          profile: 3,
          insurance: 2,
          tax: 4,
          invest: 1,
          pension: 5
        });
      });

      // Jump to profile -> check subStep
      store.setCurrentStep('profile');
      expect(useProfileStore.getState().subStepMap.profile).toBe(3);

      // Jump to pension -> check subStep
      store.setCurrentStep('pension');
      expect(useProfileStore.getState().subStepMap.pension).toBe(5);

      // Mutate tax subStep while on pension
      store.setSubStepMap((prev) => ({ ...prev, tax: 5 }));
      expect(useProfileStore.getState().subStepMap.tax).toBe(5);
      expect(useProfileStore.getState().subStepMap.pension).toBe(5);
    });
  });

  describe('Rapid Sequential Tab Switching (Race Condition Resistance)', () => {
    it('handles rapid sequential step transitions without throwing or crashing PageTransition', async () => {
      const stepSequence = ['welcome', 'profile', 'insurance', 'tax', 'invest', 'pension'];
      let active = 'welcome';
      const { rerender } = render(
        <PageTransition transitionKey={active}>
          <div data-testid={`view-${active}`}>{active}</div>
        </PageTransition>
      );

      // Rapidly fire tab switches
      for (const next of stepSequence) {
        act(() => {
          rerender(
            <PageTransition transitionKey={next}>
              <div data-testid={`view-${next}`}>{next}</div>
            </PageTransition>
          );
        });
      }

      expect(screen.getByTestId('view-pension')).toBeInTheDocument();
      expect(screen.getByText('pension')).toBeInTheDocument();
    });

    it('keeps global theme and refresh controls out of the primary navigation', () => {
      const setStep = vi.fn();
      render(<TopNav currentStep="welcome" setStep={setStep} />);

      expect(screen.queryByRole('button', { name: /Switch to (dark|light) theme/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Recalculate financial analysis/i })).not.toBeInTheDocument();
    });
  });

  describe('Viewport Resizing While Changing Steps', () => {
    it('adapts navigation between 360px mobile and 1440px desktop viewports during step changes', () => {
      const setStep = vi.fn();
      const { rerender } = render(<TopNav currentStep="welcome" setStep={setStep} />);

      // 1. Mobile Viewport (360px)
      act(() => {
        window.innerWidth = 360;
        window.dispatchEvent(new Event('resize'));
      });

      // Open mobile drawer and select 'Risk Shield'
      const openMenuBtn = screen.getByRole('button', { name: 'Open navigation menu' });
      fireEvent.click(openMenuBtn);

      const mobileRiskBtn = screen.getAllByRole('button', { name: /Risk Shield/i });
      fireEvent.click(mobileRiskBtn[mobileRiskBtn.length - 1]);
      expect(setStep).toHaveBeenCalledWith('insurance');

      // 2. Transition to Desktop Viewport (1440px)
      act(() => {
        window.innerWidth = 1440;
        window.dispatchEvent(new Event('resize'));
      });

      rerender(<TopNav currentStep="insurance" setStep={setStep} />);

      // On desktop, the direct navigation button is active
      const desktopRiskBtn = screen.getByRole('button', { name: 'Risk Shield' });
      expect(desktopRiskBtn).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('Modal Interactivity Across Navigation', () => {
    it('safely manages GDPR modal state during step navigation without leaking focus or crashing', () => {
      let isGDPROpen = true;
      const handleClose = vi.fn(() => { isGDPROpen = false; });
      const handleReset = vi.fn();

      const { rerender } = render(
        <GDPRConsentModal
          isOpen={isGDPROpen}
          onClose={handleClose}
          profile={useProfileStore.getState().profile}
          onResetData={handleReset}
        />
      );

      expect(screen.getByRole('dialog', { name: /Data Privacy & GDPR Controls/i })).toBeVisible();

      // Trigger reset data button inside modal
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      const resetBtn = screen.getByRole('button', { name: /Erase All Local Data/i });
      fireEvent.click(resetBtn);
      expect(handleReset).toHaveBeenCalledTimes(1);

      // Close modal
      const closeBtn = screen.getByRole('button', { name: /Close privacy settings/i });
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);

      rerender(
        <GDPRConsentModal
          isOpen={false}
          onClose={handleClose}
          profile={useProfileStore.getState().profile}
          onResetData={handleReset}
        />
      );
      expect(screen.queryByRole('dialog', { name: /Data Privacy & GDPR Controls/i })).not.toBeInTheDocument();
    });
  });
});
