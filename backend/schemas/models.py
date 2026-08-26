from pydantic import BaseModel, ConfigDict, Field, model_validator
from typing import List, Optional, Dict, Any, Literal
from llm_service import ChatMessage


class ClientProfile(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False)
    age: int = Field(default=30, ge=18, le=99)
    income: float = Field(default=60000, ge=0)
    has_dependents: bool = False
    is_married: bool = False
    church_tax: bool = False
    tax_class: int = Field(default=1, ge=1, le=6)
    num_children: int = Field(default=0, ge=0, le=20)
    children_under_25: Optional[int] = Field(default=None, ge=0, le=20)
    is_saxony: bool = False
    joint_assessment: bool = True
    spouse_income: float = Field(default=0.0, ge=0, le=1_000_000_000)
    additional_deductions: float = Field(default=0.0, ge=0, le=10_000_000)
    commute_km: int = Field(default=0, ge=0, le=1000)
    home_office_days: int = Field(default=0, ge=0, le=230)
    riester_contribution: float = Field(default=0.0, ge=0, le=100_000)
    has_private_health: bool = False
    private_health_cost: float = Field(default=0.0, ge=0, le=100_000)
    annual_capital_gains: float = Field(default=0.0, ge=0, le=1_000_000_000)
    equity_fund_share: float = Field(default=1.0, ge=0, le=1)
    has_property: bool = False
    has_car: bool = False
    risk_profile: Literal["low", "medium", "high"] = "medium"
    initial_amount: float = Field(default=5000.0, ge=0, le=1_000_000_000)
    monthly_investment: float = Field(default=500.0, ge=0, le=10_000_000)
    investment_years: int = Field(default=20, ge=1, le=60)
    retirement_age: int = Field(default=67, ge=19, le=100)
    longevity_age: int = Field(default=95, ge=70, le=110)
    years_worked: int = Field(default=5, ge=0, le=80)
    current_entgeltpunkte: Optional[float] = Field(default=None, ge=0, le=200)
    existing_insurances: list[str] = Field(default_factory=list)
    existing_assets: list[str] = Field(default_factory=list)
    goals: list[str] = Field(default_factory=list)
    target_pension_ratio: float = Field(default=0.8, ge=0.1, le=2.0)
    bav_contribution: float = Field(default=0.0, ge=0, le=100_000)
    bav_employer_subsidy_rate: float = Field(default=0.15, ge=0, le=2)
    bav_expected_return: float = Field(default=0.04, ge=-0.1, le=0.3)
    bav_retirement_deduction_rate: float = Field(default=0.20, ge=0, le=0.8)
    expected_inflation: float = Field(default=0.02, ge=-0.02, le=0.20)
    expected_pension_growth: float = Field(default=0.015, ge=-0.05, le=0.20)
    retirement_health_care_rate: Optional[float] = Field(default=None, ge=0, le=0.5)
    retirement_tax_rate: float = Field(default=0.08, ge=0, le=0.6)
    safe_withdrawal_rate: float = Field(default=0.035, ge=0.02, le=0.06)
    management_fee: float = Field(default=0.0018, ge=0, le=0.10)
    housing_cost: Optional[float] = Field(default=1100.0, ge=0, le=1_000_000)
    living_cost: Optional[float] = Field(default=500.0, ge=0, le=1_000_000)
    mobility_cost: Optional[float] = Field(default=200.0, ge=0, le=1_000_000)
    leisure_cost: Optional[float] = Field(default=300.0, ge=0, le=1_000_000)
    secondary_income: Optional[float] = Field(default=0.0, ge=0, le=1_000_000_000)
    subscriptions_cost: Optional[float] = Field(default=80.0, ge=0, le=1_000_000)
    travel_cost: Optional[float] = Field(default=150.0, ge=0, le=1_000_000)
    liquid_savings: float = Field(default=5000.0, ge=0)
    unsecured_debt: float = Field(default=0.0, ge=0)
    unsecured_debt_rate: float = Field(default=0.08, ge=0, le=1)
    monthly_debt_payment: float = Field(default=0.0, ge=0)
    debt_payoff_years: int = Field(default=5, ge=1, le=40)
    bu_monthly_benefit: float = Field(default=0.0, ge=0)
    employment_stability: Literal["variable", "unstable", "stable", "very_stable"] = "stable"
    occupation_risk: Literal["low", "medium", "high"] = "medium"
    smoker: bool = False
    living_space_sqm: float = Field(default=70.0, ge=0, le=2000)
    mortgage_balance: Optional[float] = Field(default=None, ge=0)
    youngest_dependent_age: int = Field(default=8, ge=0, le=30)
    investment_strategy: str = "balanced_60_40"
    target_wealth: float = Field(default=250000.0, ge=0)
    property_price: float = Field(default=350000.0, ge=0)
    property_down_payment: float = Field(default=70000.0, ge=0)
    mortgage_rate: float = Field(default=0.04, ge=0, le=1)
    mortgage_amortization: float = Field(default=0.02, ge=0, le=1)
    gross_rental_yield: float = Field(default=0.035, ge=0, le=1)
    property_appreciation: float = Field(default=0.02, ge=-0.2, le=1)

    @model_validator(mode='after')
    def check_retirement_age(self) -> 'ClientProfile':
        if self.retirement_age <= self.age:
            raise ValueError('retirement_age must be greater than age')
        if self.longevity_age <= self.retirement_age:
            raise ValueError('longevity_age must be greater than retirement_age')
        return self


class ChatRequest(BaseModel):
    profile: ClientProfile
    messages: List[ChatMessage]


class ConsultantInsightRequest(BaseModel):
    profile: ClientProfile
    step: str = "profile"