import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useProfileStore } from '../stores/profileStore';
import StepWelcome from '../components/StepWelcome';
import StepProfile from '../components/StepProfile';
import StepInsurance from '../components/StepInsurance';
import StepTax from '../components/StepTax';
import StepInvestment from '../components/StepInvestment';
import StepRetirement from '../components/StepRetirement';
import TopNav from '../components/TopNav';
import ErrorBoundary from '../components/ErrorBoundary';
import { mockFullAnalysis } from './fixtures/mockAnalysisData';

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

describe('Tier 4: Real-World Scenarios — E2E Journey & Offline Backend Simulation', () => {
  describe('Full 6-Step End-to-End User Journey (1440px Desktop Viewport)', () => {
    it('executes full sequential wizard workflow from Welcome through Pension without exceptions', () => {
      let currentStep = 'welcome';
      const stepsOrder = ['welcome', 'profile', 'insurance', 'tax', 'invest', 'pension'];

      const nextStep = vi.fn(() => {
        const idx = stepsOrder.indexOf(currentStep);
        if (idx < stepsOrder.length - 1) {
          currentStep = stepsOrder[idx + 1];
          useProfileStore.getState().setCurrentStep(currentStep);
        }
      });

      const prevStep = vi.fn(() => {
        const idx = stepsOrder.indexOf(currentStep);
        if (idx > 0) {
          currentStep = stepsOrder[idx - 1];
          useProfileStore.getState().setCurrentStep(currentStep);
        }
      });

      const updateProfile = vi.fn((patch) => {
        useProfileStore.getState().updateProfile(patch);
      });

      // Viewport set to 1440px Desktop
      window.innerWidth = 1440;

      // STEP 1: Welcome
      const { rerender } = render(
        <ErrorBoundary>
          <StepWelcome nextStep={nextStep} analysis={mockFullAnalysis} />
        </ErrorBoundary>
      );
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/A clearer plan/i);
      fireEvent.click(screen.getByRole('button', { name: /Build my financial plan/i }));
      expect(nextStep).toHaveBeenCalledTimes(1);
      expect(currentStep).toBe('profile');

      // STEP 2: Profile (Mandate & Cashflow)
      rerender(
        <ErrorBoundary>
          <StepProfile
            profile={useProfileStore.getState().profile}
            updateProfile={updateProfile}
            nextStep={nextStep}
            prevStep={prevStep}
            analysis={mockFullAnalysis}
            subStep={0}
            setSubStep={vi.fn()}
          />
        </ErrorBoundary>
      );
      expect(screen.getByText(/Select Your Financial Goals/i)).toBeInTheDocument();

      // User chooses 'Financial Freedom' goal
      const freedomGoal = screen.getByText('Financial Freedom & Early Retirement');
      fireEvent.click(freedomGoal);

      // Advance to next step
      nextStep();
      expect(currentStep).toBe('insurance');

      // STEP 3: Insurance (Risk Shield)
      rerender(
        <ErrorBoundary>
          <StepInsurance
            profile={useProfileStore.getState().profile}
            updateProfile={updateProfile}
            nextStep={nextStep}
            prevStep={prevStep}
            analysis={mockFullAnalysis}
            subStep={0}
            setSubStep={vi.fn()}
          />
        </ErrorBoundary>
      );
      expect(screen.getByText(/Protect the balance sheet in the right order/i)).toBeInTheDocument();
      expect(screen.getByText('Privathaftpflicht')).toBeInTheDocument();

      // Advance to Tax
      nextStep();
      expect(currentStep).toBe('tax');

      // STEP 4: Tax Optimization
      rerender(
        <ErrorBoundary>
          <StepTax
            profile={useProfileStore.getState().profile}
            updateProfile={updateProfile}
            nextStep={nextStep}
            prevStep={prevStep}
            analysis={mockFullAnalysis}
            subStep={0}
            setSubStep={vi.fn()}
          />
        </ErrorBoundary>
      );
      expect(screen.getByText(/Build a defensible tax position from documented inputs/i)).toBeInTheDocument();

      // Advance to Investment
      nextStep();
      expect(currentStep).toBe('invest');

      // STEP 5: Asset Allocation / Investment Laboratory
      rerender(
        <ErrorBoundary>
          <StepInvestment
            profile={useProfileStore.getState().profile}
            updateProfile={updateProfile}
            nextStep={nextStep}
            prevStep={prevStep}
            analysis={mockFullAnalysis}
            subStep={0}
            setSubStep={vi.fn()}
            analysisStatus="success"
          />
        </ErrorBoundary>
      );
      expect(screen.getByText(/Core Quantitative Comparison/i)).toBeInTheDocument();

      // Advance to Pension
      nextStep();
      expect(currentStep).toBe('pension');

      // STEP 6: Solvency / Retirement Planning
      rerender(
        <ErrorBoundary>
          <StepRetirement
            profile={useProfileStore.getState().profile}
            updateProfile={updateProfile}
            nextStep={nextStep}
            prevStep={prevStep}
            analysis={mockFullAnalysis}
            subStep={0}
            setSubStep={vi.fn()}
          />
        </ErrorBoundary>
      );
      expect(screen.getByText(/Design retirement income that survives inflation/i)).toBeInTheDocument();
      expect(screen.getByText(/Target income today/i)).toBeInTheDocument();

      // Verify no ErrorBoundary fallback was triggered throughout the entire workflow
      expect(screen.queryByText(/Section Encountered an Issue/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Something went wrong/i)).not.toBeInTheDocument();
    });
  });

  describe('Full 6-Step End-to-End User Journey (360px Mobile Viewport)', () => {
    it('traverses the complete wizard on a 360px mobile viewport without layout-crashing exceptions', () => {
      let currentStep = 'welcome';
      const setStep = vi.fn((s) => {
        currentStep = s;
        useProfileStore.getState().setCurrentStep(s);
      });

      // Viewport set to 360px Mobile
      window.innerWidth = 360;

      const { rerender } = render(
        <ErrorBoundary>
          <TopNav currentStep={currentStep} setStep={setStep} />
          <StepWelcome nextStep={() => setStep('profile')} analysis={mockFullAnalysis} />
        </ErrorBoundary>
      );

      // Welcome screen on mobile has Launch button
      const cta = screen.getByRole('button', { name: /Build my financial plan/i });
      fireEvent.click(cta);
      expect(setStep).toHaveBeenCalledWith('profile');

      // Mobile drawer allows jump directly to any step
      const burger = screen.getByRole('button', { name: 'Open navigation menu' });
      fireEvent.click(burger);

      const solvencyMobileBtn = screen.getAllByRole('button', { name: /Solvency/i });
      fireEvent.click(solvencyMobileBtn[solvencyMobileBtn.length - 1]);
      expect(setStep).toHaveBeenCalledWith('pension');

      rerender(
        <ErrorBoundary>
          <TopNav currentStep="pension" setStep={setStep} />
          <StepRetirement
            profile={useProfileStore.getState().profile}
            updateProfile={vi.fn()}
            analysis={mockFullAnalysis}
            subStep={0}
            setSubStep={vi.fn()}
          />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Design retirement income that survives inflation/i)).toBeInTheDocument();
      expect(screen.queryByText(/Something went wrong/i)).not.toBeInTheDocument();
    });
  });

  describe('Offline Backend Simulation (Fault Tolerance & Self-Healing)', () => {
    it('renders graceful offline fallback in StepTax when backend is unavailable and allows retry', () => {
      const onRetry = vi.fn();
      render(
        <ErrorBoundary>
          <StepTax
            profile={useProfileStore.getState().profile}
            updateProfile={vi.fn()}
            analysis={null}
            subStep={0}
            setSubStep={vi.fn()}
            analysisStatus="error"
            analysisError="The analysis service could not be reached. Your inputs remain saved locally."
            onRetryAnalysis={onRetry}
          />
        </ErrorBoundary>
      );

      // Verify offline alert is displayed gracefully
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Tax Analysis Engine Offline/i })).toBeInTheDocument();
      expect(screen.getByText(/The analysis service could not be reached/i)).toBeInTheDocument();

      // Verify retry button exists and triggers retry
      const retryBtn = screen.getByRole('button', { name: /Retry Analysis/i });
      expect(retryBtn).toBeInTheDocument();
      fireEvent.click(retryBtn);
      expect(onRetry).toHaveBeenCalledTimes(1);

      // Verify NO ErrorBoundary crashed
      expect(screen.queryByText(/Section Encountered an Issue/i)).not.toBeInTheDocument();
    });

    it('renders graceful offline fallback in StepInvestment when backend is unavailable and allows retry', () => {
      const onRetry = vi.fn();
      render(
        <ErrorBoundary>
          <StepInvestment
            profile={useProfileStore.getState().profile}
            updateProfile={vi.fn()}
            analysis={null}
            subStep={0}
            setSubStep={vi.fn()}
            analysisStatus="error"
            analysisError="Investment model unavailable"
            onRetryAnalysis={onRetry}
          />
        </ErrorBoundary>
      );

      // InvestmentLaboratory renders alert with retry
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/Investment model unavailable/i)).toBeInTheDocument();

      const retryBtn = screen.getByRole('button', { name: /Retry analysis/i });
      expect(retryBtn).toBeInTheDocument();
      fireEvent.click(retryBtn);
      expect(onRetry).toHaveBeenCalledTimes(1);

      expect(screen.queryByText(/Section Encountered an Issue/i)).not.toBeInTheDocument();
    });

    it('preserves user profile mutations in local store during extended offline operation', () => {
      const store = useProfileStore.getState();

      // Offline user edits
      act(() => {
        store.updateProfile({
          income: 78000,
          housing_cost: 1350,
          monthly_investment: 650
        });
      });

      const offlineSaved = useProfileStore.getState().profile;
      expect(offlineSaved.income).toBe(78000);
      expect(offlineSaved.housing_cost).toBe(1350);
      expect(offlineSaved.monthly_investment).toBe(650);

      // Reconnecting / successful analysis doesn't discard user inputs
      act(() => {
        store.setAnalysis(mockFullAnalysis);
      });

      const postOnlineProfile = useProfileStore.getState().profile;
      expect(postOnlineProfile.income).toBe(78000);
      expect(useProfileStore.getState().analysis).toBeDefined();
    });
  });
});
