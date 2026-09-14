import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, Any
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, EmailStr, Field, field_validator
from pydantic_core import PydanticCustomError
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.concurrency import run_in_threadpool
from database import get_db
from models.user import User
from models.refresh_session import RefreshTokenSession
from core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    verify_token,
    hash_token,
)
from config import settings
from dependencies import get_current_user
from rate_limit import limiter
import structlog

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/api/auth", tags=["auth"])


class PasswordRequest(BaseModel):
    password: str = Field(min_length=8, max_length=72)

    @field_validator("password")
    @classmethod
    def validate_password_bytes(cls, password: str) -> str:
        if len(password.encode("utf-8")) > 72:
            raise PydanticCustomError("password_too_long", "Password must be at most 72 UTF-8 bytes")
        return password


class RegisterRequest(PasswordRequest):
    email: EmailStr
    name: Optional[str] = None


class LoginRequest(PasswordRequest):
    email: EmailStr


class SessionResponse(BaseModel):
    user: dict[str, Any]


class RefreshRequest(BaseModel):
    refresh_token: Optional[str] = None


def _user_dict(user: User) -> dict[str, Any]:
    return {"id": user.id, "email": user.email, "name": user.name, "avatar_url": user.avatar_url}


async def _issue_session(
    response: Response,
    user: User,
    db: AsyncSession,
    family_id: Optional[str] = None,
) -> tuple[str, str]:
    access_tok = create_access_token({"sub": str(user.id)})
    refresh_tok = create_refresh_token({"sub": str(user.id)}, family_id=family_id)
    payload = verify_token(refresh_tok, expected_type="refresh") or {}
    fam_id = payload.get("fam") or str(uuid.uuid4())
    exp_ts = payload.get("exp")
    expires_at = (
        datetime.fromtimestamp(exp_ts, tz=timezone.utc)
        if exp_ts
        else (datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS))
    )

    session = RefreshTokenSession(
        user_id=user.id,
        token_hash=hash_token(refresh_tok),
        family_id=fam_id,
        is_revoked=False,
        expires_at=expires_at,
    )
    db.add(session)
    await db.flush()

    response.set_cookie(
        "access_token",
        access_tok,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/api",
    )
    response.set_cookie(
        "refresh_token",
        refresh_tok,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path="/api/auth",
    )
    return access_tok, refresh_tok


def _clear_session_cookies(response: Response) -> None:
    response.delete_cookie("access_token", path="/api", secure=settings.COOKIE_SECURE, samesite="lax")
    response.delete_cookie("refresh_token", path="/api/auth", secure=settings.COOKIE_SECURE, samesite="lax")


@router.post("/register", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit(settings.RATE_LIMIT_AUTH)
async def register(request: Request, payload: RegisterRequest, response: Response, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")
    user = User(
        email=payload.email,
        name=payload.name or payload.email.split("@")[0],
        hashed_password=await run_in_threadpool(get_password_hash, payload.password),
    )
    db.add(user)
    await db.flush()
    await _issue_session(response, user, db)
    return SessionResponse(user=_user_dict(user))


@router.post("/login", response_model=SessionResponse)
@limiter.limit(settings.RATE_LIMIT_AUTH)
async def login(request: Request, payload: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()
    if not user or not user.hashed_password or not await run_in_threadpool(verify_password, payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")
    user.last_login = datetime.now(timezone.utc)
    await _issue_session(response, user, db)
    return SessionResponse(user=_user_dict(user))


@router.post("/refresh", response_model=SessionResponse)
@limiter.limit(settings.RATE_LIMIT_AUTH)
async def refresh_tokens(request: Request, payload: RefreshRequest, response: Response, db: AsyncSession = Depends(get_db)):
    raw_token = payload.refresh_token or request.cookies.get("refresh_token", "")
    if not raw_token:
        raise HTTPException(status_code=401, detail="Refresh token required")

    token_payload = verify_token(raw_token, expected_type="refresh")
    if not token_payload:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    token_h = hash_token(raw_token)
    stmt = select(RefreshTokenSession).where(RefreshTokenSession.token_hash == token_h)
    result = await db.execute(stmt)
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=401, detail="Refresh token session not found")

    # Reuse detection: if this session was already revoked, revoke the entire token family!
    if session.is_revoked:
        logger.warning(
            "Revoked refresh token reuse detected! Revoking token family",
            family_id=session.family_id,
            user_id=session.user_id,
        )
        await db.execute(
            update(RefreshTokenSession)
            .where(RefreshTokenSession.family_id == session.family_id)
            .values(is_revoked=True, revoked_at=datetime.now(timezone.utc))
        )
        await db.commit()
        _clear_session_cookies(response)
        raise HTTPException(
            status_code=401,
            detail="Compromised session: refresh token reuse detected. Please sign in again.",
        )

    now = datetime.now(timezone.utc)
    expires_at = session.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at <= now:
        session.is_revoked = True
        session.revoked_at = now
        await db.flush()
        raise HTTPException(status_code=401, detail="Refresh token expired")

    user_result = await db.execute(select(User).where(User.id == session.user_id))
    user = user_result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    # Rotate: Revoke the current token and issue a new one in the same family
    session.is_revoked = True
    session.revoked_at = now
    await _issue_session(response, user, db, family_id=session.family_id)
    return SessionResponse(user=_user_dict(user))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    request: Request,
    response: Response,
    payload: Optional[RefreshRequest] = None,
    db: AsyncSession = Depends(get_db),
) -> None:
    raw_token = (payload and payload.refresh_token) or request.cookies.get("refresh_token", "")
    if raw_token:
        token_h = hash_token(raw_token)
        result = await db.execute(select(RefreshTokenSession).where(RefreshTokenSession.token_hash == token_h))
        session = result.scalar_one_or_none()
        if session and not session.is_revoked:
            session.is_revoked = True
            session.revoked_at = datetime.now(timezone.utc)
            await db.flush()
    _clear_session_cookies(response)


@router.get("/me", response_model=SessionResponse)
async def current_session(user: User = Depends(get_current_user)):
    return SessionResponse(user=_user_dict(user))