from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional, Dict, Any, Literal


class InsuranceNeed(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False, extra="allow")
    id: str
    name: str
    priority: int
    status: Literal["gap", "active", "not_applicable"]
    severity: str
    why: str
    decision: str
    recommended_cover: Optional[float] = None


class InsuranceSummary(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False, extra="allow")
    human_capital_present_value: float
    essential_monthly_spend: float
    reserve_months: Optional[float] = None
    bu_target_monthly: float
    bu_gap_monthly: float
    term_life_need: Optional[float] = None


class HealthDecision(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False, extra="allow")
    threshold: float
    eligible_for_comparison: bool
    income_headroom: float
    recommendation: str
    warning: str
    gkv_employee_health_estimate: float
    compare: List[str]


class IncomeStressItem(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False, extra="allow")
    months: int
    without_repair: float
    with_target_cover: float
    capital_preserved: float


class InsuranceLabResponse(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False, extra="allow")
    needs: List[InsuranceNeed]
    summary: InsuranceSummary
    health_decision: HealthDecision
    income_stress: List[IncomeStressItem]
    readiness: Literal["gated", "ready"]
    missing_essential: List[str]
    implementation: List[str]
    model: Dict[str, Any]
    assumptions: List[str]
    sources: List[Dict[str, str]]


class InsuranceStepResponse(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False, extra="allow")
    needs: List[InsuranceNeed]
    summary: InsuranceSummary
    health_decision: HealthDecision
    income_stress: List[IncomeStressItem]
    readiness: Literal["gated", "ready"]
    missing_essential: List[str]
    implementation: List[str]
    model: Dict[str, Any]
    assumptions: List[str]
    sources: List[Dict[str, str]]
