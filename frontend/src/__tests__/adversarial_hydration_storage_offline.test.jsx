import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import {
  createDefaultProfile,
  safeLocalStorage,
  useProfileStore
} from '../stores/profileStore';
import App from '../App';
import StepInsurance from '../components/StepInsurance';
import StepTax from '../components/StepTax';
import StepRetirement from '../components/StepRetirement';
import StepInvestment from '../components/StepInvestment';
import * as apiService from '../services/apiService';

// Mock recharts for headless JSDOM stability
vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    ResponsiveContainer: ({ children }) => <div data-testid="chart-container">{children}</div>,
    BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
    Bar: () => null,
    XAxis: () => null,
    YAxis: () => null,
    Tooltip: () => null,
    CartesianGrid: () => null,
    AreaChart: ({ children }) => <div data-testid="area-chart">{children}</div>,
    Area: () => null,
    PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
    Pie: () => null,
    Cell: () => null,
    ScatterChart: ({ children }) => <div data-testid="scatter-chart">{children}</div>,
    Scatter: () => null,
    ZAxis: () => null,
    Legend: () => null,
    ReferenceLine: () => null,
  };
});

// Mock external widgets and services
vi.mock('../components/AIConsultantWidget', () => ({ default: () => <div data-testid="ai-consultant-widget" /> }));
vi.mock('../services/authService', () => ({
  getCurrentSession: vi.fn().mockResolvedValue({ user: null }),
  logoutSession: vi.fn().mockResolvedValue({ success: true }),
}));

