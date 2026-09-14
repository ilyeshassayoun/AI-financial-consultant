import sys
import os
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from main import app, _run_full_analysis, ClientProfile
from dependencies import require_llm_access
from llm_service import generate_step_ai_consultation, generate_financial_advice, ChatMessage
from fastapi.testclient import TestClient

client = TestClient(app)

def test_full_analysis_pipeline():
    profile = ClientProfile(
        age=35,
        income=80000,
        tax_class=1,
        is_married=False,
        monthly_investment=600,
        retirement_age=67,
        existing_insurances=["BU", "Liability"]
    )
    result = _run_full_analysis(profile)
    assert "tax" in result
    assert "investment" in result
    assert "insurance" in result
    assert "retirement" in result
    assert "optimization" in result
    assert result["tax"]["gross_income"] == 80000
    assert result["investment"]["projected_p50"] > 0
    assert result["optimization"]["summary"]["financial_health_score"] >= 0

def test_ai_step_consultation_generation():
    profile_dict = {
        "age": 32,
        "income": 75000,
        "tax_class": 1,
        "is_married": False,
        "monthly_investment": 500,
        "retirement_age": 67,
        "commute_km": 25,
        "home_office_days": 60,
        "existing_insurances": ["Liability"]
    }
    profile_obj = ClientProfile(**profile_dict)
    analysis = _run_full_analysis(profile_obj)
    
    for step in ["profile", "insurance", "tax", "invest", "pension"]:
        insight = generate_step_ai_consultation(step, profile_dict, analysis)
        assert "title" in insight
        assert "verdict" in insight
        assert "urgency" in insight
        assert "key_metrics" in insight
        assert "recommended_actions" in insight
        assert len(insight["verdict"]) > 20

    investment_insight = generate_step_ai_consultation("invest", profile_dict, analysis)
    assert "600 paths per strategy" in investment_insight["verdict"]

def test_api_analyze_endpoint():
    payload = {
        "age": 30,
        "income": 60000,
        "tax_class": 1,
        "monthly_investment": 500,
        "retirement_age": 67
    }
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "tax" in data
    assert "investment" in data
    assert "ai_consultations" not in data

def test_api_consultant_insight_endpoint():
    payload = {
        "profile": {
            "age": 30,
            "income": 60000,
            "tax_class": 1,
            "monthly_investment": 500,
            "retirement_age": 67
        },
        "step": "tax"
    }
    app.dependency_overrides[require_llm_access] = lambda: object()
    try:
        response = client.post("/api/consultant/insight", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "insight" in data
        assert "title" in data["insight"]
        assert "verdict" in data["insight"]
    finally:
        app.dependency_overrides.pop(require_llm_access, None)

def test_chat_generation_fallback():
    import asyncio
    messages = [ChatMessage(role="user", content="How should I optimize my taxes?")]
    advice = asyncio.run(generate_financial_advice(messages, "Test client context"))
    assert "Ilyes" in advice
    assert len(advice) > 50
