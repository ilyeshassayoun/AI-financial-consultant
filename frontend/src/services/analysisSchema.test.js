import { describe, expect, it } from 'vitest';
import { validateAnalysisResponse } from './analysisSchema';
import { ApiError } from './apiService';

describe('validateAnalysisResponse', () => {
  const validPayload = {
    tax: { net_income: 42000 },
    investment: { projected_wealth: 150000 },
    retirement: { pension_gap_monthly: 850 },
    advisory_plan: { financial_resilience_score: 75 }
  };

  it('passes a fully valid financial payload', () => {
    expect(validateAnalysisResponse(validPayload)).toEqual(validPayload);
  });

  it('throws an ApiError when tax calculation is missing or invalid', () => {
    expect(() => validateAnalysisResponse({ investment: {}, retirement: {} })).toThrow(ApiError);
    expect(() => validateAnalysisResponse({ tax: { net_income: 'invalid' } })).toThrow(ApiError);
  });

  it('throws an ApiError when investment projection has non-finite numbers', () => {
    expect(() => validateAnalysisResponse({
      tax: { net_income: 40000 },
      investment: { projected_wealth: NaN },
      retirement: { pension_gap_monthly: 800 }
    })).toThrow(ApiError);
  });

  it('throws an ApiError when payload is null or not an object', () => {
    expect(() => validateAnalysisResponse(null)).toThrow(ApiError);
    expect(() => validateAnalysisResponse('invalid-json')).toThrow(ApiError);
  });
});
