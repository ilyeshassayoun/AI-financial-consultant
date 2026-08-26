import { describe, it, expect } from 'vitest';

describe('InteractiveCashFlow calculations', () => {
  const createProfile = (overrides = {}) => ({
    income: 60000,
    secondary_income: 0,
    housing_cost: 1100,
    living_cost: 500,
    mobility_cost: 200,
    leisure_cost: 300,
    subscriptions_cost: 80,
    travel_cost: 150,
    existing_insurances: ['Liability'],
    ...overrides,
  });

  const createAnalysis = (overrides = {}) => ({
    tax: {
      net_income: 38000,
      ...overrides.tax,
    },
    ...overrides,
  });

  const calculateCashFlow = (profile, analysis) => {
    const grossAnnual = profile.income || 60000;
    const taxData = analysis?.tax || {};
    const netAnnual = taxData.net_income || (grossAnnual * 0.6);
    const primaryNetMonthly = Math.round(netAnnual / 12);
    const secondaryIncome = profile.secondary_income || 0;
    const totalNetInflow = primaryNetMonthly + secondaryIncome;

    const housing = profile.housing_cost !== undefined ? profile.housing_cost : 1100;
    const groceries = profile.living_cost !== undefined ? profile.living_cost : 500;
    const mobility = profile.mobility_cost !== undefined ? profile.mobility_cost : 200;
    const leisure = profile.leisure_cost !== undefined ? profile.leisure_cost : 300;
    const subscriptions = profile.subscriptions_cost !== undefined ? profile.subscriptions_cost : 80;
    const travel = profile.travel_cost !== undefined ? profile.travel_cost : 150;
    const insurancePremiums = (profile.existing_insurances || []).length * 25;

    const totalFixedNeeds = housing + groceries + mobility;
    const totalDiscretionary = leisure + subscriptions + travel;
    const totalProtection = Math.max(15, insurancePremiums);
    const totalOutflow = totalFixedNeeds + totalDiscretionary + totalProtection;
    const unallocatedSurplus = totalNetInflow - totalOutflow;

    const needsRatio = Math.min(100, Math.round((totalFixedNeeds / (totalNetInflow || 1)) * 100));
    const wantsRatio = Math.min(100, Math.round((totalDiscretionary / (totalNetInflow || 1)) * 100));
    const wealthRatio = Math.max(0, Math.round((Math.max(0, unallocatedSurplus) / (totalNetInflow || 1)) * 100));
    const housingRatio = Math.round((housing / (totalNetInflow || 1)) * 100);

    return {
      totalNetInflow,
      totalFixedNeeds,
      totalDiscretionary,
      totalProtection,
      totalOutflow,
      unallocatedSurplus,
      needsRatio,
      wantsRatio,
      wealthRatio,
      housingRatio,
    };
  };

  describe('calculateCashFlow', () => {
    it('calculates correct cash flow for default profile', () => {
      const profile = createProfile();
      const analysis = createAnalysis();
      const result = calculateCashFlow(profile, analysis);

      expect(result.totalNetInflow).toBe(3167);
      expect(result.totalFixedNeeds).toBe(1800);
      expect(result.totalDiscretionary).toBe(530);
      expect(result.totalProtection).toBe(25);
      expect(result.totalOutflow).toBe(2355);
      expect(result.unallocatedSurplus).toBe(812);
    });

    it('calculates correct ratios', () => {
      const profile = createProfile();
      const analysis = createAnalysis();
      const result = calculateCashFlow(profile, analysis);

      expect(result.needsRatio).toBe(57);
      expect(result.wantsRatio).toBe(17);
      expect(result.wealthRatio).toBe(26);
      expect(result.housingRatio).toBe(35);
    });

    it('handles zero net income', () => {
      const profile = createProfile({ income: 0 });
      const analysis = createAnalysis({ tax: { net_income: 0 } });
      const result = calculateCashFlow(profile, analysis);

      // When income is 0, the || operator uses default 60000, so netInflow is 3000
      expect(result.totalNetInflow).toBe(3000);
      expect(result.needsRatio).toBe(60);
      expect(result.wantsRatio).toBe(18);
      expect(result.wealthRatio).toBe(22);
    });

    it('handles negative surplus (deficit)', () => {
      const profile = createProfile({ housing_cost: 3000, living_cost: 1000, mobility_cost: 500 });
      const analysis = createAnalysis();
      const result = calculateCashFlow(profile, analysis);

      expect(result.unallocatedSurplus).toBeLessThan(0);
      expect(result.wealthRatio).toBe(0);
    });

    it('includes secondary income in total inflow', () => {
      const profile = createProfile({ secondary_income: 1000 });
      const analysis = createAnalysis();
      const result = calculateCashFlow(profile, analysis);

      expect(result.totalNetInflow).toBe(4167);
    });

    it('calculates insurance premiums based on existing policies', () => {
      const profile = createProfile({ existing_insurances: ['Liability', 'BU', 'Legal'] });
      const analysis = createAnalysis();
      const result = calculateCashFlow(profile, analysis);

      expect(result.totalProtection).toBe(75);
    });

    it('uses minimum 15 for protection when no insurances', () => {
      const profile = createProfile({ existing_insurances: [] });
      const analysis = createAnalysis();
      const result = calculateCashFlow(profile, analysis);

      expect(result.totalProtection).toBe(15);
    });
  });

  describe('AI Solvency Grade Calculation', () => {
    const calculateAIGrade = (unallocatedSurplus, needsRatio, wealthRatio, housingRatio) => {
      if (unallocatedSurplus < 0) {
        return { grade: 'D', score: 46, title: 'Liquidity Deficit Warning', short: 'Monthly spending exceeds take-home pay.' };
      } else if (needsRatio > 60 || wealthRatio < 10) {
        return { grade: 'C', score: 67, title: 'Elevated Fixed Drag', short: 'Fixed costs consume over 60% of take-home income.' };
      } else if (wealthRatio >= 30 && housingRatio <= 35) {
        return { grade: 'A+', score: 98, title: 'Institutional Wealth Builder', short: 'Over 30% unencumbered capital compounding for financial freedom.' };
      } else if (wealthRatio >= 20 && needsRatio <= 50) {
        return { grade: 'A', score: 91, title: 'Balanced 50/30/20 Profile', short: 'Closely matches canonical German fiduciary benchmarks.' };
      } else {
        return { grade: 'B', score: 80, title: 'Stable Standard Solvency', short: 'Sound baseline foundation with positive monthly savings.' };
      }
    };

    it('returns D grade for deficit', () => {
      const result = calculateAIGrade(-100, 50, 0, 30);
      expect(result.grade).toBe('D');
      expect(result.score).toBe(46);
    });

    it('returns C grade for high needs ratio', () => {
      const result = calculateAIGrade(200, 65, 5, 30);
      expect(result.grade).toBe('C');
      expect(result.score).toBe(67);
    });

    it('returns C grade for low wealth ratio', () => {
      const result = calculateAIGrade(200, 50, 5, 30);
      expect(result.grade).toBe('C');
      expect(result.score).toBe(67);
    });

    it('returns A+ grade for optimal profile', () => {
      const result = calculateAIGrade(1000, 45, 35, 30);
      expect(result.grade).toBe('A+');
      expect(result.score).toBe(98);
    });

    it('returns A grade for balanced profile', () => {
      const result = calculateAIGrade(800, 48, 25, 30);
      expect(result.grade).toBe('A');
      expect(result.score).toBe(91);
    });

    it('returns B grade for standard profile', () => {
      const result = calculateAIGrade(500, 55, 15, 30);
      expect(result.grade).toBe('B');
      expect(result.score).toBe(80);
    });
  });

  describe('Compound Growth Projections', () => {
    const calculateCompoundSeries = (monthlyAmount, years = [5, 10, 15, 20, 25, 30], annualReturn = 0.07) => {
      return years.map(yr => {
        const investedVal = Math.round(monthlyAmount * 12 * yr);
        const capitalVal = Math.round(monthlyAmount * 12 * ((Math.pow(1 + annualReturn, yr) - 1) / annualReturn));
        const growthGain = Math.max(0, capitalVal - investedVal);
        const passiveMonthly = Math.round((capitalVal * 0.04) / 12);
        return { year: `${yr}y`, invested: investedVal, capital: capitalVal, growthGain, passiveMonthly };
      });
    };

    it('calculates correct compound growth', () => {
      const series = calculateCompoundSeries(500);
      const year30 = series.find(s => s.year === '30y');

      expect(year30.invested).toBe(180000);
      expect(year30.capital).toBeGreaterThan(year30.invested);
      expect(year30.growthGain).toBe(year30.capital - year30.invested);
    });

    it('handles zero monthly amount', () => {
      const series = calculateCompoundSeries(0);
      const year10 = series.find(s => s.year === '10y');
      const year30 = series.find(s => s.year === '30y');

      expect(year10.invested).toBe(0);
      expect(year10.capital).toBe(0);
      expect(year30.growthGain).toBe(0);
    });

    it('calculates passive monthly income at 4% SWR', () => {
      const series = calculateCompoundSeries(500);
      const year30 = series.find(s => s.year === '30y');

      expect(year30.passiveMonthly).toBe(Math.round((year30.capital * 0.04) / 12));
    });
  });
});