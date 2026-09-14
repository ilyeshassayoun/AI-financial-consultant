import { ApiError } from './apiService';

/**
 * Runtime schema validator for the full analysis API response.
 * Protects downstream calculation engines and charts from crashing
 * on missing or malformed financial response fields.
 */
export function validateAnalysisResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new ApiError('The analysis engine returned an empty or unreadable response.', 422);
  }

  // 1. Tax validation
  if (!data.tax || typeof data.tax !== 'object') {
    throw new ApiError('Analysis response is missing valid tax calculation data.', 422);
  }
  const tax = data.tax;
  if (typeof tax.net_income !== 'number' || !Number.isFinite(tax.net_income)) {
    throw new ApiError('Analysis response contains non-finite net income data.', 422);
  }

  // 2. Investment validation
  if (!data.investment || typeof data.investment !== 'object') {
    throw new ApiError('Analysis response is missing valid investment projection data.', 422);
  }
  const inv = data.investment;
  const wealth = inv.projected_wealth ?? inv.projected_p50;
  if (typeof wealth !== 'number' || !Number.isFinite(wealth)) {
    throw new ApiError('Analysis response contains non-finite investment wealth projections.', 422);
  }

  // 3. Retirement validation
  if (!data.retirement || typeof data.retirement !== 'object') {
    throw new ApiError('Analysis response is missing valid retirement model data.', 422);
  }
  const ret = data.retirement;
  if (typeof ret.pension_gap_monthly !== 'number' || !Number.isFinite(ret.pension_gap_monthly)) {
    throw new ApiError('Analysis response contains non-finite pension gap calculations.', 422);
  }

  // 4. Advisory plan / Financial health validation
  if (data.advisory_plan && typeof data.advisory_plan === 'object') {
    const plan = data.advisory_plan;
    if (plan.financial_resilience_score !== undefined && plan.financial_resilience_score !== null) {
      if (typeof plan.financial_resilience_score !== 'number' || !Number.isFinite(plan.financial_resilience_score)) {
        throw new ApiError('Analysis response contains non-finite resilience score.', 422);
      }
    }
  }

  return data;
}
