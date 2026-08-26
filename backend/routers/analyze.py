import typing
from fastapi import APIRouter
from analysis import run_full_analysis as _run_full_analysis
from schemas import ClientProfile, FullAnalysisResponse

router = APIRouter(prefix="/api", tags=["analyze"])


@router.post("/analyze")
def analyze_profile(profile: ClientProfile) -> typing.Any:
    return _run_full_analysis(profile)