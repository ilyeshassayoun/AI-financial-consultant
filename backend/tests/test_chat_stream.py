"""Automated integration tests for Server-Sent Events (SSE) AI advisory streaming (R2).

Validates chunked transfer encoding, anti-buffering transport headers, token typewriter
streaming, interleaved structured function events, and deterministic offline fallback.
"""

import json
import pytest
from fastapi.testclient import TestClient
from main import app
from schemas import ClientProfile, ChatRequest
from llm_service import ChatMessage
from dependencies import require_llm_access
from config import settings

client = TestClient(app)


@pytest.fixture(autouse=True)
def override_llm_auth():
    app.dependency_overrides[require_llm_access] = lambda: object()
    yield
    app.dependency_overrides.pop(require_llm_access, None)


def test_chat_stream_unauthorized_when_key_invalid():
    """Verify missing/invalid X-API-Key returns HTTP 401 when LLM_ACCESS_KEY is enforced."""
    orig = settings.LLM_ACCESS_KEY
    try:
        settings.LLM_ACCESS_KEY = "test-secret-key-999"
        app.dependency_overrides.pop(require_llm_access, None)
        resp = client.post("/api/chat/stream", json={"profile": {"income": 50000}, "messages": []})
        assert resp.status_code == 401
    finally:
        settings.LLM_ACCESS_KEY = orig
        app.dependency_overrides[require_llm_access] = lambda: object()


def test_chat_stream_headers_and_anti_buffering():
    """Verify POST /api/chat/stream returns standard SSE media type and anti-buffering headers."""
    payload = {
        "profile": {
            "income": 65000,
            "age": 34,
            "current_savings": 25000,
            "monthly_investment": 600,
            "living_expenses": 2200,
            "tax_class": 1,
            "is_married": False,
            "num_children": 0,
        },
        "messages": [
            {"role": "user", "content": "How can I optimize my statutory Rentenlücke?"}
        ],
    }

    with client.stream("POST", "/api/chat/stream", json=payload) as response:
        assert response.status_code == 200
        content_type = response.headers.get("content-type", "")
        assert "text/event-stream" in content_type
        assert response.headers.get("cache-control") == "no-cache, no-transform"
        assert response.headers.get("x-accel-buffering") == "no"
        assert response.headers.get("connection") == "keep-alive"


def test_chat_stream_emits_tokens_and_structured_function_events():
    """Verify stream yields tokens interleaved with structured UI events (highlight_metric, delta_badge, patch_proposal)."""
    payload = {
        "profile": {
            "income": 70000,
            "age": 38,
            "current_savings": 30000,
            "monthly_investment": 500,
            "living_expenses": 2500,
            "tax_class": 1,
            "is_married": False,
            "num_children": 0,
        },
        "messages": [
            {"role": "user", "content": "Explain my statutory pension gap and tax progression zone under § 32a EStG"}
        ],
    }

    events_received = []
    tokens_received = []
    has_done_marker = False

    with client.stream("POST", "/api/chat/stream", json=payload) as response:
        assert response.status_code == 200
        # Iterate over SSE blocks separated by \n\n
        for line in response.iter_lines():
            if not line:
                continue
            line_str = line if isinstance(line, str) else line.decode("utf-8")
            if line_str.startswith("data: [DONE]"):
                has_done_marker = True
                continue

            if line_str.startswith("data: "):
                raw_json = line_str[6:].strip()
                try:
                    parsed = json.loads(raw_json)
                    if "token" in parsed and "event" not in parsed:
                        tokens_received.append(parsed["token"])
                    elif "event" in parsed:
                        events_received.append(parsed)
                        if parsed["event"] == "token":
                            tokens_received.append(parsed.get("token", ""))
                except Exception:
                    pass

    # Assertions
    assert len(tokens_received) > 0, "Expected typewriter tokens in stream"
    assert has_done_marker, "Stream must terminate with [DONE] marker"

    event_types = [ev["event"] for ev in events_received]
    assert "highlight_metric" in event_types, "Stream must emit highlight_metric event"
    assert "statutory_citation" in event_types, "Stream must emit statutory_citation event"
    assert "patch_proposal" in event_types, "Stream must emit patch_proposal event"
    assert "delta_badge" in event_types, "Stream must emit delta_badge event"
    assert "done" in event_types, "Stream must emit done summary event"

    # Validate highlight_metric payload
    hl_event = next(ev for ev in events_received if ev["event"] == "highlight_metric")
    data = hl_event.get("data", hl_event)
    assert data["target"] == "pension_gap"
    assert data["severity"] in ("warning", "info", "danger")

    # Validate patch_proposal payload
    patch_event = next(ev for ev in events_received if ev["event"] == "patch_proposal")
    patch_data = patch_event.get("data", patch_event)
    assert "patch" in patch_data
    assert "impact" in patch_data


def test_chat_stream_offline_deterministic_fallback():
    """Verify stream succeeds reliably and deterministically without external LLM API keys."""
    import os
    orig_key = os.environ.get("GROQ_API_KEY")
    try:
        os.environ.pop("GROQ_API_KEY", None)
        payload = {
            "profile": {
                "income": 50000,
                "age": 30,
                "current_savings": 10000,
                "monthly_investment": 300,
            },
            "messages": [{"role": "user", "content": "How do I start investing?"}],
        }
        resp = client.post("/api/chat/stream", json=payload)
        assert resp.status_code == 200
        assert "text/event-stream" in resp.headers["content-type"]
        body = resp.text
        assert "data: [DONE]" in body
        assert "highlight_metric" in body
        assert "statutory_citation" in body
    finally:
        if orig_key is not None:
            os.environ["GROQ_API_KEY"] = orig_key
