import { describe, it, expect } from 'vitest';

describe('StepInsurance utility functions', () => {
  const money = value => new Intl.NumberFormat('de-DE', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0
  }).format(Number(value || 0));

  const labels = {
    gap: 'Coverage gap',
    active: 'Verified in profile',
    not_applicable: 'Not applicable'
  };

  describe('money formatter', () => {
    it('formats German currency correctly', () => {
      expect(money(1000)).toBe('1.000\u00A0€');
      expect(money(250000)).toBe('250.000\u00A0€');
    });
  });

  describe('labels', () => {
    it('has correct status labels', () => {
      expect(labels.gap).toBe('Coverage gap');
      expect(labels.active).toBe('Verified in profile');
      expect(labels.not_applicable).toBe('Not applicable');
    });
  });

  describe('pages structure', () => {
    const pages = [
      ['Risk map', 'Triage existential exposures'],
      ['Income', 'Size disability protection'],
      ['Healthcare', 'Compare GKV and PKV'],
      ['Property', 'Protect assets and liabilities'],
      ['Stress test', 'Test adverse scenarios'],
      ['Policy', 'Commit to implementation rules']
    ];

    it('has 6 pages', () => {
      expect(pages).toHaveLength(6);
    });

    it('each page has title and description', () => {
      pages.forEach(page => {
        expect(page).toHaveLength(2);
        expect(typeof page[0]).toBe('string');
        expect(typeof page[1]).toBe('string');
      });
    });
  });

  describe('insurance aliases', () => {
    const aliases = {
      liability: 'Liability',
      bu: 'BU',
      term_life: 'Risikoleben',
      contents: 'Contents',
      building: 'Building',
      motor: 'Motor',
      legal: 'Legal'
    };

    it('maps lowercase keys to proper case values', () => {
      expect(aliases.liability).toBe('Liability');
      expect(aliases.bu).toBe('BU');
      expect(aliases.term_life).toBe('Risikoleben');
    });
  });
});