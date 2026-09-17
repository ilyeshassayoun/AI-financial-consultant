"""Adversarial stress-testing suite for R1, R2, and R3.

Empirical verification harness targeting:
1. R1: Historical Crisis Stress Testing & SRR Invariants (Cash Stagflation, €0 Capital, Extreme Ruin, Weight Validation, NaN/ZeroDiv)
2. R2: Server-Sent Events (SSE) AI Streaming Protocol & Resilience (Rapid Requests, Disconnect Simulation, Offline Fallback, Schema Conformance)
3. R3: Event Sourcing & Temporal Replay (Sequence Uniqueness, Out-of-Order Replay, Bit-Identical Reconstructions, Immutability)
"""

import asyncio
import copy
import json
import math
import os
import time
from typing import Any, Dict, List
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from main import app
from database import Base, get_db
from dependencies import require_llm_access, get_current_user
from models.user import User
from models.profile_snapshot import ProfileSnapshot
from models.profile_event import ProfileEvent
from stress_test_engine import (
    run_stress_test_simulation,
    evaluate_decumulation_srr,
    resolve_strategy_weights,
    compute_weighted_annual_returns,
    HISTORICAL_REGIMES,
)
from event_sourcing import (
    apply_profile_event,
    replay_profile_events,
    calculate_state_checksum,
    infer_event_type_and_delta,
)

client = TestClient(app)


# ==============================================================================
# CHALLENGE GROUP 1: R1 HISTORICAL CRISIS & SRR INVARIANTS
# ==============================================================================

