// Conservative screening, not a guarantee of a maximum investment loss.

// Strategies ordered from lowest to highest equity risk.
const RISK_RANK = {
  all_weather: 1,
  balanced_60_40: 2,
  real_asset_income: 3,
  global_core: 4,
  factor_tilt: 5,
};

// Maximum risk rank allowed for each loss-tolerance level.
const TOLERANCE_CEILING = {
  low: 0,      // no growth portfolio is suitable
  medium: 2,   // balanced_60_40 or all_weather
  high: 5,     // any strategy
};

function candidateFromPreference(answers, years) {
  if (years < 8 || answers.liquidity === 'medium') return 'all_weather';
  if (answers.priority === 'income') return 'real_asset_income';
  if (answers.priority === 'growth' && answers.lossTolerance === 'high' && years >= 15) return 'factor_tilt';
  if (answers.priority === 'growth' && years >= 10) return 'global_core';
  return 'balanced_60_40';
}

export function screenInvestment(profile, answers) {
  const years = Number(profile.investment_years ?? 20);

  // Hard gates: these block all growth portfolios.
  if (answers.liquidity === 'short' || years <= 3) {
    return { recommendationId: null, reason: 'Capital is needed within three years. No growth-portfolio match can be applied; review a separate capital-preservation plan.' };
  }
  if (answers.lossTolerance === 'low' || answers.priority === 'stability') {
    return { recommendationId: null, reason: 'The available growth portfolios do not guarantee capital stability or a 10% loss limit. Review suitability before implementation.' };
  }

  // Step 1: pick a candidate based on preference.
  let candidate = candidateFromPreference(answers, years);

  // Step 2: constrain by risk tolerance — downgrade if the candidate exceeds
  // the maximum risk rank for the stated tolerance.
  const ceiling = TOLERANCE_CEILING[answers.lossTolerance] ?? 3;
  if ((RISK_RANK[candidate] ?? 3) > ceiling) {
    candidate = 'all_weather';
  }

  return { recommendationId: candidate, reason: null };
}