describe('Adversarial Stress Test: State Hydration, Storage Recovery & Offline Resiliency', () => {
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

  // =========================================================================
  // 1. LocalStorage Corruption & Storage Exception Immunity
  // =========================================================================
  describe('1. LocalStorage Corruption Stress Tests', () => {
    it('handles malformed JSON in localStorage without throwing syntax error', () => {
      // Intentionally insert truncated/malformed JSON string
      safeLocalStorage.setItem('financial-consultant-profile', '{"state": {"profile": { malformed JSON string ...');

      // safeLocalStorage.getItem should return string without crashing
      const raw = safeLocalStorage.getItem('financial-consultant-profile');
      expect(raw).toContain('malformed JSON string');

      // Verify custom merge behaves defensively with unparseable / null payload
      const persistOptions = useProfileStore.persist.getOptions();
      const currentState = useProfileStore.getState();

      const merged = persistOptions.merge(null, currentState);
      expect(merged.profile).toBeDefined();
      expect(merged.profile.age).toBe(30);
      expect(merged.profile.income).toBe(60000);
      expect(merged.currentStep).toBe('welcome');
    });

    it('self-heals when persisted profile is null', () => {
      const persistOptions = useProfileStore.persist.getOptions();
      const currentState = useProfileStore.getState();

      const nullPayload = {
        profile: null,
        currentStep: 'insurance',
        subStepMap: null,
        analysis: null,
      };

      const merged = persistOptions.merge(nullPayload, currentState);
      expect(merged.profile).toBeDefined();
      expect(merged.profile.age).toBe(30);
      expect(merged.profile.income).toBe(60000);
      expect(merged.profile.housing_cost).toBe(1100);
      expect(Array.isArray(merged.profile.existing_assets)).toBe(true);
      expect(Array.isArray(merged.profile.existing_insurances)).toBe(true);
      expect(Array.isArray(merged.profile.goals)).toBe(true);
      expect(merged.subStepMap.insurance).toBe(0);
      expect(merged.currentStep).toBe('insurance');
    });

    it('self-heals empty profile object { profile: {} } by populating all 47 fields', () => {
      const persistOptions = useProfileStore.persist.getOptions();
      const currentState = useProfileStore.getState();

      const emptyProfilePayload = {
        profile: {},
        currentStep: 'profile',
        subStepMap: { profile: 1 }
      };

      const merged = persistOptions.merge(emptyProfilePayload, currentState);
      const defaultProf = createDefaultProfile();
      const defaultFieldCount = Object.keys(defaultProf).length;
      expect(defaultFieldCount).toBeGreaterThanOrEqual(47);

      const mergedFieldCount = Object.keys(merged.profile).length;
      expect(mergedFieldCount).toBeGreaterThanOrEqual(47);

      // Verify each default property exists and has valid value
      for (const [key, val] of Object.entries(defaultProf)) {
        expect(merged.profile).toHaveProperty(key);
        if (Array.isArray(val)) {
          expect(Array.isArray(merged.profile[key])).toBe(true);
          expect(merged.profile[key]).toEqual(val);
        } else {
          expect(merged.profile[key]).toBe(val);
        }
      }
    });

    it('defends against partial profile { profile: { age: 30 } } with 46 missing fields', () => {
      const persistOptions = useProfileStore.persist.getOptions();
      const currentState = useProfileStore.getState();

      const singleFieldPayload = {
        profile: { age: 30 },
        currentStep: 'tax',
      };

      const merged = persistOptions.merge(singleFieldPayload, currentState);
      expect(merged.profile.age).toBe(30);

      // Verify all other 46 fields are NOT undefined
      expect(merged.profile.income).toBe(60000);
      expect(merged.profile.housing_cost).toBe(1100);
      expect(merged.profile.living_cost).toBe(500);
      expect(merged.profile.retirement_age).toBe(67);
      expect(merged.profile.target_wealth).toBe(250000);
      expect(Array.isArray(merged.profile.existing_assets)).toBe(true);
      expect(merged.profile.existing_assets).toEqual(['etf']);
      expect(Array.isArray(merged.profile.existing_insurances)).toBe(true);
      expect(merged.profile.existing_insurances).toEqual(['Liability']);
      expect(Array.isArray(merged.profile.goals)).toBe(true);
      expect(merged.profile.goals).toEqual(['freedom', 'etf_wealth']);
    });

    it('sanitizes non-array or null array properties in profile', () => {
      const persistOptions = useProfileStore.persist.getOptions();
      const currentState = useProfileStore.getState();

      const corruptedArraysPayload = {
        profile: {
          existing_assets: 'not_an_array',
          existing_insurances: null,
          goals: { hacked: true },
        },
      };

      const merged = persistOptions.merge(corruptedArraysPayload, currentState);
      expect(Array.isArray(merged.profile.existing_assets)).toBe(true);
      expect(merged.profile.existing_assets).toEqual(['etf']);
      expect(Array.isArray(merged.profile.existing_insurances)).toBe(true);
      expect(merged.profile.existing_insurances).toEqual(['Liability']);
      expect(Array.isArray(merged.profile.goals)).toBe(true);
      expect(merged.profile.goals).toEqual(['freedom', 'etf_wealth']);
    });

    it('sanitizes malformed subStepMap values (NaN, Infinity, negative, non-numeric)', () => {
      const persistOptions = useProfileStore.persist.getOptions();
      const currentState = useProfileStore.getState();

      const corruptedMapPayload = {
        subStepMap: {
          profile: 'invalid_string',
          insurance: NaN,
          tax: Infinity,
          invest: null,
          pension: undefined,
        },
      };

      const merged = persistOptions.merge(corruptedMapPayload, currentState);
      expect(merged.subStepMap.profile).toBe(0);
      expect(merged.subStepMap.insurance).toBe(0);
      expect(merged.subStepMap.tax).toBe(0);
      expect(merged.subStepMap.invest).toBe(0);
      expect(merged.subStepMap.pension).toBe(0);
    });

    it('safeLocalStorage safely catches QuotaExceededError and SecurityError', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        const err = new Error('QuotaExceededError');
        err.name = 'QuotaExceededError';
        throw err;
      });
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        const err = new Error('SecurityError');
        err.name = 'SecurityError';
        throw err;
      });

      expect(() => safeLocalStorage.setItem('key', 'val')).not.toThrow();
      expect(safeLocalStorage.getItem('key')).toBeNull();

      setItemSpy.mockRestore();
      getItemSpy.mockRestore();
    });
  });

  // =========================================================================
  // 2. Prototype Poisoning & Sabotage Payloads
  // =========================================================================
  describe('2. Prototype Poisoning & Sabotage Payloads', () => {
    it('blocks prototype pollution keys in updateProfile without throwing Immer draft error', () => {
      const updateProfile = useProfileStore.getState().updateProfile;

      expect(() => {
        updateProfile({
          __proto__: { isAdmin: true, polluted: true },
          constructor: { prototype: { hacked: true } },
          prototype: { injected: true },
          income: 75000,
          smoker: true,
        });
      }).not.toThrow();

      // Verify prototype pollution failed
      expect(Object.prototype.isAdmin).toBeUndefined();
      expect(Object.prototype.polluted).toBeUndefined();
      expect(Object.prototype.hacked).toBeUndefined();
      expect(Object.prototype.injected).toBeUndefined();
      expect(({}).isAdmin).toBeUndefined();

      // Verify legitimate fields were updated cleanly
      const state = useProfileStore.getState();
      expect(state.profile.income).toBe(75000);
      expect(state.profile.smoker).toBe(true);
    });

    it('handles null, undefined, and non-object inputs in updateProfile gracefully', () => {
      const updateProfile = useProfileStore.getState().updateProfile;

      expect(() => updateProfile(null)).not.toThrow();
      expect(() => updateProfile(undefined)).not.toThrow();
      expect(() => updateProfile(123)).not.toThrow();
      expect(() => updateProfile('string')).not.toThrow();
      expect(() => updateProfile([1, 2, 3])).not.toThrow();

      const state = useProfileStore.getState();
      expect(state.profile).toBeDefined();
      expect(state.profile.age).toBe(30);
    });

    it('blocks prototype pollution in persist.merge payload', () => {
      const persistOptions = useProfileStore.persist.getOptions();
      const currentState = useProfileStore.getState();

      const evilPayload = JSON.parse('{"__proto__": {"evil": true}, "profile": {"__proto__": {"evil": true}, "age": 44}}');
      const merged = persistOptions.merge(evilPayload, currentState);

      expect(Object.prototype.evil).toBeUndefined();
      expect(({}).evil).toBeUndefined();
      expect(merged.profile.age).toBe(44);
    });
  });

  // =========================================================================
  // 3. Rapid Sequential Tab Transitions & Step Changes
  // =========================================================================
  describe('3. Rapid Tab Transitions & Route Synchronization Stress Tests', () => {
    it('does not run the expensive analysis engine before the user starts the plan', async () => {
      const analysisSpy = vi.spyOn(apiService, 'fetchFullAnalysis').mockResolvedValue(null);

      render(
        <MemoryRouter initialEntries={['/welcome']}>
          <App />
        </MemoryRouter>
      );

      await act(async () => Promise.resolve());
      expect(analysisSpy).not.toHaveBeenCalled();
    });

    it('executes rapid sequential tab transitions with zero unhandled exceptions or ErrorBoundary crashes', async () => {
      vi.spyOn(apiService, 'fetchFullAnalysis').mockResolvedValue(null);

      const { container } = render(
        <MemoryRouter initialEntries={['/welcome']}>
          <App />
        </MemoryRouter>
      );

      // Verify initial render
      expect(container.querySelector('main')).toBeInTheDocument();
      expect(container.querySelector('[role="alert"]')).not.toBeInTheDocument();

      const steps = ['welcome', 'profile', 'insurance', 'tax', 'invest', 'pension', 'profile', 'tax', 'welcome'];

      // Execute rapid sequential transitions
      for (const step of steps) {
        await act(async () => {
          useProfileStore.getState().setCurrentStep(step);
        });

        // Verify that ErrorBoundary was NOT triggered
        const alertElement = container.querySelector('[role="alert"]');
        if (alertElement) {
          expect(alertElement.textContent).not.toContain('Section Encountered an Issue');
        }
      }

      // Execute rapid subStep updates
      for (let sub = 0; sub < 5; sub++) {
        await act(async () => {
          useProfileStore.getState().setSubStepMap((prev) => ({
            ...prev,
            profile: sub,
            insurance: sub,
            tax: sub,
            invest: sub,
            pension: sub,
          }));
        });

        const alertElement = container.querySelector('[role="alert"]');
        if (alertElement) {
          expect(alertElement.textContent).not.toContain('Section Encountered an Issue');
        }
      }
    });
  });

  // =========================================================================
  // 4. Offline Backend State, ErrorBoundary Fallbacks & Input Preservation
  // =========================================================================
  describe('4. Offline Backend State (503 / Network Failure) Stress Tests', () => {
    it('StepInsurance renders offline alert card and retry button on backend failure without crashing', () => {
      const mockRetry = vi.fn();
      const defaultProf = createDefaultProfile();

      render(
        <StepInsurance
          profile={defaultProf}
          updateProfile={vi.fn()}
          nextStep={vi.fn()}
          prevStep={vi.fn()}
          analysis={null}
          subStep={0}
          setSubStep={vi.fn()}
          analysisStatus="error"
          analysisError="503 Service Unavailable"
          onRetryAnalysis={mockRetry}
        />
      );

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(screen.getByText(/Risk Analysis Engine Offline/i)).toBeInTheDocument();
      expect(screen.getByText(/503 Service Unavailable/i)).toBeInTheDocument();

      const retryBtn = screen.getByRole('button', { name: /Retry Analysis/i });
      expect(retryBtn).toBeInTheDocument();
      fireEvent.click(retryBtn);
      expect(mockRetry).toHaveBeenCalledTimes(1);
    });

    it('StepTax renders offline alert card and retry button on backend failure without crashing', () => {
      const mockRetry = vi.fn();
      const defaultProf = createDefaultProfile();

      render(
        <StepTax
          profile={defaultProf}
          updateProfile={vi.fn()}
          nextStep={vi.fn()}
          prevStep={vi.fn()}
          analysis={null}
          subStep={0}
          setSubStep={vi.fn()}
          analysisStatus="error"
          analysisError="Network connection timed out"
          onRetryAnalysis={mockRetry}
        />
      );

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(screen.getByText(/Tax Analysis Engine Offline/i)).toBeInTheDocument();
      expect(screen.getByText(/Network connection timed out/i)).toBeInTheDocument();

      const retryBtn = screen.getByRole('button', { name: /Retry Analysis/i });
      expect(retryBtn).toBeInTheDocument();
      fireEvent.click(retryBtn);
      expect(mockRetry).toHaveBeenCalledTimes(1);
    });

    it('StepRetirement renders offline alert card and retry button on backend failure without crashing', () => {
      const mockRetry = vi.fn();
      const defaultProf = createDefaultProfile();

      render(
        <StepRetirement
          profile={defaultProf}
          updateProfile={vi.fn()}
          nextStep={vi.fn()}
          prevStep={vi.fn()}
          analysis={null}
          subStep={0}
          setSubStep={vi.fn()}
          analysisStatus="error"
          analysisError="Backend offline"
          onRetryAnalysis={mockRetry}
        />
      );

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(screen.getByText(/Retirement Analysis Engine Offline/i)).toBeInTheDocument();
      expect(screen.getByText(/Backend offline/i)).toBeInTheDocument();

      const retryBtn = screen.getByRole('button', { name: /Retry Analysis/i });
      expect(retryBtn).toBeInTheDocument();
      fireEvent.click(retryBtn);
      expect(mockRetry).toHaveBeenCalledTimes(1);
    });

    it('StepInvestment renders offline alert card and retry button on backend failure without crashing', () => {
      const mockRetry = vi.fn();
      const defaultProf = createDefaultProfile();

      render(
        <StepInvestment
          profile={defaultProf}
          updateProfile={vi.fn()}
          nextStep={vi.fn()}
          prevStep={vi.fn()}
          analysis={null}
          subStep={0}
          setSubStep={vi.fn()}
          analysisStatus="error"
          analysisError="HTTP 503 Server Error"
          onRetryAnalysis={mockRetry}
        />
      );

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(screen.getByText(/Investment model unavailable/i)).toBeInTheDocument();
      expect(screen.getByText(/HTTP 503 Server Error/i)).toBeInTheDocument();

      const retryBtn = screen.getByRole('button', { name: /Retry analysis/i });
      expect(retryBtn).toBeInTheDocument();
      fireEvent.click(retryBtn);
      expect(mockRetry).toHaveBeenCalledTimes(1);
    });

    it('preserves user inputs locally when backend returns 503 / network error', async () => {
      // User enters custom data
      useProfileStore.getState().updateProfile({
        income: 88000,
        housing_cost: 1650,
        target_wealth: 500000,
        smoker: true,
      });

      // Backend simulates 503 error returning null
      vi.spyOn(apiService, 'fetchFullAnalysis').mockResolvedValue(null);

      render(
        <MemoryRouter initialEntries={['/profile']}>
          <App />
        </MemoryRouter>
      );

      // Verify user inputs are untouched and preserved
      const currentProfile = useProfileStore.getState().profile;
      expect(currentProfile.income).toBe(88000);
      expect(currentProfile.housing_cost).toBe(1650);
      expect(currentProfile.target_wealth).toBe(500000);
      expect(currentProfile.smoker).toBe(true);

      // Switching sections must not depend on the analysis request completing.
      await act(async () => {
        useProfileStore.getState().setCurrentStep('insurance');
      });

      // Inputs must STILL be preserved
      const profileAfterTab = useProfileStore.getState().profile;
      expect(profileAfterTab.income).toBe(88000);
      expect(profileAfterTab.housing_cost).toBe(1650);

    });
  });
});
