"""Automated test suite for Profile Event Sourcing and Temporal Replay (R3).

Validates pure state reducer mathematical properties, immutable sequence ordering,
temporal scrubbing replay without database head mutation, and deterministic checksums.
"""

import asyncio
import os
import sys
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from main import app
from database import Base, get_db
from models.profile_snapshot import ProfileSnapshot
from models.profile_event import ProfileEvent
from event_sourcing import (
    apply_profile_event,
    replay_profile_events,
    infer_event_type_and_delta,
    calculate_state_checksum,
)


def test_pure_reducer_profile_initialized():
    """Verify ProfileInitialized sets state identically to delta payload."""
    initial = {"income": 60000, "age": 32, "num_children": 0}
    state = apply_profile_event({}, "ProfileInitialized", initial)
    assert state == initial


def test_pure_reducer_semantic_transitions():
    """Verify pure state transitions for IncomeAdjusted, ChildAdded, PropertyPurchased."""
    s0 = {"income": 50000, "age": 30, "num_children": 0, "has_property": False}

    # 1. IncomeAdjusted
    s1 = apply_profile_event(s0, "IncomeAdjusted", {"income": 65000})
    assert s1["income"] == 65000
    assert s0["income"] == 50000  # Immutability: s0 unmodified

    # 2. ChildAdded
    s2 = apply_profile_event(s1, "ChildAdded", {"child_age": 1})
    assert s2["num_children"] == 1
    assert s2["children_under_25"] == 1
    assert s2["youngest_dependent_age"] == 1

    # 3. PropertyPurchased
    s3 = apply_profile_event(s2, "PropertyPurchased", {
        "property_price": 400000.0,
        "down_payment": 80000.0,
        "mortgage_rate": 0.035,
    })
    assert s3["has_property"] is True
    assert s3["property_price"] == 400000.0
    assert s3["property_down_payment"] == 80000.0


def test_deterministic_replay_and_checksum_invariance():
    """Verify replaying events yields bit-identical states and identical SHA-256 checksums."""
    events = [
        {"sequence_number": 1, "event_type": "ProfileInitialized", "delta_payload": {"income": 50000, "savings": 10000}},
        {"sequence_number": 2, "event_type": "IncomeAdjusted", "delta_payload": {"income": 62000}},
        {"sequence_number": 3, "event_type": "ExpenseAdjusted", "delta_payload": {"savings": 25000}},
        {"sequence_number": 4, "event_type": "GoalToggled", "delta_payload": {"retirement_age": 63}},
    ]

    # Replay all
    state_head = replay_profile_events(events)
    assert state_head["income"] == 62000
    assert state_head["savings"] == 25000
    assert state_head["retirement_age"] == 63

    checksum_1 = calculate_state_checksum(state_head)
    checksum_2 = calculate_state_checksum(state_head)
    assert checksum_1 == checksum_2
    assert len(checksum_1) == 64

    # Time-travel scrub to sequence 2
    state_v2 = replay_profile_events(events, target_sequence=2)
    assert state_v2["income"] == 62000
    assert state_v2["savings"] == 10000
    assert "retirement_age" not in state_v2


@pytest.fixture
def test_db_client(tmp_path):
    """Isolated database and TestClient fixture for event persistence testing."""
    db_file = tmp_path / "test_events.db"
    db_url = f"sqlite+aiosqlite:///{db_file.as_posix()}"
    engine = create_async_engine(db_url, connect_args={"check_same_thread": False})
    session_factory = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)

    async def init_tables():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    asyncio.run(init_tables())

    async def override_get_db():
        async with session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)

    yield client, session_factory

    app.dependency_overrides.pop(get_db, None)
    asyncio.run(engine.dispose())


def test_event_sourcing_api_lifecycle(test_db_client):
    """Verify saving/updating profile creates immutable events and allows non-mutating temporal replay."""
    client, session_factory = test_db_client

    # 1. Register test user
    reg = client.post(
        "/api/auth/register",
        json={"email": "events_user@example.com", "password": "SecurePassword2026!"},
    )
    assert reg.status_code == 201

    # 2. Save Initial Profile (Sequence 1)
    profile_payload = {
        "name": "Retirement Baseline",
        "profile": {
            "income": 60000,
            "age": 35,
            "current_savings": 20000,
            "monthly_investment": 500,
            "tax_class": 1,
            "is_married": False,
            "num_children": 0,
        },
    }
    save_resp = client.post("/api/profiles/", json=profile_payload)
    assert save_resp.status_code == 201
    profile_id = save_resp.json()["id"]

    # 3. Update Profile: Add child (Sequence 2)
    update_payload = {
        "profile": {
            "income": 60000,
            "age": 35,
            "current_savings": 20000,
            "monthly_investment": 500,
            "tax_class": 1,
            "is_married": False,
            "num_children": 1,
        }
    }
    upd_resp = client.put(f"/api/profiles/{profile_id}", json=update_payload)
    assert upd_resp.status_code == 200

    # 4. Update Profile: Increase income (Sequence 3)
    update_payload_2 = {
        "profile": {
            "income": 75000,
            "age": 36,
            "current_savings": 30000,
            "monthly_investment": 750,
            "tax_class": 1,
            "is_married": False,
            "num_children": 1,
        }
    }
    upd_resp_2 = client.put(f"/api/profiles/{profile_id}", json=update_payload_2)
    assert upd_resp_2.status_code == 200

    # 5. Retrieve Event Log
    events_resp = client.get(f"/api/profiles/{profile_id}/events")
    assert events_resp.status_code == 200
    events = events_resp.json()
    assert len(events) == 3
    assert events[0]["sequence_number"] == 1
    assert events[0]["event_type"] == "ProfileInitialized"
    assert events[1]["sequence_number"] == 2
    assert events[1]["event_type"] == "ChildAdded"
    assert events[2]["sequence_number"] == 3
    assert events[2]["event_type"] == "IncomeAdjusted"

    # 6. Temporal Replay to Sequence 1 (Time travel to before child and promotion)
    replay_resp = client.get(f"/api/profiles/{profile_id}/events/replay?target_version=1")
    assert replay_resp.status_code == 200
    rep_data = replay_resp.json()
    assert rep_data["target_sequence"] == 1
    assert rep_data["state"]["income"] == 60000
    assert rep_data["state"]["num_children"] == 0

    # 7. Verify Database Head was NOT mutated by time travel scrub
    head_resp = client.get(f"/api/profiles/{profile_id}")
    assert head_resp.status_code == 200
    head_data = head_resp.json()
    assert head_data["profile"]["income"] == 75000
    assert head_data["profile"]["num_children"] == 1
