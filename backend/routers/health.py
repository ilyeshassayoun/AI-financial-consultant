from datetime import datetime, timezone
import time
import typing
import structlog
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from sqlalchemy import text
import anyio

from config import settings
from database import get_engine, get_db_pool_stats

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/api", tags=["health"])



@router.get("/health/live")
@router.get("/health")
def live_check() -> typing.Any:
    """Kubernetes liveness probe (< 5ms) — verifies event loop and application process."""
    from main import app
    return {
        "status": "alive",
        "service": "financial-advisory-api",
        "version": app.version,
        "model_year": 2026,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/health/ready")
@router.get("/ready")
async def readiness_check() -> typing.Any:
    """Verify that required dependencies can serve application traffic."""
    from main import app
    db_status = "not_configured"
    http_status = 200
    latency_ms = 0.0
    pool_stats = get_db_pool_stats()

    if settings.DATABASE_URL:
        t0 = time.monotonic()
        try:
            with anyio.fail_after(settings.READINESS_TIMEOUT_SECONDS):
                engine = get_engine()
                async with engine.connect() as conn:
                    await conn.execute(text("SELECT 1"))
            latency_ms = round((time.monotonic() - t0) * 1000, 2)
            db_status = "connected"
        except TimeoutError:
            latency_ms = round((time.monotonic() - t0) * 1000, 2)
            logger.warning("Readiness: database ping timed out", latency_ms=latency_ms)
            db_status = "timeout"
            http_status = 503
        except Exception as exc:
            latency_ms = round((time.monotonic() - t0) * 1000, 2)
            logger.warning("Readiness: database unreachable", error=str(exc), latency_ms=latency_ms)
            db_status = "unavailable"
            http_status = 503

    return JSONResponse(
        status_code=http_status,
        content={
            "status": "ready" if http_status == 200 else "unavailable",
            "service": "financial-advisory-api",
            "version": app.version,
            "database": db_status,
            "latency_ms": latency_ms,
            "latency_budget_ms": 50.0,
            "latency_budget_met": latency_ms < 50.0,
            "pool": pool_stats,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )
