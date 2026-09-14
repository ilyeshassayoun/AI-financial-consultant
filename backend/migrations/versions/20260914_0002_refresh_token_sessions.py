"""Create refresh token sessions table for token rotation and revocation.

Revision ID: 20260914_0002
Revises: 20260914_0001
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision: str = "20260914_0002"
down_revision: Union[str, None] = "20260914_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    existing = set(inspect(op.get_bind()).get_table_names())
    if "refresh_token_sessions" not in existing:
        op.create_table(
            "refresh_token_sessions",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("token_hash", sa.String(length=64), nullable=False),
            sa.Column("family_id", sa.String(length=64), nullable=False),
            sa.Column("is_revoked", sa.Boolean(), server_default=sa.false(), nullable=False),
            sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_refresh_token_sessions_user_id"), "refresh_token_sessions", ["user_id"], unique=False)
        op.create_index(op.f("ix_refresh_token_sessions_token_hash"), "refresh_token_sessions", ["token_hash"], unique=True)
        op.create_index(op.f("ix_refresh_token_sessions_family_id"), "refresh_token_sessions", ["family_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_refresh_token_sessions_family_id"), table_name="refresh_token_sessions")
    op.drop_index(op.f("ix_refresh_token_sessions_token_hash"), table_name="refresh_token_sessions")
    op.drop_index(op.f("ix_refresh_token_sessions_user_id"), table_name="refresh_token_sessions")
    op.drop_table("refresh_token_sessions")
