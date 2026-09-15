from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional, Dict, Any, Literal


class InvestmentAllocation(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False, extra="allow")
    global_equity: float
    eu_equity: Optional[float] = None
    emerging_markets: Optional[float] = None
    eu_bonds: Optional[float] = None
    corporate_bonds: Optional[float] = None
    real_estate: Optional[float] = None
    commodities: Optional[float] = None


class YearlyData(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False, extra="allow")
    year: int
    contributions: float
    projected_p10: float
    projected_p50: float
    projected_p90: float


class FanChartSeries(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False, extra="allow")
    year: str
    year_num: int
    contributions: float
    p10_bear: float
    p25: float
    p50_median: float
    p75: float
    p90_bull: float


class CostDragAnalysis(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False, extra="allow")
    passive_etf_terminal: float
    active_fund_terminal: float
    total_fee_wealth_lost: float
    fee_savings_pct: float


class SafeWithdrawal(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False, extra="allow")
    rule_4_percent_monthly: float
    rule_3_5_percent_monthly: float


class InvestmentResponse(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False, extra="allow")
    portfolio_label: str
    risk_profile: Literal["low", "medium", "high"]
    years: int
    initial_amount: float
    monthly_contribution: float
    total_contributions: float
    projected_p05: float
    projected_p10: float
    projected_p25: float
    projected_p50: float
    projected_p75: float
    projected_p90: float
    projected_p95: float
    real_p10: float
    real_p50: float
    real_p90: float
    max_drawdown_pct: float
    allocation: InvestmentAllocation
    yearly_data: List[YearlyData]
    fan_chart_series: List[FanChartSeries]
    cost_drag_analysis: CostDragAnalysis
    safe_withdrawal: SafeWithdrawal


class StrategyDetail(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False, extra="allow")
    id: str
    name: str
    subtitle: str
    expected_return: float
    expected_volatility: float
    probability_target: float
    p50: float
    p10: float
    real_p50: float
    median_max_drawdown: float
    probability_above_contributions: float
    expected_shortfall_95: float
    sharpe_ratio: float
    sortino_ratio: float
    income_yield: float
    allocation: List[Dict[str, Any]]
    instruments: List[Dict[str, Any]]
    why: str


class InvestmentLabResponse(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False, extra="allow")
    strategies: List[StrategyDetail]
    selected: StrategyDetail
    selected_strategy: str
    target_wealth: float
    tax_analysis: Dict[str, Any]
    investment_policy: Dict[str, Any]
    implementation_plan: Dict[str, Any]
    real_estate: Dict[str, Any]
    goal_optimizer: Dict[str, Any]
    stress_matrix: List[Dict[str, Any]]
    methodology: Dict[str, Any]
