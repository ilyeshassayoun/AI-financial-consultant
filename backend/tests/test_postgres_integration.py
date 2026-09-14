"""PostgreSQL-only integration checks for constraints used in production."""

import json
import os
from uuid import uuid4

import asyncpg
import pytest


POSTGRES_URL = os.getenv("TEST_POSTGRES_URL")


@pytest.mark.asyncio
@pytest.mark.skipif(not POSTGRES_URL, reason="TEST_POSTGRES_URL is not configured")
async def test_profile_event_sequence_is_unique_and_cascades_on_profile_delete():
    connection = await asyncpg.connect(POSTGRES_URL)
    transaction = connection.transaction()
    await transaction.start()
    try:
        user_id = await connection.fetchval(
            """
            INSERT INTO users (email, is_active, is_verified)
            VALUES ($1, TRUE, FALSE)
            RETURNING id
            """,
            f"integration-{uuid4()}@example.test",
        )
        profile_id = await connection.fetchval(
            """
            INSERT INTO profile_snapshots (user_id, name, profile_json)
            VALUES ($1, $2, $3::json)
            RETURNING id
            """,
            user_id,
            "Integration profile",
            json.dumps({"income": 60_000}),
        )

        insert_event = """
            INSERT INTO profile_events (
                profile_id, user_id, sequence_number, event_type,
                delta_payload, snapshot_checksum
            ) VALUES ($1, $2, 1, 'profile.updated', $3::json, $4)
        """
        await connection.execute(
            insert_event,
            profile_id,
            user_id,
            json.dumps({"income": 65_000}),
            "a" * 64,
        )

        with pytest.raises(asyncpg.UniqueViolationError):
            async with connection.transaction():
                await connection.execute(
                    insert_event,
                    profile_id,
                    user_id,
                    json.dumps({"income": 70_000}),
                    "b" * 64,
                )

        await connection.execute("DELETE FROM profile_snapshots WHERE id = $1", profile_id)
        remaining = await connection.fetchval(
            "SELECT COUNT(*) FROM profile_events WHERE profile_id = $1",
            profile_id,
        )
        assert remaining == 0
    finally:
        await transaction.rollback()
        await connection.close()
