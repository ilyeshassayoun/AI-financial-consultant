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
    model: Dict[str, str]
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
    model: Dict[str, str]
    horizon: Dict[str, Any]


class OptimizerSummary(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False, extra="allow")
    total_potential_tax_savings: float
    financial_health_score: int
    score_breakdown: Dict[str, int]
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