from datetime import datetime, timezone
from typing import Optional, Any
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, EmailStr, Field, field_validator
from pydantic_core import PydanticCustomError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models.user import User
from core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, verify_token
from config import settings
from dependencies import get_current_user
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


def _set_session_cookies(response: Response, user: User) -> None:
    response.set_cookie(
        "access_token", create_access_token({"sub": str(user.id)}), httponly=True,
        secure=settings.COOKIE_SECURE, samesite="lax", max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/api",
    )
    response.set_cookie(
        "refresh_token", create_refresh_token({"sub": str(user.id)}), httponly=True,
        secure=settings.COOKIE_SECURE, samesite="lax", max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path="/api/auth",
    )


def _clear_session_cookies(response: Response) -> None:
    response.delete_cookie("access_token", path="/api", secure=settings.COOKIE_SECURE, samesite="lax")
    response.delete_cookie("refresh_token", path="/api/auth", secure=settings.COOKIE_SECURE, samesite="lax")


@router.post("/register", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest, response: Response, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == request.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")
    user = User(
        email=request.email,
        name=request.name or request.email.split("@")[0],
        hashed_password=get_password_hash(request.password),
    )
    db.add(user)
    await db.flush()
    _set_session_cookies(response, user)
    return SessionResponse(user=_user_dict(user))


@router.post("/login", response_model=SessionResponse)
async def login(request: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()
    if not user or not user.hashed_password or not verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")
    user.last_login = datetime.now(timezone.utc)
    _set_session_cookies(response, user)
    return SessionResponse(user=_user_dict(user))


@router.post("/refresh", response_model=SessionResponse)
async def refresh_tokens(request: RefreshRequest, response: Response, http_request: Request, db: AsyncSession = Depends(get_db)):
    payload = verify_token(request.refresh_token or http_request.cookies.get("refresh_token", ""), expected_type="refresh")
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    result = await db.execute(select(User).where(User.id == int(payload["sub"])))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found")
    _set_session_cookies(response, user)
    return SessionResponse(user=_user_dict(user))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(response: Response) -> None:
    _clear_session_cookies(response)


@router.get("/me", response_model=SessionResponse)
async def current_session(user: User = Depends(get_current_user)):
    return SessionResponse(user=_user_dict(user))


