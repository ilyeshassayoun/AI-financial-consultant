from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional, Dict, Any, Literal


class TaxDetail(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False, extra="allow")
    commute_allowance: float
    home_office_allowance: float
    werbungskosten: float
    werbungskosten_exceeds_pauschale: bool
    werbungskosten_delta: float
    social_security: Dict[str, Any]
    assessment_basis: Dict[str, Any]
    zvE: float
    income_tax: float
    tax_credits: float
    solidarity_surcharge: float
    church_tax_amount: float
    riester_benefit_used: str
    riester_tax_benefit: float
    riester_allowance_addback: float
    child_benefit_used: str
    kindergeld_received: float
    kinderfreibetrag_savings: float
    kindergeld_addback: float
    calculation_basis: Optional[Dict[str, Any]] = None


class TaxResponse(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False, extra="allow")
    gross_income: float
    tax_amount: float
    net_income: float
    effective_tax_rate: float
    marginal_tax_rate: float
    details: TaxDetail
    calculation_basis: Dict[str, Any]


class TaxLabResponse(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False, extra="allow")
    headline: Dict[str, Any]
    assessment: Dict[str, Any]
    input_flags: List[str]
    breakdown: List[Dict[str, Any]]
    deductions: Dict[str, float]
    scenarios: List[Dict[str, Any]]
    social_security: Dict[str, Any]
    capital_income: Dict[str, Any]
    model: Dict[str, Any]
    limitations: List[str]
    sources: List[Dict[str, str]]
    documents: List[Dict[str, Any]]
    workflow: List[str]


class TaxStepResponse(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False, extra="allow")
    gross_income: float
    tax_amount: float
    net_income: float
    effective_tax_rate: float
    marginal_tax_rate: float
    details: TaxDetail
    calculation_basis: Dict[str, Any]
    lab: TaxLabResponse
