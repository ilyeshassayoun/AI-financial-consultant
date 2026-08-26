import typing
from fastapi import APIRouter
from advanced_retirement_engine import build_retirement_lab
from schemas import ClientProfile, RetirementLabResponse, OptimizationResponse
from analysis import run_full_analysis as _run_full_analysis

router = APIRouter(prefix="/api", tags=["retirement"])


@router.post("/step/retirement")
def step_retirement(profile: ClientProfile) -> typing.Any:
    return _run_full_analysis(profile)["retirement_lab"]


@router.post("/step/optimize")
def step_optimize(profile: ClientProfile) -> typing.Any:
    return _run_full_analysis(profile)["optimization"]


@router.post("/lab/retirement")
def retirement_lab(profile: ClientProfile) -> typing.Any:
    return build_retirement_lab(profile.model_dump(), {}, {})