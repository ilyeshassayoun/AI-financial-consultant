import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { useProfileStore } from '../stores/profileStore';
import StepProfile from '../components/StepProfile';
import StepInsurance from '../components/StepInsurance';
import StepTax from '../components/StepTax';
import StepInvestment from '../components/StepInvestment';
import StepRetirement from '../components/StepRetirement';
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
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Tier 2: Boundary & Corner Cases — State Resilience & Sabotage Defense', () => {
  describe('Defensive Hydration: Empty & Corrupted Storage', () => {
    it('initializes default profile cleanly when localStorage is completely empty', () => {
      localStorage.clear();
      const state = useProfileStore.getState();
      expect(state.profile).not.toBeNull();
      expect(state.profile.age).toBe(30);
      expect(state.profile.income).toBe(60000);
      expect(state.currentStep).toBe('welcome');
    });

    it('tolerates non-existent or null profile in store updates without fatal exception', () => {
      const store = useProfileStore.getState();
      expect(() => {
        store.updateProfile({});
      }).not.toThrow();
      expect(useProfileStore.getState().profile.age).toBe(30);
    });

    it('handles simulated corrupted JSON storage without triggering ErrorBoundary', () => {
      const badPayload = '{{unclosed_malformed_json_state...';
      localStorage.setItem('financial-consultant-profile', badPayload);

      // Verify that accessing or resetting store recovers gracefully
      expect(() => {
        useProfileStore.getState().resetAll();
      }).not.toThrow();

      const profile = useProfileStore.getState().profile;
      expect(profile).toBeDefined();
      expect(profile.income).toBe(60000);
    });
  });

  describe('Partial Profiles & Missing Keys Across Step Components', () => {
    const partialProfile = { age: 28 }; // completely stripped of other 46 keys

    it.each([0, 1, 2, 3, 4, 5])('renders StepProfile sub-step %i with an ultra-minimal partial profile without crashing', (subStep) => {
      expect(() => {
        render(
          <ErrorBoundary>
            <StepProfile
              profile={partialProfile}
              updateProfile={vi.fn()}
              subStep={subStep}
              setSubStep={vi.fn()}
            />
          </ErrorBoundary>
        );
      }).not.toThrow();
      expect(screen.queryByText(/Something went wrong/i)).not.toBeInTheDocument();
    });

    it('renders StepInsurance safely with empty profile and null analysis', () => {
      expect(() => {
        render(
          <ErrorBoundary>
            <StepInsurance
              profile={{}}
              updateProfile={vi.fn()}
              analysis={null}
              subStep={0}
              setSubStep={vi.fn()}
            />
          </ErrorBoundary>
        );
      }).not.toThrow();
      expect(screen.getByText(/Building the protection needs analysis/i)).toBeInTheDocument();
      expect(screen.queryByText(/Something went wrong/i)).not.toBeInTheDocument();
    });

    it('renders StepTax safely with empty profile and null analysis', () => {
      expect(() => {
        render(
          <ErrorBoundary>
            <StepTax
              profile={{}}
              updateProfile={vi.fn()}
              analysis={null}
              subStep={0}
              setSubStep={vi.fn()}
            />
          </ErrorBoundary>
        );
      }).not.toThrow();
      expect(screen.getByText(/Building the 2026 tax scenario lab/i)).toBeInTheDocument();
      expect(screen.queryByText(/Something went wrong/i)).not.toBeInTheDocument();
    });

    it('renders StepRetirement safely with empty profile and null analysis', () => {
      expect(() => {
        render(
          <ErrorBoundary>
            <StepRetirement
              profile={{}}
              updateProfile={vi.fn()}
              analysis={null}
              subStep={0}
              setSubStep={vi.fn()}
            />
          </ErrorBoundary>
        );
      }).not.toThrow();
      expect(screen.getByText(/Building the retirement adequacy lab/i)).toBeInTheDocument();
      expect(screen.queryByText(/Something went wrong/i)).not.toBeInTheDocument();
    });

    it('renders StepInvestment safely with empty profile and null analysis', () => {
      expect(() => {
        render(
          <ErrorBoundary>
            <StepInvestment
              profile={{}}
              updateProfile={vi.fn()}
              analysis={null}
              subStep={0}
              setSubStep={vi.fn()}
              analysisStatus="idle"
            />
          </ErrorBoundary>
        );
      }).not.toThrow();
      expect(screen.queryByText(/Something went wrong/i)).not.toBeInTheDocument();
    });
  });

  describe('Extreme Numbers & Zero Boundaries', () => {
    it('handles zero income and zero monthly investment without NaN or division by zero', () => {
      const zeroProfile = {
        ...useProfileStore.getState().profile,
        income: 0,
        monthly_investment: 0,
        initial_amount: 0,
        housing_cost: 0,
        living_cost: 0,
      };

      const { container } = render(
        <ErrorBoundary>
          <StepProfile
            profile={zeroProfile}
            updateProfile={vi.fn()}
            subStep={0}
            setSubStep={vi.fn()}
          />
        </ErrorBoundary>
      );

      expect(container.textContent).not.toMatch(/NaN/);
      expect(screen.queryByText(/Something went wrong/i)).not.toBeInTheDocument();
    });

    it('handles astronomical wealth numbers without layout collapse or numerical explosion', () => {
      const extremeProfile = {
        ...useProfileStore.getState().profile,
        income: 10000000,
        initial_amount: 500000000,
        monthly_investment: 100000,
        target_wealth: 1000000000,
      };

      const { container } = render(
        <ErrorBoundary>
          <StepProfile
            profile={extremeProfile}
            updateProfile={vi.fn()}
            subStep={1}
            setSubStep={vi.fn()}
          />
        </ErrorBoundary>
      );

      expect(container.textContent).not.toMatch(/NaN/);
      expect(screen.queryByText(/Something went wrong/i)).not.toBeInTheDocument();
    });

    it('handles negative inputs without crashing calculation views', () => {
      const negativeProfile = {
        ...useProfileStore.getState().profile,
        secondary_income: -5000,
        commute_km: -20,
      };

      expect(() => {
        render(
          <ErrorBoundary>
            <StepProfile
              profile={negativeProfile}
              updateProfile={vi.fn()}
              subStep={2}
              setSubStep={vi.fn()}
            />
          </ErrorBoundary>
        );
      }).not.toThrow();
      expect(screen.queryByText(/Something went wrong/i)).not.toBeInTheDocument();
    });
  });

  describe('Sabotage Payloads & Type Poisoning', () => {
    it('handles string values injected into numeric profile fields', () => {
      const poisonedProfile = {
        ...useProfileStore.getState().profile,
        income: '60000 EUR',
        age: 'thirty',
        monthly_investment: 'invalid_number',
      };

      expect(() => {
        render(
          <ErrorBoundary>
            <StepProfile
              profile={poisonedProfile}
              updateProfile={vi.fn()}
              subStep={1}
              setSubStep={vi.fn()}
            />
          </ErrorBoundary>
        );
      }).not.toThrow();
      expect(screen.queryByText(/Something went wrong/i)).not.toBeInTheDocument();
    });

    it('defends against prototype pollution keys in profile update patch', () => {
      const store = useProfileStore.getState();
      const maliciousPatch = JSON.parse('{"__proto__": {"admin": true}, "polluted": true}');

      store.updateProfile(maliciousPatch);
      const rootObject = {};
      expect(rootObject.admin).toBeUndefined();
    });

    it('renders StepInsurance when existing_insurances contains malformed entries', () => {
      const malformedInsurances = {
        ...useProfileStore.getState().profile,
        existing_insurances: [null, undefined, 12345, '', 'LIABILITY'],
      };

      render(
        <ErrorBoundary>
          <StepInsurance
            profile={malformedInsurances}
            updateProfile={vi.fn()}
            analysis={mockFullAnalysis}
            subStep={0}
            setSubStep={vi.fn()}
          />
        </ErrorBoundary>
      );

      expect(screen.queryByText(/Something went wrong/i)).not.toBeInTheDocument();
    });
  });
});
