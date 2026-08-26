import { describe, it, expect } from 'vitest';

describe('TopNav constants', () => {
  const SECTION_SUBSTEPS = {
    profile: [
      'Goals',
      'Timeline',
      'Cash Flow Details',
      'AI Cash Flow Verdict',
      'Holdings',
      'Health Audit'
    ],
    insurance: [
      'Risk Map',
      'Income Protection',
      'Healthcare Decision',
      'Property & Liability',
      'Stress Testing',
      'Protection Policy'
    ],
    tax: [
      'Readiness',
      'Liability Bridge',
      'Deduction Scenarios',
      'Household & Vorsorge',
      'Investment Tax',
      'Tax Memo'
    ],
    invest: [
      'Quantitative Investment Lab'
    ],
    pension: [
      'Retirement Mandate',
      'Three Pillars',
      'DRV Record',
      'Retirement Timing',
      'Withdrawal Lab',
      'Funding Policy'
    ]
  };

  const steps = [
    { id: 'welcome', label: 'Portal' },
    { id: 'profile', label: 'Mandate & Cashflow' },
    { id: 'insurance', label: 'Risk Shield' },
    { id: 'tax', label: 'Tax Optimization' },
    { id: 'invest', label: 'Asset Allocation' },
    { id: 'pension', label: 'Solvency' },
  ];

  const stepProgress = {
    welcome: 0,
    profile: 33,
    insurance: 50,
    tax: 66,
    invest: 83,
    pension: 100
  };

  describe('SECTION_SUBSTEPS', () => {
    it('has substeps for all main steps except welcome', () => {
      expect(SECTION_SUBSTEPS.profile).toHaveLength(6);
      expect(SECTION_SUBSTEPS.insurance).toHaveLength(6);
      expect(SECTION_SUBSTEPS.tax).toHaveLength(6);
      expect(SECTION_SUBSTEPS.invest).toHaveLength(1);
      expect(SECTION_SUBSTEPS.pension).toHaveLength(6);
      expect(SECTION_SUBSTEPS.welcome).toBeUndefined();
    });
  });

  describe('steps', () => {
    it('has 6 steps', () => {
      expect(steps).toHaveLength(6);
    });

    it('each step has id and label', () => {
      steps.forEach(step => {
        expect(step).toHaveProperty('id');
        expect(step).toHaveProperty('label');
        expect(typeof step.id).toBe('string');
        expect(typeof step.label).toBe('string');
      });
    });

    it('has correct step IDs', () => {
      const ids = steps.map(s => s.id);
      expect(ids).toEqual(['welcome', 'profile', 'insurance', 'tax', 'invest', 'pension']);
    });
  });

  describe('stepProgress', () => {
    it('has progress for all steps', () => {
      expect(stepProgress.welcome).toBe(0);
      expect(stepProgress.profile).toBe(33);
      expect(stepProgress.insurance).toBe(50);
      expect(stepProgress.tax).toBe(66);
      expect(stepProgress.invest).toBe(83);
      expect(stepProgress.pension).toBe(100);
    });

    it('progress increases monotonically', () => {
      const values = Object.values(stepProgress);
      for (let i = 1; i < values.length; i++) {
        expect(values[i]).toBeGreaterThan(values[i - 1]);
      }
    });
  });
});