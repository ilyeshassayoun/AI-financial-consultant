from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Header, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models.user import User
from models.profile_snapshot import ProfileSnapshot
from core.security import verify_token

router = APIRouter(prefix="/api/profiles", tags=["profiles"])


class ProfileSaveRequest(BaseModel):
    name: str = "My Profile"
    profile: dict[str, Any]


class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    profile: Optional[dict[str, Any]] = None


async def get_current_user(authorization: Optional[str] = Header(default=None), db: AsyncSession = Depends(get_db)) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization required")
    payload = verify_token(authorization[7:], expected_type="access")
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    result = await db.execute(select(User).where(User.id == int(payload["sub"]), User.is_active == True))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@router.get("/")
async def list_profiles(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ProfileSnapshot).where(ProfileSnapshot.user_id == user.id).order_by(ProfileSnapshot.updated_at.desc()))
    return [{"id": s.id, "name": s.name, "created_at": s.created_at.isoformat(), "updated_at": s.updated_at.isoformat()} for s in result.scalars().all()]


@router.get("/{profile_id}")
async def get_profile(profile_id: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ProfileSnapshot).where(ProfileSnapshot.id == profile_id, ProfileSnapshot.user_id == user.id))
    snap = result.scalar_one_or_none()
    if not snap:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {"id": snap.id, "name": snap.name, "profile": snap.profile_json, "created_at": snap.created_at.isoformat(), "updated_at": snap.updated_at.isoformat()}


@router.post("/", status_code=status.HTTP_201_CREATED)
async def save_profile(request: ProfileSaveRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    snap = ProfileSnapshot(user_id=user.id, name=request.name, profile_json=request.profile)
    db.add(snap)
    await db.flush()
    return {"id": snap.id, "name": snap.name, "message": "Profile saved"}


@router.put("/{profile_id}")
async def update_profile(profile_id: int, request: ProfileUpdateRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ProfileSnapshot).where(ProfileSnapshot.id == profile_id, ProfileSnapshot.user_id == user.id))
    snap = result.scalar_one_or_none()
    if not snap:
        raise HTTPException(status_code=404, detail="Profile not found")
    if request.name is not None:
        snap.name = request.name
    if request.profile is not None:
        snap.profile_json = request.profile
    return {"id": snap.id, "name": snap.name, "message": "Profile updated"}


@router.delete("/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_profile(profile_id: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ProfileSnapshot).where(ProfileSnapshot.id == profile_id, ProfileSnapshot.user_id == user.id))
    snap = result.scalar_one_or_none()
    if not snap:
        raise HTTPException(status_code=404, detail="Profile not found")
    await db.delete(snap)
