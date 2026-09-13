import hmac
import math
import os
import structlog
from contextlib import asynccontextmanager
from typing import Optional, Any

from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from analysis import run_full_analysis as _run_full_analysis
from routers import tax, investment, insurance, retirement, chat, health
from routers import auth as auth_router
from routers import profiles as profiles_router
from schemas import ClientProfile
from config import settings
from database import init_db
from rate_limit import limiter

logger = structlog.get_logger(__name__)
@asynccontextmanager
async def lifespan(app: FastAPI):
    settings.validate_deployment()
    app.state.db_available = False
    if settings.DATABASE_URL:
        try:
            await init_db()
            app.state.db_available = True
            logger.info("Database initialized")
        except Exception as exc:
            logger.warning("DB init failed — running without persistence", error=str(exc), error_type=type(exc).__name__)
    yield


app = FastAPI(
    title="AI Financial Advisory API",
    version="2026.1",
    description="Explainable German household finance planning API.",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore

# Safe CORS configuration
origins = settings.cors_origins_list
has_wildcard = "*" in origins or not origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if has_wildcard else origins,
    allow_credentials=not has_wildcard,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=["*"],
)


def _json_safe(value: Any) -> Any:
    if isinstance(value, float) and not math.isfinite(value):
        return "non-finite number"
    if isinstance(value, dict):
        return {k: _json_safe(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [_json_safe(i) for i in value]
    return value


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(status_code=422, content={"detail": _json_safe(exc.errors())})


def require_llm_access(x_api_key: Optional[str] = Header(default=None)) -> None:
    if settings.LLM_ACCESS_KEY and (
        not x_api_key or not hmac.compare_digest(x_api_key, settings.LLM_ACCESS_KEY)
    ):
        raise HTTPException(status_code=401, detail="Valid X-API-Key required for AI routes")


@app.get("/health", tags=["health"])
def root_health_check() -> dict[str, Any]:
    return {
        "status": "ok",
        "service": "financial-advisory-api",
        "version": app.version,
        "model_year": 2026,
    }


app.include_router(health.router)
app.include_router(tax.router)
app.include_router(investment.router)
app.include_router(insurance.router)
app.include_router(retirement.router)
app.include_router(chat.router, dependencies=[Depends(require_llm_access)])
app.include_router(auth_router.router)
app.include_router(profiles_router.router)


@app.post("/api/analyze")
@limiter.limit(settings.RATE_LIMIT_ANALYZE)
async def analyze_profile(request: Request, profile: ClientProfile) -> dict[str, Any]:
    return _run_full_analysis(profile)


# Mount frontend static distribution if built
_dist_candidates = [
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "static")),
    "/app/frontend/dist",
    "/app/static",
]

frontend_dist = next((c for c in _dist_candidates if os.path.isdir(c) and os.path.isfile(os.path.join(c, "index.html"))), None)

if frontend_dist:
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa_frontend(request: Request, full_path: str):
        if full_path.startswith("api/") or full_path == "api" or full_path == "docs" or full_path == "openapi.json":
            raise HTTPException(status_code=404, detail="Not Found")
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
