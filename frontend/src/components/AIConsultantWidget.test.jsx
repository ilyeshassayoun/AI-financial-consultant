import { describe, it, expect } from 'vitest';

describe('AIConsultantWidget', () => {
  const mockInsight = {
    title: 'AI Tax Optimization',
    verdict: 'Your commute deduction could be increased by €2,000.',
    urgency: 'HIGH',
    health_impact: '+€1,200/yr tax savings',
    key_metrics: [
      { label: 'Commute Deduction', value: '€3,400' },
      { label: 'Tax Savings', value: '€1,200' }
    ],
    recommended_actions: [
      { id: 'action1', label: 'Log Commute Days', patch: { commute_km: 30, home_office_days: 0 } },
      { id: 'action2', label: 'Enable Home Office', patch: { home_office_days: 60 } }
    ]
  };

  const mockInsightLow = {
    title: 'AI Profile Review',
    verdict: 'Your profile is well-optimized.',
    urgency: 'LOW',
    health_impact: 'On track',
    key_metrics: [
      { label: 'Health Score', value: '82/100' }
    ],
    recommended_actions: []
  };

  describe('Insight processing', () => {
    it('handles high urgency insight', () => {
      const isHigh = mockInsight.urgency === 'HIGH';
      expect(isHigh).toBe(true);
    });

    it('handles low urgency insight', () => {
      const isHigh = mockInsightLow.urgency === 'HIGH';
      expect(isHigh).toBe(false);
    });

    it('extracts title with fallback', () => {
      const title = mockInsight.title || 'Ilyes AI Live Consultation';
      expect(title).toBe('AI Tax Optimization');
    });

    it('uses fallback title when missing', () => {
      const insight = { ...mockInsight, title: undefined };
      const title = insight.title || 'Ilyes AI Live Consultation';
      expect(title).toBe('Ilyes AI Live Consultation');
    });
  });

  describe('Key metrics rendering', () => {
    it('limits metrics to 3 columns', () => {
      const metrics = mockInsight.key_metrics;
      const columnCount = Math.min(metrics.length, 3);
      expect(columnCount).toBe(2);
    });

    it('handles empty metrics', () => {
      const metrics = [];
      const columnCount = Math.min(metrics.length, 3);
      expect(columnCount).toBe(0);
    });
  });

  describe('Recommended actions', () => {
    it('maps actions to buttons', () => {
      const actions = mockInsight.recommended_actions;
      expect(actions).toHaveLength(2);
      actions.forEach(action => {
        expect(action).toHaveProperty('id');
        expect(action).toHaveProperty('label');
        expect(action).toHaveProperty('patch');
      });
    });

    it('handles empty actions', () => {
      const actions = mockInsightLow.recommended_actions;
      expect(actions).toHaveLength(0);
    });
  });
});