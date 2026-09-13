export const mockFullAnalysis = {
  tax: {
    gross_income: 60000,
    tax_amount: 11500,
    net_income: 37000,
    effective_tax_rate: 0.191,
    marginal_tax_rate: 0.38,
    details: {
      taxable_income: 50000,
      solidarity_surcharge: 0,
      church_tax: 0,
      income_tax_before_credits: 11500
    },
    calculation_basis: {
      tariff_zone: 'Zone 3',
      grundfreibetrag: 11784
    }
  },
  tax_lab: {
    input_flags: [],
    scenarios: [
      { id: 'base', name: 'Base Statutory Assessment', annual_tax: 11500, net_monthly: 3083, Tax: 11500 }
    ],
    limitations: [
      'Statutory 2026 progressive tariff model § 32a EStG',
      'Standard employee lump-sum Werbungskosten applied'
    ],
    sources: [
      { url: 'https://www.gesetze-im-internet.de/estg/__32a.html', label: '§ 32a EStG Statutory Tariff' }
    ],
    tax_bracket_summary: {
      taxable_income: 50000,
      marginal_rate: 0.38,
      solidarity_surcharge: 0
    },
    deductions_breakdown: [
      { category: 'Werbungskosten', amount: 1230 },
      { category: 'Sonderausgaben / Vorsorge', amount: 8770 }
    ],
    waterfall: [
      { label: 'Gross Income', amount: 60000, type: 'plus' },
      { label: 'Income Tax', amount: -11500, type: 'minus' },
      { label: 'Social Contributions', amount: -11500, type: 'minus' },
      { label: 'Net Spendable', amount: 37000, type: 'total' }
    ],
    marginal_curve: [
      { income: 15000, rate: 0.14 },
      { income: 30000, rate: 0.26 },
      { income: 60000, rate: 0.38 },
      { income: 100000, rate: 0.42 }
    ]
  },
  insurance: [
    {
      id: 'liability',
      name: 'Privathaftpflicht',
      priority: 1,
      status: 'active',
      decision: 'Verified in profile',
      why: 'Protects against existential third-party liability claims up to €50M.',
      recommended_cover: 50000000
    }
  ],
  insurance_lab: {
    readiness: 'ready',
    needs: [
      {
        id: 'liability',
        name: 'Privathaftpflicht',
        priority: 1,
        status: 'active',
        decision: 'Verified in profile',
        why: 'Protects against existential liability under § 823 BGB.',
        recommended_cover: 50000000
      },
      {
        id: 'bu',
        name: 'Berufsunfähigkeit (BU)',
        priority: 2,
        status: 'gap',
        decision: 'Coverage gap detected',
        why: 'Sizes monthly income defense against medical inability to work.',
        recommended_cover: 2500
      }
    ],
    income_stress: [
      { months: 6, without_repair: 3000, with_target_cover: 15000 },
      { months: 12, without_repair: 6000, with_target_cover: 30000 },
      { months: 24, without_repair: 12000, with_target_cover: 60000 }
    ],
    assumptions: [
      'DIN 77230 existential risk triage hierarchy',
      'Target disability cover sized at 80% of net spendable income'
    ],
    sources: [
      { url: 'https://www.din.de', label: 'DIN 77230 Financial Analysis Standard' }
    ]
  },
  investment: {
    projected_p50: 250000,
    portfolio_label: 'Balanced 60/40'
  },
  investment_lab: {
    selected: {
      id: 'balanced_60_40',
      name: 'Balanced 60/40',
      why: 'Educational core-satellite allocation',
      allocation: [
        { asset: 'World Equities', pct: 60 },
        { asset: 'Euro Aggregate Bonds', pct: 40 }
      ],
      instruments: [
        { isin: 'IE00B4L5Y983', name: 'iShares Core MSCI World', ter: 0.0020 }
      ],
      timeline: [
        { year: 1, p10: 10000, p50: 12000, p90: 14000 },
        { year: 10, p10: 80000, p50: 110000, p90: 150000 },
        { year: 20, p10: 170000, p50: 250000, p90: 380000 }
      ],
      p50: 250000
    },
    selected_strategy: 'balanced_60_40',
    strategies: [
      {
        id: 'balanced_60_40',
        name: 'Balanced 60/40',
        why: 'Educational core-satellite allocation',
        allocation: [{ asset: 'Equities', pct: 60 }, { asset: 'Bonds', pct: 40 }],
        instruments: [],
        timeline: [],
        p50: 250000
      }
    ],
    investment_policy: { execution_status: 'eligible_for_review' },
    methodology: { simulations_per_strategy: 600 }
  },
  retirement: {
    pension_gap_monthly: 450,
    total_retirement_income_monthly: 2100,
    target_retirement_income_monthly: 2550,
    replacement_ratio: 0.82
  },
  retirement_lab: {
    readiness: { status: 'ready' },
    limitations: [
      'DRV calculation assumption based on current statutory rules (2026)',
      'Inflation adjusted at 2.0% p.a. to present-day purchasing power'
    ],
    sources: [
      { url: 'https://www.deutsche-rentenversicherung.de', label: 'Deutsche Rentenversicherung Bund' }
    ],
    pillars: [
      { name: 'DRV Statutory Pension', real_monthly: 1400, nominal_monthly: 1950, Income: 1400 },
      { name: 'bAV Corporate Pension', real_monthly: 250, nominal_monthly: 350, Income: 250 },
      { name: 'Private ETF Capital', real_monthly: 450, nominal_monthly: 600, Income: 450 },
      { name: 'Riester Pension', real_monthly: 0, nominal_monthly: 0, Income: 0 }
    ],
    retirement_age_scenarios: [
      { age: 63, real_monthly_income: 1600, real_gap: 950, Income: 1600, Gap: 950 },
      { age: 67, real_monthly_income: 2100, real_gap: 450, Income: 2100, Gap: 450 },
      { age: 70, real_monthly_income: 2450, real_gap: 100, Income: 2450, Gap: 100 }
    ],
    statutory: {
      ep_total: 35.5,
      ep_per_future_year: 1.15,
      access_factor: 1.0,
      nominal_gross: 1600,
      real_gross: 1250,
      real_net_estimate: 1100
    },
    totals: {
      real_monthly: 2100,
      real_gap: 450,
      funded_ratio: 0.82
    },
    target: {
      real_monthly: 2550,
      replacement_ratio: 0.8
    },
    savings_gap: {
      required_monthly_total: 185
    },
    private_capital: {
      net: 165000
    }
  },
  optimization: {
    summary: { financial_health_score: 84 }
  },
  advisory_plan: {
    actions: [
      { id: 'act_1', priority: 'high', title: 'Verify Haftpflicht Coverage' }
    ]
  }
};
