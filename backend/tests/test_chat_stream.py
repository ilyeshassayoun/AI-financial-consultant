"""Automated integration tests for Server-Sent Events (SSE) AI advisory streaming (R2).

Validates chunked transfer encoding, anti-buffering transport headers, token typewriter
streaming, interleaved structured function events, and deterministic offline fallback.
"""

import json
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_chat_stream_is_available_to_guest_sessions(monkeypatch):
    """The visible concierge must provide local guidance without a login or paid-model call."""
    monkeypatch.setenv("GROQ_API_KEY", "must-not-be-used-by-guests")
    payload = {
        "profile": {"income": 50000},
        "messages": [{"role": "user", "content": "How do I start investing?"}],
    }

    response = client.post("/api/chat/stream", json=payload)

    assert response.status_code == 200
    tokens = []
    for line in response.text.splitlines():
        if line.startswith("data: ") and line[6:] != "[DONE]":
            payload = json.loads(line[6:])
            if "token" in payload:
                tokens.append(payload["token"])
    answer = "".join(tokens)
    assert "Model-grounded explanation" in answer
    assert "Investments:" in answer
    assert "data: [DONE]" in response.text


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


def test_chat_stream_emits_tokens_citations_and_completion():
    """Guest streams contain grounded text and sources, without fabricated optimization events."""
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
    assert "statutory_citation" in event_types, "Stream must emit statutory_citation event"
    assert "done" in event_types, "Stream must emit done summary event"
    assert "patch_proposal" not in event_types
    assert "delta_badge" not in event_types


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
        assert "statutory_citation" in body
    finally:
        if orig_key is not None:
            os.environ["GROQ_API_KEY"] = orig_key
