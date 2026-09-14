"""Rate limiting configuration, RFC rate limit headers, and RFC 7807 problem details."""

from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from starlette.requests import Request
from starlette.responses import JSONResponse, Response


limiter = Limiter(key_func=get_remote_address)


def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    """RFC 7807 problem details response on rate limit exhaustion with RFC rate limit headers."""
    retry_after = 60
    headers = {
        "Retry-After": str(retry_after),
        "RateLimit-Limit": "60",
        "RateLimit-Remaining": "0",
        "RateLimit-Reset": str(retry_after),
        "X-RateLimit-Limit": "60",
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": str(retry_after),
        "Content-Type": "application/problem+json",
    }
    content = {
        "type": "https://errors.fintech.local/rate-limit-exceeded",
        "title": "Too Many Requests",
        "status": 429,
        "detail": f"Rate limit exceeded: {exc.detail if hasattr(exc, 'detail') else 'Too many requests'}. Maximum 60 requests per minute.",
        "instance": request.url.path,
    }
    return JSONResponse(status_code=429, content=content, headers=headers)


def inject_rate_limit_headers(response: Response, limit: int = 60, remaining: int = 59, reset: int = 60) -> None:
    """Inject RFC compliant rate limiting headers on HTTP responses."""
    response.headers.setdefault("RateLimit-Limit", str(limit))
    response.headers.setdefault("RateLimit-Remaining", str(remaining))
    response.headers.setdefault("RateLimit-Reset", str(reset))
    response.headers.setdefault("X-RateLimit-Limit", str(limit))
    response.headers.setdefault("X-RateLimit-Remaining", str(remaining))
    response.headers.setdefault("X-RateLimit-Reset", str(reset))
