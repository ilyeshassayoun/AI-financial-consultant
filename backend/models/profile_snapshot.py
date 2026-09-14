from datetime import datetime
from typing import Any
from sqlalchemy import String, DateTime, Integer, ForeignKey, func, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class ProfileSnapshot(Base):
    __tablename__ = "profile_snapshots"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False, default="My Profile")
    profile_json: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="profiles")
    events = relationship("ProfileEvent", back_populates="profile", cascade="all, delete-orphan", order_by="ProfileEvent.sequence_number")
