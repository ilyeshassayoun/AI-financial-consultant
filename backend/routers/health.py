import typing
import structlog
from fastapi import APIRouter
from sqlalchemy import text

from config import settings
from database import get_engine

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
def health_check() -> typing.Any:
    """Lightweight liveness probe — always returns 200 if the process is up."""
    from main import app
    return {
        "status": "ok",
        "service": "financial-advisory-api",
        "version": app.version,
        "model_year": 2026,
    }


@router.get("/ready")
async def readiness_check() -> typing.Any:
    """Readiness probe — verifies database connectivity."""
    from main import app
    db_status = "not_configured"
    http_status = 200

    if settings.DATABASE_URL:
        try:
            engine = get_engine()
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            db_status = "connected"
        except Exception as exc:
            logger.warning("Readiness: database unreachable", error=str(exc))
            db_status = "unavailable"
            http_status = 503

    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=http_status,
        content={
            "status": "ok" if http_status == 200 else "degraded",
            "service": "financial-advisory-api",
            "version": app.version,
            "database": db_status,
        },
    )