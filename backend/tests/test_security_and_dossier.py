"""Automated test suite for Cryptographic Verification and Security Hardening (R5).

Validates RFC 8785 canonical JSON serialization, SHA-256 audit dossier tamper detection,
enterprise OWASP security headers, and RFC rate-limiting headers.
"""

import hashlib
import json
import math
import pytest
from fastapi.testclient import TestClient
from main import app
from canonical_hasher import canonicalize_json_bytes, canonical_sha256

client = TestClient(app)


def test_rfc_8785_canonical_json_serializer_properties():
    """Verify lexicographical key sorting, zero whitespace, and direct UTF-8 representation."""
    # Unordered dict
    payload = {"z": 1, "a": 2, "m": {"b": 3, "a": 4}}
    canonical_bytes = canonicalize_json_bytes(payload)

    # Must be sorted keys with no whitespace
    assert canonical_bytes == b'{"a":2,"m":{"a":4,"b":3},"z":1}'

    # Unicode characters are preserved directly in UTF-8 without \u escapes
    unicode_payload = {"name": "Jürgen Müller", "city": "München"}
    u_bytes = canonicalize_json_bytes(unicode_payload)
    assert "Jürgen Müller".encode("utf-8") in u_bytes
    assert b"\\u" not in u_bytes


def test_rfc_8785_rejects_non_finite_floats():
    """Verify NaN and Infinity values raise ValueError per RFC 8785 specification."""
    with pytest.raises(ValueError):
        canonicalize_json_bytes({"invalid": float("nan")})

    with pytest.raises(ValueError):
        canonicalize_json_bytes({"invalid": float("inf")})


def test_audit_dossier_tamper_evident_checksum():
    """Verify SHA-256 checksum is bit-identical and catches single-character tampering."""
    profile_payload = {
        "income": 65000,
        "age": 32,
        "current_savings": 15000,
        "monthly_investment": 500,
    }

    resp = client.post("/api/audit/dossier", json=profile_payload)
    assert resp.status_code == 200
    data = resp.json()

    assert "checksum" in data
    assert data["algorithm"] == "SHA-256 (RFC 8785)"
    assert "statutory_citations" in data
    assert "attachment" in resp.headers.get("content-disposition", "")

    # Verify checksum independently over the dossier payload
    dossier = data["dossier"]
    computed_hash, _ = canonical_sha256(dossier)
    assert computed_hash == data["checksum"]

    # Tamper detection: change a single number in the dossier
    tampered_dossier = json.loads(json.dumps(dossier))
    tampered_dossier["statutory_outputs"]["tax"]["net_income"] += 1.0
    tampered_hash, _ = canonical_sha256(tampered_dossier)
    assert tampered_hash != data["checksum"], "Tampering must invalidate cryptographic checksum"


def test_enterprise_owasp_security_headers_enforcement():
    """Verify OWASP security headers (CSP, HSTS, Frame-Options, nosniff) are enforced on responses."""
    resp = client.get("/openapi.json")
    assert resp.status_code == 200

    headers = resp.headers
    # Content-Security-Policy
    csp = headers.get("content-security-policy", "")
    assert "default-src 'self'" in csp
    assert "frame-ancestors 'none'" in csp

    # Strict-Transport-Security
    hsts = headers.get("strict-transport-security", "")
    assert "max-age=31536000" in hsts

    # Frame and Type options
    assert headers.get("x-frame-options") == "DENY"
    assert headers.get("x-content-type-options") == "nosniff"
    assert "strict-origin-when-cross-origin" in headers.get("referrer-policy", "")
    assert "camera=()" in headers.get("permissions-policy", "")


def test_rfc_rate_limiting_headers_injected():
    """Verify RFC compliant rate-limiting headers are present on responses."""
    resp = client.get("/api/health")
    assert resp.status_code == 200

    assert "ratelimit-limit" in resp.headers or "x-ratelimit-limit" in resp.headers
    assert "ratelimit-remaining" in resp.headers or "x-ratelimit-remaining" in resp.headers
    assert "ratelimit-reset" in resp.headers or "x-ratelimit-reset" in resp.headers


def test_rate_limit_exceeded_handler_rfc7807_and_headers():
    """Verify RFC 7807 Problem Details and Retry-After header on 429 rate limit exceeded."""
    profile_payload = {
        "income": 50000,
        "age": 30,
        "current_savings": 10000,
        "monthly_investment": 300,
    }

    # Trigger requests to exceed RATE_LIMIT_ANALYZE (10/minute)
    responses = []
    for _ in range(12):
        r = client.post("/api/analyze", json=profile_payload)
        responses.append(r)

    # At least one request should be 429 Too Many Requests
    exceeded_resps = [r for r in responses if r.status_code == 429]
    assert len(exceeded_resps) > 0, "Rate limit should have triggered 429"

    resp_429 = exceeded_resps[0]
    assert resp_429.headers.get("retry-after") == "60"
    assert "problem+json" in resp_429.headers.get("content-type", "")
    assert resp_429.headers.get("ratelimit-limit") == "60" or resp_429.headers.get("x-ratelimit-limit") == "60"

    body = resp_429.json()
    assert body["status"] == 429
    assert body["title"] == "Too Many Requests"
    assert body["type"] == "https://errors.fintech.local/rate-limit-exceeded"
    assert body["instance"] == "/api/analyze"
    assert "Maximum 60 requests per minute" in body["detail"]


def test_canonical_hasher_known_cross_platform_vectors():
    """Empirical challenge: verify bit-identical SHA-256 digests across known test vectors."""
    # Vector 1: Flat integer object
    h1, b1 = canonical_sha256({"b": 2, "a": 1})
    assert b1 == b'{"a":1,"b":2}'
    assert h1 == "43258cff783fe7036d8a43033f830adfc60ec037382473548ac742b888292777"

    # Vector 2: Nested integer object with reverse keys
    h2, b2 = canonical_sha256({"nested": {"y": 20, "x": 10}, "b": 2, "a": 1})
    assert b2 == b'{"a":1,"b":2,"nested":{"x":10,"y":20}}'
    assert h2 == "69d77907fe4621663a224cc40f194eaf771dfdd3e0695eb23dc43ebfc1b04bd8"

    # Vector 3: Decimal float object (matching JS canonicalStringify for non-integer floats)
    h3, b3 = canonical_sha256({"val": 1200.5})
    assert b3 == b'{"val":1200.5}'
    assert h3 == "4051683323e638a2e7011b6bf31c3706ef932dfe7241993efb2afe8b212636f6"

    # Vector 4: Whole-number float normalized to integer per RFC 8785 §3.2.2.3 / ECMAScript ToString
    h4, b4 = canonical_sha256({"val": 1.0})
    assert b4 == b'{"val":1}'
    assert h4 == "0fad9b1ee80feeacd36fcceb3ce9538cfa66faef5e4b46d045600c0dad487431"

    # Vector 5: Profile numbers with whole-number float
    h5, b5 = canonical_sha256({"income": 60000.0})
    assert b5 == b'{"income":60000}'
