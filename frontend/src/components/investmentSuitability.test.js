import { describe, expect, it } from 'vitest';
import { screenInvestment } from './investmentSuitability';

describe('investment suitability precedence', () => {
  it.each(['growth', 'income', 'balanced', 'stability'])('gates short liquidity before %s preference', priority => {
    expect(screenInvestment({ investment_years: 20 }, { priority, liquidity: 'short', lossTolerance: 'high' }).recommendationId).toBeNull();
  });
  it('does not match income preferences ahead of low loss tolerance', () => {
    expect(screenInvestment({}, { priority: 'income', liquidity: 'long', lossTolerance: 'low' }).recommendationId).toBeNull();
  });
  it('screens the horizon even when liquidity is declared long', () => {
    expect(screenInvestment({ investment_years: 3 }, { priority: 'growth', liquidity: 'long', lossTolerance: 'high' }).recommendationId).toBeNull();
  });
  it('can still suggest an educational match for a long-horizon income preference', () => {
    expect(screenInvestment({}, { priority: 'income', liquidity: 'long', lossTolerance: 'high' }).recommendationId).toBe('real_asset_income');
  });
  it('downgrades income preference to all_weather for medium loss tolerance', () => {
    const result = screenInvestment({ investment_years: 20 }, { priority: 'income', liquidity: 'long', lossTolerance: 'medium' });
    expect(result.recommendationId).toBe('all_weather');
    expect(result.reason).toBeNull();
  });
  it('downgrades growth+factor_tilt to all_weather for medium loss tolerance', () => {
    const result = screenInvestment({ investment_years: 20 }, { priority: 'growth', liquidity: 'long', lossTolerance: 'medium' });
    expect(result.recommendationId).toBe('all_weather');
  });
  it('allows balanced_60_40 for medium loss tolerance', () => {
    const result = screenInvestment({ investment_years: 20 }, { priority: 'balanced', liquidity: 'long', lossTolerance: 'medium' });
    expect(result.recommendationId).toBe('balanced_60_40');
  });
  it('selects all_weather for medium liquidity regardless of preference', () => {
    expect(screenInvestment({ investment_years: 20 }, { priority: 'income', liquidity: 'medium', lossTolerance: 'high' }).recommendationId).toBe('all_weather');
  });
});
