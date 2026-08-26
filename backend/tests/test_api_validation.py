import os
import sys

from fastapi.testclient import TestClient

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from main import app


client = TestClient(app)


def test_rejects_unbounded_simulation_horizon():
    response = client.post("/api/analyze", json={"investment_years": 1_000_000_000})
    assert response.status_code == 422


def test_rejects_invalid_financial_domains_before_calculation():
    for payload in (
        {"expected_inflation": -1},
        {"num_children": -2},
        {"monthly_investment": -1},
        {"risk_profile": "reckless"},
    ):
        response = client.post("/api/analyze", json=payload)
        assert response.status_code == 422, payload


def test_cors_does_not_reflect_untrusted_origin():
    response = client.options(
        "/api/analyze",
        headers={
            "Origin": "https://evil.example",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert response.headers.get("access-control-allow-origin") != "https://evil.example"


def test_health_exposes_model_version():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["model_year"] == 2026


def test_profile_accepts_variable_income_stability_from_frontend():
    response = client.post("/api/step/insurance", json={"employment_stability": "variable"})
    assert response.status_code == 200


def test_rejects_non_finite_income_and_extreme_retirement_age():
    non_finite = client.post(
        "/api/analyze",
        content='{"income": 1e999}',
        headers={"Content-Type": "application/json"},
    )
    assert non_finite.status_code == 422
    assert client.post("/api/analyze", json={"retirement_age": 10_000}).status_code == 422


def test_paid_ai_routes_require_configured_access_key(monkeypatch):
    monkeypatch.setenv("LLM_ACCESS_KEY", "test-secret")
    response = client.post("/api/consultant/insight", json={"profile": {}, "step": "tax"})
    assert response.status_code == 401
