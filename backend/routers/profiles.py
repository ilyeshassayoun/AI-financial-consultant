from typing import Optional, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models.profile_snapshot import ProfileSnapshot
from models.profile_event import ProfileEvent
from models.user import User
from dependencies import get_current_user
from schemas import ClientProfile
from event_sourcing import apply_profile_event, replay_profile_events, infer_event_type_and_delta, calculate_state_checksum

router = APIRouter(prefix="/api/profiles", tags=["profiles"])


class ProfileSaveRequest(BaseModel):
    name: str = Field(default="My Profile", min_length=1, max_length=200)
    profile: ClientProfile


class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    profile: Optional[ClientProfile] = None


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
    snap = ProfileSnapshot(user_id=user.id, name=request.name, profile_json=request.profile.model_dump())
    db.add(snap)
    await db.flush()

    # Record immutable initial event in event log
    init_event = ProfileEvent(
        profile_id=snap.id,
        user_id=user.id,
        sequence_number=1,
        event_type="ProfileInitialized",
        delta_payload=snap.profile_json,
        snapshot_checksum=calculate_state_checksum(snap.profile_json),
        metadata_json={"source": "save_profile", "name": snap.name},
    )
    db.add(init_event)
    await db.flush()

    return {"id": snap.id, "name": snap.name, "message": "Profile saved", "sequence_number": 1}


@router.put("/{profile_id}")
async def update_profile(profile_id: int, request: ProfileUpdateRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ProfileSnapshot).where(ProfileSnapshot.id == profile_id, ProfileSnapshot.user_id == user.id))
    snap = result.scalar_one_or_none()
    if not snap:
        raise HTTPException(status_code=404, detail="Profile not found")

    old_state = dict(snap.profile_json)
    if request.name is not None:
        snap.name = request.name
    if request.profile is not None:
        new_state = request.profile.model_dump()
        snap.profile_json = new_state

        # Determine next monotonic sequence number
        seq_res = await db.execute(
            select(func.max(ProfileEvent.sequence_number)).where(ProfileEvent.profile_id == profile_id)
        )
        max_seq = seq_res.scalar() or 0
        next_seq = max_seq + 1

        ev_type, delta = infer_event_type_and_delta(old_state, new_state)
        event = ProfileEvent(
            profile_id=snap.id,
            user_id=user.id,
            sequence_number=next_seq,
            event_type=ev_type,
            delta_payload=delta,
            snapshot_checksum=calculate_state_checksum(new_state),
            metadata_json={"source": "update_profile"},
        )
        db.add(event)
        await db.flush()

    return {"id": snap.id, "name": snap.name, "message": "Profile updated"}


@router.delete("/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_profile(profile_id: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ProfileSnapshot).where(ProfileSnapshot.id == profile_id, ProfileSnapshot.user_id == user.id))
    snap = result.scalar_one_or_none()
    if not snap:
        raise HTTPException(status_code=404, detail="Profile not found")
    await db.delete(snap)


@router.get("/{profile_id}/events")
async def get_profile_events(
    profile_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve immutable chronological event audit log for a profile."""
    p_res = await db.execute(
        select(ProfileSnapshot).where(ProfileSnapshot.id == profile_id, ProfileSnapshot.user_id == user.id)
    )
    snap = p_res.scalar_one_or_none()
    if not snap:
        raise HTTPException(status_code=404, detail="Profile not found")

    result = await db.execute(
        select(ProfileEvent)
        .where(ProfileEvent.profile_id == profile_id, ProfileEvent.user_id == user.id)
        .order_by(ProfileEvent.sequence_number.asc())
    )
    events = result.scalars().all()
    return [
        {
            "id": ev.id,
            "profile_id": ev.profile_id,
            "sequence_number": ev.sequence_number,
            "event_type": ev.event_type,
            "delta_payload": ev.delta_payload,
            "snapshot_checksum": ev.snapshot_checksum,
            "timestamp": ev.timestamp.isoformat() if ev.timestamp else None,
            "metadata": ev.metadata_json,
        }
        for ev in events
    ]


@router.get("/{profile_id}/events/replay")
@router.get("/{profile_id}/replay")
async def replay_profile(
    profile_id: int,
    target_version: Optional[int] = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Reconstruct historical profile state at target sequence number without mutating active head."""
    p_res = await db.execute(
        select(ProfileSnapshot).where(ProfileSnapshot.id == profile_id, ProfileSnapshot.user_id == user.id)
    )
    snap = p_res.scalar_one_or_none()
    if not snap:
        raise HTTPException(status_code=404, detail="Profile not found")

    result = await db.execute(
        select(ProfileEvent)
        .where(ProfileEvent.profile_id == profile_id, ProfileEvent.user_id == user.id)
        .order_by(ProfileEvent.sequence_number.asc())
    )
    events = result.scalars().all()

    if not events:
        reconstructed = snap.profile_json
        current_seq = 1
    else:
        reconstructed = replay_profile_events(events, target_sequence=target_version)
        current_seq = target_version if target_version is not None else max(ev.sequence_number for ev in events)

    preview_analysis = None
    try:
        from analysis import run_full_analysis
        from schemas import ClientProfile
        validated_profile = ClientProfile.model_validate(reconstructed)
        preview_analysis = run_full_analysis(validated_profile)
    except Exception:
        pass

    return {
        "profile_id": profile_id,
        "target_sequence": current_seq,
        "state": reconstructed,
        "checksum": calculate_state_checksum(reconstructed),
        "analysis": preview_analysis,
    }