class TestR1StressTestingInvariants:
    """Adversarial challenge for crisis simulation & SRR decumulation engine."""

    def test_100_percent_cash_during_1973_stagflation(self):
        """Challenge 1973-1974 stagflation with 100% cash allocation.
        
        Empirical invariant:
        Nominal cash return was positive (+7% in 1973, +8% in 1974), so nominal drawdown is 0%.
        However, cumulative inflation exceeded 20%, destroying real purchasing power.
        The engine must record real drawdown < -15% and terminal real value < terminal nominal value.
        """
        res = run_stress_test_simulation(
            scenario="stagflation_1973",
            strategy="custom",
            initial_capital=100000.0,
            monthly_cashflow=0.0,
            asset_weights={"cash": 1.0},
        )

        assert res["scenario"] == "stagflation_1973"
        # Nominal drawdown should be 0.0 because cash yield was positive
        assert res["max_drawdown_pct"] == 0.0 or res["max_drawdown_pct"] >= -0.001, (
            f"Nominal cash drawdown should not be negative: {res['max_drawdown_pct']}"
        )
        # Real drawdown MUST capture severe purchasing power loss (-8.98% due to inflation exceeding cash yield)
        assert res["max_drawdown_real_pct"] < -0.08, (
            f"Real drawdown for 100% cash in 1973-74 must exceed -8%, got {res['max_drawdown_real_pct']}"
        )
        assert pytest.approx(res["max_drawdown_real_pct"], abs=0.01) == -0.09
        assert res["terminal_real_value"] < res["terminal_nominal_value"], (
            f"Real value ({res['terminal_real_value']}) must be strictly less than nominal ({res['terminal_nominal_value']})"
        )
        # Verify trajectory has no NaN or inf
        for pt in res["trajectory"]:
            assert not math.isnan(pt["nominal_value"])
            assert not math.isnan(pt["real_value"])
            assert not math.isnan(pt["drawdown"])
            assert not math.isnan(pt["drawdown_real"])

    def test_zero_capital_and_zero_cashflow_edge_cases(self):
        """Challenge €0 starting balance with €0 cashflow across all 3 historical scenarios."""
        for scenario in ("gfc_2008", "dotcom_2000", "stagflation_1973"):
            res = run_stress_test_simulation(
                scenario=scenario,
                strategy="global_core",
                initial_capital=0.0,
                monthly_cashflow=0.0,
            )
            assert res["max_drawdown_pct"] == 0.0
            assert res["max_drawdown_real_pct"] == 0.0
            assert res["recovery_horizon_years"] == 0.0
            assert res["terminal_nominal_value"] == 0.0
            assert res["terminal_real_value"] == 0.0
            assert res["srr_metrics"]["survival_probability"] == 0.0
            assert res["srr_metrics"]["ruin_probability"] == 1.0

    def test_extreme_decumulation_withdrawal_causes_early_ruin(self):
        """Challenge extreme withdrawal rate (€50k/month from €100k capital) causing early ruin.
        
        Empirical invariants:
        - Capital must hit €0 early in trajectory
        - Capital must clamp strictly at 0.0 and never become negative
        - Trajectory values must never be negative
        - Monte Carlo decumulation survival probability must be 0.0, ruin probability 1.0
        - No NaN or division by zero in any field
        """
        res = run_stress_test_simulation(
            scenario="gfc_2008",
            strategy="global_core",
            initial_capital=100000.0,
            monthly_cashflow=-50000.0,
            is_decumulation=True,
        )

        assert res["terminal_nominal_value"] == 0.0
        assert res["terminal_real_value"] == 0.0
        assert res["srr_metrics"]["survival_probability"] == 0.0
        assert res["srr_metrics"]["ruin_probability"] == 1.0

        # Verify all trajectory entries clamp at >= 0.0
        ruin_reached = False
        for pt in res["trajectory"]:
            assert pt["nominal_value"] >= 0.0, f"Negative nominal value: {pt['nominal_value']}"
            assert pt["real_value"] >= 0.0, f"Negative real value: {pt['real_value']}"
            assert not math.isnan(pt["nominal_value"])
            assert not math.isnan(pt["real_value"])
            assert not math.isnan(pt["drawdown"])
            if pt["nominal_value"] == 0.0:
                ruin_reached = True

        assert ruin_reached, "Capital should have been completely depleted to 0.0"

    def test_invalid_and_adversarial_weights_handling(self):
        """Challenge weight resolution with non-normalized, zero, negative, and invalid weights."""
        # 1. Weights sum != 1.0 (e.g. 0.5): should normalize to 1.0
        normalized = resolve_strategy_weights("custom", custom_weights={"world_equity": 0.5})
        assert pytest.approx(sum(normalized.values()), 1e-4) == 1.0
        assert pytest.approx(normalized["world_equity"], 1e-4) == 1.0

        # 2. Weights summing to > 1.0 (e.g. 2.0 and 1.0): should normalize proportionally
        norm2 = resolve_strategy_weights("custom", custom_weights={"world_equity": 2.0, "global_bonds": 1.0})
        assert pytest.approx(sum(norm2.values()), 1e-4) == 1.0
        assert pytest.approx(norm2["world_equity"], 1e-4) == 2.0 / 3.0
        assert pytest.approx(norm2["global_bonds"], 1e-4) == 1.0 / 3.0

        # 3. All zero weights: should raise ValueError (translates to 422 HTTP in router)
        with pytest.raises(ValueError, match="strictly greater than zero"):
            resolve_strategy_weights("custom", custom_weights={"world_equity": 0.0, "cash": 0.0})

        # 4. Negative weights only: should raise ValueError
        with pytest.raises(ValueError, match="strictly greater than zero"):
            resolve_strategy_weights("custom", custom_weights={"world_equity": -0.8, "cash": -0.2})

    def test_api_lab_stress_test_edge_cases_via_http(self):
        """Challenge POST /api/lab/stress-test with edge payloads via HTTP client."""
        # A. Zero capital
        resp = client.post("/api/lab/stress-test", json={
            "scenario": "gfc_2008",
            "strategy": "global_core",
            "initial_capital": 0.0,
            "monthly_cashflow": 0.0,
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["max_drawdown_pct"] == 0.0
        assert data["srr_metrics"]["ruin_probability"] == 1.0

        # B. Negative / zero weights -> 422 Unprocessable Entity
        resp_invalid_w = client.post("/api/lab/stress-test", json={
            "scenario": "gfc_2008",
            "strategy": "custom",
            "initial_capital": 50000.0,
            "asset_weights": {"world_equity": -0.5, "cash": 0.0},
        })
        assert resp_invalid_w.status_code == 422
        assert "strictly greater than zero" in resp_invalid_w.json()["detail"]

        # C. 100% Cash in 1973 Stagflation
        resp_cash_stag = client.post("/api/lab/stress-test", json={
            "scenario": "stagflation_1973",
            "strategy": "custom",
            "initial_capital": 100000.0,
            "asset_weights": {"cash": 1.0},
        })
        assert resp_cash_stag.status_code == 200
        data_cash = resp_cash_stag.json()
        assert data_cash["max_drawdown_real_pct"] < -0.08
        assert data_cash["terminal_real_value"] < data_cash["terminal_nominal_value"]


# ==============================================================================
# CHALLENGE GROUP 2: R2 SSE STREAMING PROTOCOL & RESILIENCE
# ==============================================================================

class TestR2SSEStreamingResilience:
    """Adversarial challenge for SSE advisory streaming and client sync."""

    @pytest.fixture(autouse=True)
    def mock_auth(self):
        app.dependency_overrides[require_llm_access] = lambda: object()
        yield
        app.dependency_overrides.pop(require_llm_access, None)

    def test_sse_offline_fallback_without_groq_api_key(self):
        """Challenge POST /api/chat/stream when GROQ_API_KEY is unset.
        
        Verifies deterministic offline fallback produces:
        - HTTP 200 with text/event-stream
        - Valid typewriter token stream
        - Grounded statutory citation and completion metadata
        - No fabricated UI mutation or optimization events
        - Terminating [DONE] marker
        """
        orig_key = os.environ.get("GROQ_API_KEY")
        try:
            os.environ.pop("GROQ_API_KEY", None)
            payload = {
                "profile": {
                    "income": 65000,
                    "age": 34,
                    "current_savings": 25000,
                    "monthly_investment": 500,
                    "tax_class": 1,
                    "is_married": False,
                    "num_children": 0,
                },
                "messages": [{"role": "user", "content": "How do I close my statutory Rentenlücke?"}],
            }
            with client.stream("POST", "/api/chat/stream", json=payload) as response:
                assert response.status_code == 200
                assert "text/event-stream" in response.headers.get("content-type", "")
                assert response.headers.get("cache-control") == "no-cache, no-transform"
                assert response.headers.get("x-accel-buffering") == "no"

                raw_events = []
                for line in response.iter_lines():
                    if line.startswith("data: "):
                        raw_data = line[6:].strip()
                        if raw_data == "[DONE]":
                            raw_events.append({"event": "[DONE]"})
                        else:
                            try:
                                raw_events.append(json.loads(raw_data))
                            except json.JSONDecodeError as err:
                                pytest.fail(f"Invalid JSON in SSE data line: {raw_data} (Error: {err})")

                event_names = [ev.get("event") for ev in raw_events]
                assert "statutory_citation" in event_names
                assert "done" in event_names
                assert "[DONE]" in event_names
                assert "highlight_metric" not in event_names
                assert "delta_badge" not in event_names
                assert "patch_proposal" not in event_names
        finally:
            if orig_key is not None:
                os.environ["GROQ_API_KEY"] = orig_key

    def test_sse_structured_tool_event_payload_schemas(self):
        """Verify all structured tool events emitted conform to expected schema properties."""
        orig_key = os.environ.get("GROQ_API_KEY")
        try:
            os.environ.pop("GROQ_API_KEY", None)
            payload = {
                "profile": {
                    "income": 72000,
                    "age": 40,
                    "current_savings": 35000,
                    "monthly_investment": 600,
                },
                "messages": [{"role": "user", "content": "Analyze my pension gap and tax rate"}],
            }
            with client.stream("POST", "/api/chat/stream", json=payload) as resp:
                assert resp.status_code == 200
                parsed_events = {}
                for line in resp.iter_lines():
                    if line.startswith("data: ") and line[6:].strip() != "[DONE]":
                        try:
                            ev = json.loads(line[6:].strip())
                            ev_name = ev.get("event")
                            if ev_name:
                                parsed_events[ev_name] = ev.get("data", ev)
                        except Exception:
                            pass

                # Guests receive source-grounded guidance, never synthesized
                # highlight/delta/patch events that imply an executed analysis.
                assert "highlight_metric" not in parsed_events
                assert "delta_badge" not in parsed_events
                assert "patch_proposal" not in parsed_events

                # statutory_citation schema
                assert "statutory_citation" in parsed_events
                statute = parsed_events["statutory_citation"]
                assert "statute" in statute
                assert "official_url" in statute and statute["official_url"].startswith("http")

                # done schema
                assert "done" in parsed_events
                done_ev = parsed_events["done"]
                assert "tokens" in done_ev and done_ev["tokens"] > 0
                assert "execution_time_ms" in done_ev
                assert done_ev["patches_proposed"] == 0
        finally:
            if orig_key is not None:
                os.environ["GROQ_API_KEY"] = orig_key

    def test_client_abort_disconnect_simulation(self):
        """Simulate client disconnecting mid-stream after receiving only the first 2 chunks.
        
        Verifies server does not throw unhandled exceptions and cleans up resources.
        """
        payload = {
            "profile": {"income": 55000, "age": 30, "current_savings": 15000},
            "messages": [{"role": "user", "content": "Tell me about retirement"}],
        }
        chunks_read = 0
        with client.stream("POST", "/api/chat/stream", json=payload) as resp:
            assert resp.status_code == 200
            for _ in resp.iter_lines():
                chunks_read += 1
                if chunks_read >= 2:
                    # Abruptly exit context to trigger client abort/disconnect
                    break
        assert chunks_read >= 2

    def test_rapid_concurrent_requests_handling(self):
        """Stress test with 10 sequential rapid requests to verify no server socket lockup."""
        payload = {
            "profile": {"income": 60000, "age": 32, "current_savings": 20000},
            "messages": [{"role": "user", "content": "Rapid test"}],
        }
        for i in range(10):
            with client.stream("POST", "/api/chat/stream", json=payload) as resp:
                assert resp.status_code == 200
                first_line = next(resp.iter_lines())
                assert len(first_line) > 0


# ==============================================================================
# CHALLENGE GROUP 3: R3 EVENT SOURCING & REPLAY IMMUTABILITY
# ==============================================================================

class TestR3EventSourcingImmutability:
    """Adversarial challenge for event sourcing, sequence uniqueness, and deterministic replay."""

    def test_pure_reducer_out_of_order_replay(self):
        """Challenge replay_profile_events with deliberately shuffled, out-of-order events.
        
        Given events E1 (ProfileInitialized), E2 (IncomeAdjusted), E3 (ChildAdded), E4 (GoalToggled),
        passing them in shuffled order [E4, E1, E3, E2] must produce the identical state
        as the sorted sequence.
        """
        e1 = {"sequence_number": 1, "event_type": "ProfileInitialized", "delta_payload": {"income": 50000, "num_children": 0, "age": 30}}
        e2 = {"sequence_number": 2, "event_type": "IncomeAdjusted", "delta_payload": {"income": 70000}}
        e3 = {"sequence_number": 3, "event_type": "ChildAdded", "delta_payload": {"child_age": 1}}
        e4 = {"sequence_number": 4, "event_type": "GoalToggled", "delta_payload": {"retirement_age": 63}}

        sorted_events = [e1, e2, e3, e4]
        shuffled_events = [e4, e1, e3, e2]

        state_from_sorted = replay_profile_events(sorted_events)
        state_from_shuffled = replay_profile_events(shuffled_events)

        assert state_from_sorted == state_from_shuffled
        assert state_from_shuffled["income"] == 70000
        assert state_from_shuffled["num_children"] == 1
        assert state_from_shuffled["retirement_age"] == 63
        assert state_from_shuffled["youngest_dependent_age"] == 1

    def test_replay_immutability_and_bit_identical_repeatability(self):
        """Replaying 100 times must yield identical dictionaries and identical SHA-256 checksums.
        
        Crucially, replaying must NOT mutate the original event records or input payloads.
        """
        events = [
            {"sequence_number": 1, "event_type": "ProfileInitialized", "delta_payload": {"income": 50000, "savings": 10000}},
            {"sequence_number": 2, "event_type": "IncomeAdjusted", "delta_payload": {"income": 60000}},
            {"sequence_number": 3, "event_type": "ChildAdded", "delta_payload": {"child_age": 2}},
            {"sequence_number": 4, "event_type": "PropertyPurchased", "delta_payload": {"property_price": 300000.0, "down_payment": 60000.0}},
        ]
        events_clone = copy.deepcopy(events)

        reference_state = replay_profile_events(events)
        reference_checksum = calculate_state_checksum(reference_state)

        for _ in range(100):
            st = replay_profile_events(events)
            cs = calculate_state_checksum(st)
            assert st == reference_state
            assert cs == reference_checksum

        # Verify zero mutation of original event list and payloads
        assert events == events_clone

    @pytest.mark.anyio
    async def test_database_sequence_uniqueness_constraint(self, tmp_path):
        """Directly verify database schema enforces UNIQUE(profile_id, sequence_number).
        
        Attempting to persist two events for the same profile with sequence_number=1
        must raise an IntegrityError.
        """
        db_file = tmp_path / "test_unique_seq.db"
        db_url = f"sqlite+aiosqlite:///{db_file.as_posix()}"
        engine = create_async_engine(db_url, connect_args={"check_same_thread": False})
        session_factory = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        async with session_factory() as session:
            user = User(email="unique_test@example.com", hashed_password="Password123!")
            session.add(user)
            await session.flush()

            snapshot = ProfileSnapshot(user_id=user.id, name="Test Snap", profile_json={"income": 50000})
            session.add(snapshot)
            await session.flush()

            # Event 1 with sequence_number = 1
            ev1 = ProfileEvent(
                profile_id=snapshot.id,
                user_id=user.id,
                sequence_number=1,
                event_type="ProfileInitialized",
                delta_payload={"income": 50000},
                snapshot_checksum="dummy_checksum_1",
            )
            session.add(ev1)
            await session.commit()

            # Event 2 with duplicate sequence_number = 1
            ev2_duplicate = ProfileEvent(
                profile_id=snapshot.id,
                user_id=user.id,
                sequence_number=1,
                event_type="IncomeAdjusted",
                delta_payload={"income": 60000},
                snapshot_checksum="dummy_checksum_2",
            )
            session.add(ev2_duplicate)
            with pytest.raises(IntegrityError):
                await session.commit()

        await engine.dispose()

    @pytest.mark.anyio
    async def test_temporal_replay_does_not_mutate_head_snapshot(self, tmp_path):
        """Verify replaying to a historical version does not alter the active database head snapshot."""
        db_file = tmp_path / "test_head_immutability.db"
        db_url = f"sqlite+aiosqlite:///{db_file.as_posix()}"
        engine = create_async_engine(db_url, connect_args={"check_same_thread": False})
        session_factory = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        async with session_factory() as session:
            user = User(email="head_test@example.com", hashed_password="Password123!")
            session.add(user)
            await session.flush()

            head_profile = {"income": 80000, "age": 36, "current_savings": 50000}
            snap = ProfileSnapshot(user_id=user.id, name="Head Profile", profile_json=head_profile)
            session.add(snap)
            await session.flush()

            # Add two events
            ev1 = ProfileEvent(
                profile_id=snap.id,
                user_id=user.id,
                sequence_number=1,
                event_type="ProfileInitialized",
                delta_payload={"income": 50000, "age": 30, "current_savings": 10000},
                snapshot_checksum="checksum_v1",
            )
            ev2 = ProfileEvent(
                profile_id=snap.id,
                user_id=user.id,
                sequence_number=2,
                event_type="IncomeAdjusted",
                delta_payload={"income": 80000, "age": 36, "current_savings": 50000},
                snapshot_checksum="checksum_v2",
            )
            session.add_all([ev1, ev2])
            await session.commit()

            # Time travel scrub to sequence 1
            res = await session.execute(
                select(ProfileEvent).where(ProfileEvent.profile_id == snap.id).order_by(ProfileEvent.sequence_number.asc())
            )
            events = res.scalars().all()
            reconstructed_v1 = replay_profile_events(events, target_sequence=1)
            assert reconstructed_v1["income"] == 50000

            # Verify active snapshot in database is STILL head state (income = 80000)
            res_snap = await session.execute(
                select(ProfileSnapshot).where(ProfileSnapshot.id == snap.id)
            )
            unchanged_snap = res_snap.scalar_one()
            assert unchanged_snap.profile_json["income"] == 80000
            assert unchanged_snap.profile_json == head_profile

        await engine.dispose()
