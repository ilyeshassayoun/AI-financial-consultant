import typing
from fastapi import APIRouter
from schemas import HealthResponse

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
def health_check() -> typing.Any:
    from main import app
    return {
        "status": "ok",
        "service": "financial-advisory-api",
        "version": app.version,
        "model_year": 2026,
    }