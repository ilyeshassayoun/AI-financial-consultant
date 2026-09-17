from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional, Dict, Any, Literal


class RetirementPillar(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False, extra="allow")
    id: str
    label: str
    real_monthly: float
    nominal_monthly: float


class RetirementTotals(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False, extra="allow")
    real_monthly: float
    nominal_monthly: float
    real_gap: float
    funded_ratio: float


class StatutoryPension(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False, extra="allow")
    ep_total: float
    ep_past: float
    ep_future: float
    ep_per_future_year: float
    access_factor: float
    pension_value: float
    nominal_gross: float
    real_gross: float
    real_net_estimate: float
    health_care_rate: float
    tax_rate: float


class SavingsGap(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False, extra="allow")
    required_monthly_total: float
    additional_monthly: float


class PrivateCapital(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False, extra="allow")
    gross: float
    contributions: float
    partial_exemption: float
    estimated_liquidation_tax: float
    net: float


class TargetRetirement(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False, extra="allow")
    real_monthly: float
    nominal_monthly: float
    replacement_ratio: float


class RetirementLabResponse(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False, extra="allow")
    pillars: List[RetirementPillar]
    totals: RetirementTotals
    target: TargetRetirement
    statutory: StatutoryPension
    private_capital: PrivateCapital
    savings_gap: SavingsGap
    retirement_age_scenarios: List[Dict[str, Any]]
    withdrawal_strategies: List[Dict[str, Any]]
    timeline: List[Dict[str, Any]]
    readiness: Dict[str, Any]
    assumptions: Dict[str, Any]
    limitations: List[str]
    sources: List[Dict[str, str]]
    actions: List[str]
    model: Dict[str, Any]
    horizon: Dict[str, Any]


class RetirementStepResponse(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False, extra="allow")
    pillars: List[RetirementPillar]
    totals: RetirementTotals
    target: TargetRetirement
    statutory: StatutoryPension
    private_capital: PrivateCapital
    savings_gap: SavingsGap
    retirement_age_scenarios: List[Dict[str, Any]]
    withdrawal_strategies: List[Dict[str, Any]]
    timeline: List[Dict[str, Any]]
    readiness: Dict[str, Any]
    assumptions: Dict[str, Any]
    limitations: List[str]
    sources: List[Dict[str, str]]
    actions: List[str]
    model: Dict[str, Any]
    horizon: Dict[str, Any]


class OptimizerSummary(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False, extra="allow")
    total_potential_tax_savings: float
    financial_health_score: int
    score_breakdown: Dict[str, float]
    top_3_priorities: List[Dict[str, Any]]
    lifetime_human_capital_at_risk: float
    projected_30yr_wealth: float


class OptimizationResponse(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False, extra="allow")
    tax_optimizations: List[Dict[str, Any]]
    investment_suggestions: List[Dict[str, Any]]
    retirement_actions: List[Dict[str, Any]]
    insurance_actions: List[Dict[str, Any]]
    summary: OptimizerSummary


class RetirementProjectionResponse(BaseModel):
    """Legacy pension projection returned alongside the richer retirement lab."""

    model_config = ConfigDict(allow_inf_nan=False, extra="allow")
    current_age: int
    retirement_age: int
    years_until_retirement: int
    entgeltpunkte_total: float
    entgeltpunkte_per_year: float
    zugangsfaktor: float
    early_late_penalty_pct: float
    state_pension_monthly_gross: float
    state_pension_monthly: float
    state_pension_monthly_real: float
    state_pension_monthly_real_gross: Optional[float] = None
    bav_pension_monthly: float
    private_pension_monthly: float
    riester_pension_monthly: float
    total_retirement_income_monthly: float
    target_retirement_income_monthly: float
    pension_gap_monthly: float
    replacement_ratio: float
    solvency_score: float
    required_monthly_savings_to_close_gap: float
    additional_monthly_savings_required: float = 0
    required_monthly_savings_total: float = 0
    private_nest_egg_projected: float
    calculation_basis: Dict[str, Any]
