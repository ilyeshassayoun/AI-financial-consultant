"""FastAPI router for historical macroeconomic crisis stress testing & SRR laboratory."""

from typing import Any, Dict, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from schemas import ClientProfile
from stress_test_engine import run_stress_test_simulation, HISTORICAL_REGIMES

router = APIRouter(prefix="/api/lab", tags=["stress-test"])


class StressTestRequest(BaseModel):
    scenario: str = Field(default="gfc_2008", description="Crisis scenario: gfc_2008, dotcom_2000, or stagflation_1973")
    strategy: str = Field(default="global_core", description="Strategy key or name: global_core, balanced, defensive, factor_tilt, etc.")
    initial_capital: float = Field(default=100000.0, ge=0.0, description="Initial portfolio balance in EUR")
    monthly_cashflow: float = Field(default=0.0, description="Monthly contribution (+) or withdrawal (-)")
    horizon_years: Optional[int] = Field(default=None, ge=1, le=50, description="Optional custom horizon in years")
    is_decumulation: bool = Field(default=False, description="Whether simulation is in decumulation phase")
    asset_weights: Optional[Dict[str, float]] = Field(default=None, description="Optional custom asset weights mapping")
    profile: Optional[ClientProfile] = Field(default=None, description="Optional client profile for input context")


@router.post("/stress-test")
def execute_stress_test(payload: StressTestRequest) -> Dict[str, Any]:
    """Execute historical crisis stress test and compute drawdown, recovery, and SRR."""
    scenario_clean = payload.scenario.lower().strip()
    if scenario_clean not in HISTORICAL_REGIMES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid crisis scenario '{payload.scenario}'. Supported scenarios: {list(HISTORICAL_REGIMES.keys())}"
        )

    init_cap = payload.initial_capital
    cashflow = payload.monthly_cashflow

    # If profile is passed, infer missing parameters if default
    if payload.profile is not None:
        if init_cap == 100000.0 and payload.profile.current_savings > 0:
            init_cap = float(payload.profile.current_savings)
        if cashflow == 0.0 and payload.profile.monthly_investment > 0:
            cashflow = float(payload.profile.monthly_investment)

    try:
        results = run_stress_test_simulation(
            scenario=scenario_clean,
            strategy=payload.strategy,
            initial_capital=init_cap,
            monthly_cashflow=cashflow,
            horizon_years=payload.horizon_years,
            is_decumulation=payload.is_decumulation,
            asset_weights=payload.asset_weights,
        )
        return results
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(val_err)
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Stress test execution failed: {str(exc)}"
        )
