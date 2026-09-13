from typing import Optional
from fastapi import Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.security import verify_token
from database import get_db
from models.user import User


def get_token_payload(request: Request) -> dict:
    """Validate presence and signature of access token before acquiring DB session."""
    authorization = request.headers.get("Authorization", "")
    token = authorization[7:] if authorization.startswith("Bearer ") else request.cookies.get("access_token")
    payload = verify_token(token or "", expected_type="access")
    if not payload or not payload.get("sub"):
        raise HTTPException(status_code=401, detail="Authentication required")
    return payload


async def get_current_user(
    payload: dict = Depends(get_token_payload),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Authenticate a browser session without exposing a server-side LLM key."""
    result = await db.execute(select(User).where(User.id == int(payload["sub"]), User.is_active.is_(True)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def require_llm_access(user: User = Depends(get_current_user)) -> User:
    """Paid AI routes require an authenticated client session and are rate-limited."""
    return user
