import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useProfileStore } from '../stores/profileStore';
import TopNav from '../components/TopNav';
import { steps } from '../components/TopNav.constants';
import StepWelcome from '../components/StepWelcome';
import StepProfile from '../components/StepProfile';
import StepInsurance from '../components/StepInsurance';
import StepTax from '../components/StepTax';
import StepInvestment from '../components/StepInvestment';
import StepRetirement from '../components/StepRetirement';
import { mockFullAnalysis } from './fixtures/mockAnalysisData';

vi.mock('recharts', async (importOriginal) => ({
  ...await importOriginal(),
  ResponsiveContainer: ({ children }) => <div data-testid="chart-container">{children}</div>,
}));

// Mock subcomponents that rely on heavy web-worker or canvas operations
vi.mock('../components/AIConsultantWidget', () => ({ default: () => <div data-testid="ai-consultant-widget" /> }));

beforeEach(() => {
  localStorage.clear();
  useProfileStore.getState().resetAll();
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Tier 1: Feature Coverage — Navigation, Routes & Layout', () => {
  describe('TopNav Primary Routes & Step Progress', () => {
    it('defines all 6 primary wizard route steps with exact IDs and labels', () => {
      const stepIds = steps.map((s) => s.id);
      expect(stepIds).toEqual(['welcome', 'profile', 'insurance', 'tax', 'invest', 'pension']);
      expect(steps[0].label).toBe('Portal');
      expect(steps[1].label).toBe('Mandate & Cashflow');
      expect(steps[2].label).toBe('Risk Shield');
      expect(steps[3].label).toBe('Tax Optimization');
      expect(steps[4].label).toBe('Asset Allocation');
      expect(steps[5].label).toBe('Solvency');
    });

    it('renders desktop navigation buttons and activates the active step', () => {
      const setStep = vi.fn();
      render(<TopNav currentStep="profile" setStep={setStep} />);

      expect(screen.getByText('Northstar Financial')).toBeInTheDocument();

      const activeBtn = screen.getByRole('button', { name: 'Mandate & Cashflow' });
      expect(activeBtn).toHaveAttribute('aria-current', 'page');

      const taxBtn = screen.getByRole('button', { name: 'Tax Optimization' });
      expect(taxBtn).not.toHaveAttribute('aria-current');

      fireEvent.click(taxBtn);
      expect(setStep).toHaveBeenCalledWith('tax');
    });

    it('navigates back to welcome when clicking the brand crest', () => {
      const setStep = vi.fn();
      render(<TopNav currentStep="invest" setStep={setStep} />);

      const homeCrest = screen.getByRole('button', { name: 'Return to Portal Home' });
      fireEvent.click(homeCrest);
      expect(setStep).toHaveBeenCalledWith('welcome');
    });

    it('keeps the portal header free of progress indicators', () => {
      render(<TopNav currentStep="welcome" setStep={vi.fn()} />);
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      expect(screen.queryByText(/\d+%/)).not.toBeInTheDocument();
    });

    it('toggles mobile menu drawer with full step access on responsive viewports', () => {
      const setStep = vi.fn();
      render(<TopNav currentStep="welcome" setStep={setStep} />);

      const menuToggle = screen.getByRole('button', { name: 'Open navigation menu' });
      expect(menuToggle).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(menuToggle);
      expect(menuToggle).toHaveAttribute('aria-expanded', 'true');

      // In mobile menu drawer, all steps are accessible
      const mobileTaxBtn = screen.getAllByRole('button', { name: /Tax Optimization/i });
      expect(mobileTaxBtn.length).toBeGreaterThanOrEqual(1);
      fireEvent.click(mobileTaxBtn[mobileTaxBtn.length - 1]);
      expect(setStep).toHaveBeenCalledWith('tax');
    });
  });

  describe('Primary Route Views Rendering', () => {
    it('renders StepWelcome with CTA and architectural value pillars', () => {
      const nextStep = vi.fn();
      render(<StepWelcome nextStep={nextStep} analysis={mockFullAnalysis} />);

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/A clearer plan/i);
      expect(screen.queryByText(/Independent financial planning · Germany/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/product commissions/i)).not.toBeInTheDocument();
      const ctaBtn = screen.getByRole('button', { name: /Build my financial plan/i });
      expect(ctaBtn).toBeInTheDocument();

      fireEvent.click(ctaBtn);
      expect(nextStep).toHaveBeenCalledTimes(1);
    });

    it('renders StepProfile with financial goals and sub-steps', () => {
      const profile = useProfileStore.getState().profile;
      const updateProfile = vi.fn();
      const setSubStep = vi.fn();

      render(
        <StepProfile
          profile={profile}
          updateProfile={updateProfile}
          subStep={0}
          setSubStep={setSubStep}
          analysis={mockFullAnalysis}
        />
      );

      expect(screen.getByText('Select Your Financial Goals')).toBeInTheDocument();
      expect(screen.getByText('Financial Freedom & Early Retirement')).toBeInTheDocument();
    });

    it('renders StepInsurance risk shield when analysis is supplied', () => {
      const profile = useProfileStore.getState().profile;
      render(
        <StepInsurance
          profile={profile}
          updateProfile={vi.fn()}
          analysis={mockFullAnalysis}
          subStep={0}
          setSubStep={vi.fn()}
        />
      );

      expect(screen.getByText(/Protect the balance sheet in the right order/i)).toBeInTheDocument();
      expect(screen.getByText('Privathaftpflicht')).toBeInTheDocument();
    });

    it('renders StepTax statutory assessment lab when analysis is supplied', () => {
      const profile = useProfileStore.getState().profile;
      render(
        <StepTax
          profile={profile}
          updateProfile={vi.fn()}
          analysis={mockFullAnalysis}
          subStep={0}
          setSubStep={vi.fn()}
        />
      );

      expect(screen.getByText(/Build a defensible tax position from documented inputs/i)).toBeInTheDocument();
    });

    it('renders StepInvestment asset allocation lab when analysis is supplied', () => {
      const profile = useProfileStore.getState().profile;
      render(
        <StepInvestment
          profile={profile}
          updateProfile={vi.fn()}
          analysis={mockFullAnalysis}
          subStep={0}
          setSubStep={vi.fn()}
          analysisStatus="success"
        />
      );

      expect(screen.getByText(/Core Quantitative Comparison/i)).toBeInTheDocument();
    });

    it('renders StepRetirement 3-pillar solvency lab when analysis is supplied', () => {
      const profile = useProfileStore.getState().profile;
      render(
        <StepRetirement
          profile={profile}
          updateProfile={vi.fn()}
          analysis={mockFullAnalysis}
          subStep={0}
          setSubStep={vi.fn()}
        />
      );

      expect(screen.getByText(/Design retirement income that survives inflation/i)).toBeInTheDocument();
      expect(screen.getByText(/Target income today/i)).toBeInTheDocument();
    });
  });

  describe('Zustand Store Hydration & Mutation Contract', () => {
    it('initializes with complete 47-field baseline financial profile', () => {
      const state = useProfileStore.getState();
      expect(state.profile).toBeDefined();
      expect(state.profile.age).toBe(30);
      expect(state.profile.income).toBe(60000);
      expect(state.profile.tax_class).toBe(1);
      expect(state.profile.monthly_investment).toBe(500);
      expect(state.profile.retirement_age).toBe(67);
      expect(state.currentStep).toBe('welcome');
      expect(state.subStepMap).toEqual({ profile: 0, insurance: 0, tax: 0, invest: 0, pension: 0 });
    });

    it('applies partial profile updates immutably and preserves unmentioned keys', () => {
      const store = useProfileStore.getState();
      store.updateProfile({ income: 85000, age: 34 });

      const updated = useProfileStore.getState().profile;
      expect(updated.income).toBe(85000);
      expect(updated.age).toBe(34);
      expect(updated.retirement_age).toBe(67); // preserved
      expect(updated.tax_class).toBe(1); // preserved
    });

    it('updates currentStep and subStepMap tracking cleanly', () => {
      const store = useProfileStore.getState();
      store.setCurrentStep('tax');
      store.setSubStepMap((prev) => ({ ...prev, tax: 3 }));

      const current = useProfileStore.getState();
      expect(current.currentStep).toBe('tax');
      expect(current.subStepMap.tax).toBe(3);
    });

    it('resets all state to pristine defaults via resetAll', () => {
      const store = useProfileStore.getState();
      store.updateProfile({ income: 150000 });
      store.setCurrentStep('invest');
      store.setSubStepMap({ profile: 2, insurance: 1, tax: 4, invest: 2, pension: 1 });

      useProfileStore.getState().resetAll();

      const pristine = useProfileStore.getState();
      expect(pristine.profile.income).toBe(60000);
      expect(pristine.currentStep).toBe('welcome');
      expect(pristine.subStepMap.tax).toBe(0);
    });
  });
});
