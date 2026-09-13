import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

export const createDefaultProfile = () => ({
  age: 30, is_married: false, has_dependents: false, num_children: 0, children_under_25: 0,
  is_saxony: false, joint_assessment: true, spouse_income: 0, church_tax: false, tax_class: 1,
  income: 60000, secondary_income: 0, additional_deductions: 0, riester_contribution: 0,
  has_private_health: false, private_health_cost: 0, employment_stability: 'stable',
  occupation_risk: 'medium', smoker: false, housing_cost: 1100, living_cost: 500,
  mobility_cost: 200, leisure_cost: 300, subscriptions_cost: 80, travel_cost: 150,
  commute_km: 0, home_office_days: 0, initial_amount: 5000, monthly_investment: 500,
  investment_years: 20, risk_profile: 'medium', investment_strategy: 'balanced_60_40',
  target_wealth: 250000, management_fee: 0.0015, equity_fund_share: 1, annual_capital_gains: 0,
  existing_assets: ['etf'], has_property: false, has_car: false, property_price: 350000,
  property_down_payment: 70000, mortgage_rate: 0.04, mortgage_amortization: 0.02,
  gross_rental_yield: 0.035, property_appreciation: 0.02, expected_inflation: 0.02,
  expected_pension_growth: 0.015, bav_contribution: 0, bav_employer_subsidy_rate: 0.15,
  bav_expected_return: 0.04, bav_retirement_deduction_rate: 0.20, retirement_age: 67,
  longevity_age: 95, years_worked: 5, current_entgeltpunkte: null, target_pension_ratio: 0.8,
  retirement_health_care_rate: null, retirement_tax_rate: 0.08, safe_withdrawal_rate: 0.035,
  existing_insurances: ['Liability'], bu_monthly_benefit: 0, living_space_sqm: 70,
  mortgage_balance: null, youngest_dependent_age: 8, liquid_savings: 5000, unsecured_debt: 0,
  unsecured_debt_rate: 0.08, monthly_debt_payment: 0, debt_payoff_years: 5,
  goals: ['freedom', 'etf_wealth'],
});

export const safeLocalStorage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // quota or private browsing exceptions
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};

export const useProfileStore = create(
  persist(
    immer((set) => ({
      profile: createDefaultProfile(),
      analysis: null,
      currentStep: 'welcome',
      subStepMap: { profile: 0, insurance: 0, tax: 0, invest: 0, pension: 0 },
      isAdvisorDrawerOpen: false,
      initialChatMessage: '',
      setPersonal: (data) => set((state) => {
        if (!state.profile) state.profile = createDefaultProfile();
        Object.assign(state.profile, data);
      }),
      setIncome: (data) => set((state) => {
        if (!state.profile) state.profile = createDefaultProfile();
        Object.assign(state.profile, data);
      }),
      setExpenses: (data) => set((state) => {
        if (!state.profile) state.profile = createDefaultProfile();
        Object.assign(state.profile, data);
      }),
      setAssets: (data) => set((state) => {
        if (!state.profile) state.profile = createDefaultProfile();
        Object.assign(state.profile, data);
      }),
      setRetirement: (data) => set((state) => {
        if (!state.profile) state.profile = createDefaultProfile();
        Object.assign(state.profile, data);
      }),
      setInsurance: (data) => set((state) => {
        if (!state.profile) state.profile = createDefaultProfile();
        Object.assign(state.profile, data);
      }),
      setDebt: (data) => set((state) => {
        if (!state.profile) state.profile = createDefaultProfile();
        Object.assign(state.profile, data);
      }),
      setGoals: (data) => set((state) => {
        if (!state.profile) state.profile = createDefaultProfile();
        Object.assign(state.profile, data);
      }),
      setField: (key, value) => set((state) => {
        if (!state.profile) state.profile = createDefaultProfile();
        state.profile[key] = value;
      }),
      updateProfile: (data) => set((state) => {
        if (!state.profile) state.profile = createDefaultProfile();
        if (data && typeof data === 'object') {
          for (const key of Object.keys(data)) {
            if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
            state.profile[key] = data[key];
          }
        }
      }),
      resetProfile: () => set((state) => { state.profile = createDefaultProfile(); }),
      resetAll: () => set((state) => {
        state.profile = createDefaultProfile();
        state.analysis = null;
        state.currentStep = 'welcome';
        state.subStepMap = { profile: 0, insurance: 0, tax: 0, invest: 0, pension: 0 };
        state.isAdvisorDrawerOpen = false;
        state.initialChatMessage = '';
      }),
      getProfile: () => createDefaultProfile(),
      setAnalysis: (data) => set({ analysis: data }),
      setCurrentStep: (step) => set({ currentStep: step }),
      setSubStepMap: (updater) => set((state) => ({ subStepMap: typeof updater === 'function' ? updater(state.subStepMap) : updater })),
      setIsAdvisorDrawerOpen: (open) => set({ isAdvisorDrawerOpen: open }),
      setInitialChatMessage: (msg) => set({ initialChatMessage: msg }),
    })),
    {
      name: 'financial-consultant-profile',
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state) => ({
        profile: state.profile,
        currentStep: state.currentStep,
        subStepMap: state.subStepMap,
        analysis: state.analysis,
      }),
      merge: (persistedState, currentState) => {
        const defaults = createDefaultProfile();
        const incoming = (persistedState && typeof persistedState === 'object') ? persistedState : {};
        const incomingProfile = (incoming.profile && typeof incoming.profile === 'object') ? incoming.profile : {};
        const sanitizedProfile = { ...defaults, ...incomingProfile };

        sanitizedProfile.existing_assets = Array.isArray(sanitizedProfile.existing_assets)
          ? [...sanitizedProfile.existing_assets]
          : [...defaults.existing_assets];
        sanitizedProfile.existing_insurances = Array.isArray(sanitizedProfile.existing_insurances)
          ? [...sanitizedProfile.existing_insurances]
          : [...defaults.existing_insurances];
        sanitizedProfile.goals = Array.isArray(sanitizedProfile.goals)
          ? [...sanitizedProfile.goals]
          : [...defaults.goals];

        const defaultSubStepMap = { profile: 0, insurance: 0, tax: 0, invest: 0, pension: 0 };
        const incomingSubStepMap = (incoming.subStepMap && typeof incoming.subStepMap === 'object') ? incoming.subStepMap : {};
        const sanitizedSubStepMap = { ...defaultSubStepMap, ...incomingSubStepMap };
        for (const key of Object.keys(defaultSubStepMap)) {
          if (typeof sanitizedSubStepMap[key] !== 'number' || !Number.isFinite(sanitizedSubStepMap[key])) {
            sanitizedSubStepMap[key] = 0;
          }
        }

        return {
          ...currentState,
          ...incoming,
          profile: sanitizedProfile,
          subStepMap: sanitizedSubStepMap,
          analysis: incoming.analysis ?? currentState.analysis ?? null,
          currentStep: typeof incoming.currentStep === 'string' ? incoming.currentStep : 'welcome',
        };
      },
    }
  )
);

