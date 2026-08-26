import typing
from fastapi import APIRouter
from investment_engine import simulate_investment
from advanced_investment_engine import build_investment_lab
from schemas import ClientProfile, InvestmentResponse, InvestmentLabResponse

router = APIRouter(prefix="/api", tags=["investment"])


@router.post("/step/investment")
def step_investment(profile: ClientProfile) -> typing.Any:
    return simulate_investment(
        initial_amount=profile.initial_amount,
        monthly_contribution=profile.monthly_investment,
        years=profile.investment_years,
        risk_profile=profile.risk_profile,
        management_fee=profile.management_fee,
        inflation_rate=profile.expected_inflation,
    )


@router.post("/lab/investment")
def investment_lab(profile: ClientProfile) -> typing.Any:
    return build_investment_lab(profile.model_dump())