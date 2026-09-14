"""Create immutable profile events for profile audit history.

Revision ID: 20260914_0003
Revises: 20260914_0002
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision: str = "20260914_0003"
down_revision: Union[str, None] = "20260914_0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    existing = set(inspect(op.get_bind()).get_table_names())
    if "profile_events" in existing:
        return

    op.create_table(
        "profile_events",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("profile_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("sequence_number", sa.Integer(), nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("event_type", sa.String(length=64), nullable=False),
        sa.Column("delta_payload", sa.JSON(), nullable=False),
        sa.Column("snapshot_checksum", sa.String(length=64), nullable=False),
        sa.Column("metadata_json", sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(["profile_id"], ["profile_snapshots.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("profile_id", "sequence_number", name="uq_profile_event_seq"),
    )
    op.create_index(op.f("ix_profile_events_profile_id"), "profile_events", ["profile_id"], unique=False)
    op.create_index(op.f("ix_profile_events_user_id"), "profile_events", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_profile_events_user_id"), table_name="profile_events")
    op.drop_index(op.f("ix_profile_events_profile_id"), table_name="profile_events")
    op.drop_table("profile_events")
