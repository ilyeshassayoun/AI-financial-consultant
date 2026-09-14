"""SQLAlchemy model for immutable profile audit events."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional
from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class ProfileEvent(Base):
    __tablename__ = "profile_events"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    profile_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("profile_snapshots.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    sequence_number: Mapped[int] = mapped_column(Integer, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    event_type: Mapped[str] = mapped_column(String(64), nullable=False)
    delta_payload: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    snapshot_checksum: Mapped[str] = mapped_column(String(64), nullable=False)
    metadata_json: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON, nullable=True)

    __table_args__ = (
        UniqueConstraint("profile_id", "sequence_number", name="uq_profile_event_seq"),
    )

    profile = relationship("ProfileSnapshot", back_populates="events")
