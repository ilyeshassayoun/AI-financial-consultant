import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import StepTax from './StepTax';

Element.prototype.scrollIntoView = vi.fn();

describe('StepTax utility functions', () => {
  const money = value => new Intl.NumberFormat('de-DE', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0
  }).format(Number(value || 0));

  const percent = value => new Intl.NumberFormat('de-DE', {
    style: 'percent', maximumFractionDigits: 1
  }).format(Number(value || 0));

  describe('money formatter', () => {
    it('formats positive numbers correctly', () => {
      expect(money(1000)).toBe('1.000\u00A0€');
      expect(money(1234567)).toBe('1.234.567\u00A0€');
      expect(money(0)).toBe('0\u00A0€');
    });

    it('handles string numbers', () => {
      expect(money('50000')).toBe('50.000\u00A0€');
    });

    it('handles null/undefined', () => {
      expect(money(null)).toBe('0\u00A0€');
      expect(money(undefined)).toBe('0\u00A0€');
    });
  });

  describe('percent formatter', () => {
    it('formats decimal as percentage', () => {
      // German format with maximumFractionDigits: 1
      expect(percent(0.25)).toBe('25\u00A0%');
      expect(percent(0.42)).toBe('42\u00A0%');
      expect(percent(0)).toBe('0\u00A0%');
    });

    it('handles string numbers', () => {
      expect(percent('0.3')).toBe('30\u00A0%');
    });

    it('handles null/undefined', () => {
      expect(percent(null)).toBe('0\u00A0%');
      expect(percent(undefined)).toBe('0\u00A0%');
    });
  });

  describe('tax calculation constants', () => {
    const PALETTE = ['#183e31', '#b36b45', '#d59a55', '#73867b', '#9eaa9f'];

    it('has correct palette colors', () => {
      expect(PALETTE).toHaveLength(5);
      expect(PALETTE[0]).toBe('#183e31');
    });

    it('PAGES array has correct structure', () => {
      const pages = [
        ['Readiness', 'Confirm the assessment facts'],
        ['Liability', 'Trace gross income to net cash'],
        ['Deductions', 'Test evidence-backed scenarios'],
        ['Household', 'Review social insurance and family rules'],
        ['Investments', 'Estimate taxable capital income'],
        ['Tax memo', 'Turn findings into an evidence plan']
      ];

      expect(pages).toHaveLength(6);
      expect(pages[0][0]).toBe('Readiness');
      expect(pages[5][0]).toBe('Tax memo');
    });
  });

  it('marks the tax-flow view switch as a pressed segmented control', () => {
    render(<StepTax
      profile={{ income: 60000 }}
      updateProfile={vi.fn()}
      subStep={1}
      setSubStep={vi.fn()}
      analysisStatus="success"
      analysis={{ tax_lab: { headline: {}, bridge: [], social_security: {} } }}
    />);

    expect(screen.getByRole('group', { name: 'Tax flow visualization' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Statutory Flow' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Sankey Stream' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('describes when spouse income is included in the estimate', () => {
    render(<StepTax
      profile={{ spouse_income: 40000, joint_assessment: true, is_married: true }}
      updateProfile={vi.fn()}
      subStep={3}
      setSubStep={vi.fn()}
      analysisStatus="success"
      analysis={{ tax_lab: { headline: {}, social_security: { components: [] } } }}
    />);

    expect(screen.getByText('Included in the household estimate when married and joint assessment are enabled.')).toBeInTheDocument();
  });
});