export const usePersonal = () => useProfileStore(useShallow((s) => ({
  age: s.profile?.age ?? 30,
  is_married: s.profile?.is_married ?? false,
  has_dependents: s.profile?.has_dependents ?? false,
  num_children: s.profile?.num_children ?? 0,
  children_under_25: s.profile?.children_under_25 ?? 0,
  is_saxony: s.profile?.is_saxony ?? false,
  joint_assessment: s.profile?.joint_assessment ?? true,
  spouse_income: s.profile?.spouse_income ?? 0,
  church_tax: s.profile?.church_tax ?? false,
  tax_class: s.profile?.tax_class ?? 1,
  setPersonal: s.setPersonal
})));

export const useIncome = () => useProfileStore(useShallow((s) => ({
  income: s.profile?.income ?? 60000,
  secondary_income: s.profile?.secondary_income ?? 0,
  additional_deductions: s.profile?.additional_deductions ?? 0,
  riester_contribution: s.profile?.riester_contribution ?? 0,
  has_private_health: s.profile?.has_private_health ?? false,
  private_health_cost: s.profile?.private_health_cost ?? 0,
  employment_stability: s.profile?.employment_stability ?? 'stable',
  occupation_risk: s.profile?.occupation_risk ?? 'medium',
  smoker: s.profile?.smoker ?? false,
  setIncome: s.setIncome
})));

export const useExpenses = () => useProfileStore(useShallow((s) => ({
  housing_cost: s.profile?.housing_cost ?? 1100,
  living_cost: s.profile?.living_cost ?? 500,
  mobility_cost: s.profile?.mobility_cost ?? 200,
  leisure_cost: s.profile?.leisure_cost ?? 300,
  subscriptions_cost: s.profile?.subscriptions_cost ?? 80,
  travel_cost: s.profile?.travel_cost ?? 150,
  commute_km: s.profile?.commute_km ?? 0,
  home_office_days: s.profile?.home_office_days ?? 0,
  setExpenses: s.setExpenses
})));

