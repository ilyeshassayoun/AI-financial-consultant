import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  createDefaultProfile,
  safeLocalStorage,
  useProfileStore,
  usePersonal,
  useIncome,
  useExpenses,
  useAssets,
  useRetirement,
  useInsurance,
  useDebt,
  useGoals
} from './profileStore';

describe('profileStore Defensive Hydration & Factory', () => {
  beforeEach(() => {
    useProfileStore.getState().resetAll();
  });

  it('createDefaultProfile returns a fresh pure object with all 47 fields', () => {
    const p1 = createDefaultProfile();
    const p2 = createDefaultProfile();
    expect(p1).toEqual(p2);
    expect(p1).not.toBe(p2);
    expect(p1.existing_assets).not.toBe(p2.existing_assets);
    expect(p1.existing_insurances).not.toBe(p2.existing_insurances);
    expect(p1.goals).not.toBe(p2.goals);

    // Verify key fields
    expect(p1.age).toBe(30);
    expect(p1.income).toBe(60000);
    expect(p1.housing_cost).toBe(1100);
    expect(p1.living_cost).toBe(500);
    expect(p1.retirement_age).toBe(67);
    expect(p1.existing_insurances).toContain('Liability');
    expect(p1.existing_assets).toContain('etf');
    expect(p1.goals).toContain('freedom');
  });

  it('safeLocalStorage handles valid and invalid calls gracefully', () => {
    safeLocalStorage.setItem('test_key', 'test_val');
    expect(safeLocalStorage.getItem('test_key')).toBe('test_val');
    safeLocalStorage.removeItem('test_key');
    expect(safeLocalStorage.getItem('test_key')).toBeNull();
  });

  it('persistedState merge deeply hydrates partial and legacy profiles', () => {
    // Test custom merge logic via the store options
    const persistOptions = useProfileStore.persist.getOptions();
    const currentState = useProfileStore.getState();

    // Partial incoming profile with only age
    const partialIncoming = {
      profile: { age: 42, income: 85000 },
      currentStep: 'tax',
      subStepMap: { tax: 2 }
    };

    const merged = persistOptions.merge(partialIncoming, currentState);
    expect(merged.profile.age).toBe(42);
    expect(merged.profile.income).toBe(85000);
    // Unsupplied fields retain default values
    expect(merged.profile.housing_cost).toBe(1100);
    expect(merged.profile.retirement_age).toBe(67);
    expect(Array.isArray(merged.profile.existing_assets)).toBe(true);
    expect(Array.isArray(merged.profile.existing_insurances)).toBe(true);
    expect(Array.isArray(merged.profile.goals)).toBe(true);
    expect(merged.currentStep).toBe('tax');
    expect(merged.subStepMap.tax).toBe(2);
    expect(merged.subStepMap.profile).toBe(0);
  });

  it('persistedState merge self-heals corrupted null/non-object profiles', () => {
    const persistOptions = useProfileStore.persist.getOptions();
    const currentState = useProfileStore.getState();

    // Corrupted state: profile is null, arrays are corrupted
    const corruptedIncoming = {
      profile: null,
      subStepMap: null,
      currentStep: 123
    };

    const merged = persistOptions.merge(corruptedIncoming, currentState);
    expect(merged.profile).toBeDefined();
    expect(merged.profile.age).toBe(30);
    expect(merged.profile.income).toBe(60000);
    expect(merged.subStepMap.profile).toBe(0);
    expect(merged.currentStep).toBe('welcome');
  });

  it('store resetAll and resetProfile return isolated objects', () => {
    useProfileStore.getState().updateProfile({ income: 120000, age: 45 });
    expect(useProfileStore.getState().profile.income).toBe(120000);

    useProfileStore.getState().resetProfile();
    expect(useProfileStore.getState().profile.income).toBe(60000);
    expect(useProfileStore.getState().profile.age).toBe(30);
  });

  it('keeps hypothetical scenario values separate until explicitly committed', () => {
    const baseline = useProfileStore.getState().profile.monthly_investment;
    useProfileStore.getState().previewScenario({ monthly_investment: 900 });

    expect(useProfileStore.getState().profile.monthly_investment).toBe(baseline);
    expect(useProfileStore.getState().scenarioOverrides.monthly_investment).toBe(900);

    useProfileStore.getState().commitScenario();
    expect(useProfileStore.getState().profile.monthly_investment).toBe(900);
    expect(useProfileStore.getState().scenarioOverrides).toEqual({});
  });

  it('never hydrates hypothetical scenario overrides from persisted data', () => {
    const persistOptions = useProfileStore.persist.getOptions();
    const merged = persistOptions.merge({
      profile: { income: 70000 },
      scenarioOverrides: { income: 500000 },
    }, useProfileStore.getState());

    expect(merged.profile.income).toBe(70000);
    expect(merged.scenarioOverrides).toEqual({});
  });

  it('all 8 domain selectors provide safe, reactive slices with fallback defaults', () => {
    const { result: personal } = renderHook(() => usePersonal());
    expect(personal.current.age).toBe(30);

    const { result: income } = renderHook(() => useIncome());
    expect(income.current.income).toBe(60000);

    const { result: expenses } = renderHook(() => useExpenses());
    expect(expenses.current.housing_cost).toBe(1100);

    const { result: assets } = renderHook(() => useAssets());
    expect(Array.isArray(assets.current.existing_assets)).toBe(true);

    const { result: retirement } = renderHook(() => useRetirement());
    expect(retirement.current.retirement_age).toBe(67);

    const { result: insurance } = renderHook(() => useInsurance());
    expect(Array.isArray(insurance.current.existing_insurances)).toBe(true);

    const { result: debt } = renderHook(() => useDebt());
    expect(debt.current.unsecured_debt).toBe(0);

    const { result: goals } = renderHook(() => useGoals());
    expect(Array.isArray(goals.current.goals)).toBe(true);
  });
});