export const useAssets = () => useProfileStore(useShallow((s) => ({
  initial_amount: s.profile?.initial_amount ?? 5000,
  monthly_investment: s.profile?.monthly_investment ?? 500,
  investment_years: s.profile?.investment_years ?? 20,
  risk_profile: s.profile?.risk_profile ?? 'medium',
  investment_strategy: s.profile?.investment_strategy ?? 'balanced_60_40',
  target_wealth: s.profile?.target_wealth ?? 250000,
  management_fee: s.profile?.management_fee ?? 0.0015,
  equity_fund_share: s.profile?.equity_fund_share ?? 1,
  annual_capital_gains: s.profile?.annual_capital_gains ?? 0,
  existing_assets: s.profile?.existing_assets ?? ['etf'],
  has_property: s.profile?.has_property ?? false,
  has_car: s.profile?.has_car ?? false,
  property_price: s.profile?.property_price ?? 350000,
  property_down_payment: s.profile?.property_down_payment ?? 70000,
  mortgage_rate: s.profile?.mortgage_rate ?? 0.04,
  mortgage_amortization: s.profile?.mortgage_amortization ?? 0.02,
  gross_rental_yield: s.profile?.gross_rental_yield ?? 0.035,
  property_appreciation: s.profile?.property_appreciation ?? 0.02,
  expected_inflation: s.profile?.expected_inflation ?? 0.02,
  expected_pension_growth: s.profile?.expected_pension_growth ?? 0.015,
  bav_contribution: s.profile?.bav_contribution ?? 0,
  bav_employer_subsidy_rate: s.profile?.bav_employer_subsidy_rate ?? 0.15,
  bav_expected_return: s.profile?.bav_expected_return ?? 0.04,
  bav_retirement_deduction_rate: s.profile?.bav_retirement_deduction_rate ?? 0.20,
  setAssets: s.setAssets
})));

export const useRetirement = () => useProfileStore(useShallow((s) => ({
  retirement_age: s.profile?.retirement_age ?? 67,
  longevity_age: s.profile?.longevity_age ?? 95,
  years_worked: s.profile?.years_worked ?? 5,
  current_entgeltpunkte: s.profile?.current_entgeltpunkte ?? null,
  target_pension_ratio: s.profile?.target_pension_ratio ?? 0.8,
  retirement_health_care_rate: s.profile?.retirement_health_care_rate ?? null,
  retirement_tax_rate: s.profile?.retirement_tax_rate ?? 0.08,
  safe_withdrawal_rate: s.profile?.safe_withdrawal_rate ?? 0.035,
  expected_inflation: s.profile?.expected_inflation ?? 0.02,
  expected_pension_growth: s.profile?.expected_pension_growth ?? 0.015,
  setRetirement: s.setRetirement
})));

export const useInsurance = () => useProfileStore(useShallow((s) => ({
  existing_insurances: s.profile?.existing_insurances ?? ['Liability'],
  bu_monthly_benefit: s.profile?.bu_monthly_benefit ?? 0,
  occupation_risk: s.profile?.occupation_risk ?? 'medium',
  employment_stability: s.profile?.employment_stability ?? 'stable',
  smoker: s.profile?.smoker ?? false,
  living_space_sqm: s.profile?.living_space_sqm ?? 70,
  mortgage_balance: s.profile?.mortgage_balance ?? null,
  youngest_dependent_age: s.profile?.youngest_dependent_age ?? 8,
  setInsurance: s.setInsurance
})));

export const useDebt = () => useProfileStore(useShallow((s) => ({
  liquid_savings: s.profile?.liquid_savings ?? 5000,
  unsecured_debt: s.profile?.unsecured_debt ?? 0,
  unsecured_debt_rate: s.profile?.unsecured_debt_rate ?? 0.08,
  monthly_debt_payment: s.profile?.monthly_debt_payment ?? 0,
  debt_payoff_years: s.profile?.debt_payoff_years ?? 5,
  bu_monthly_benefit: s.profile?.bu_monthly_benefit ?? 0,
  setDebt: s.setDebt
})));

export const useGoals = () => useProfileStore(useShallow((s) => ({
  goals: s.profile?.goals ?? ['freedom', 'etf_wealth'],
  setGoals: s.setGoals
})));

export const useFullProfile = () => useProfileStore(useShallow((s) => ({
  profile: s.profile,
  analysis: s.analysis,
  currentStep: s.currentStep,
  subStepMap: s.subStepMap,
  isAdvisorDrawerOpen: s.isAdvisorDrawerOpen,
  initialChatMessage: s.initialChatMessage,
  updateProfile: s.updateProfile,
  resetProfile: s.resetProfile,
  resetAll: s.resetAll,
  setAnalysis: s.setAnalysis,
  setCurrentStep: s.setCurrentStep,
  setSubStepMap: s.setSubStepMap,
  setIsAdvisorDrawerOpen: s.setIsAdvisorDrawerOpen,
  setInitialChatMessage: s.setInitialChatMessage
})));
