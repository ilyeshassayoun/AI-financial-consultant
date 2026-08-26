"""
tests/test_risk_and_knowledge.py — Unit tests for ML Risk Suitability and Statutory Knowledge Base
"""

import pytest
from risk_model import evaluate_risk_profile
from knowledge_base import retrieve_statutory_context, STATUTORY_CORPUS
from investment_engine import simulate_investment_growth


def test_statutory_knowledge_corpus_integrity():
    assert len(STATUTORY_CORPUS) >= 8
    for item in STATUTORY_CORPUS:
        assert "statute" in item
        assert "title" in item
        assert "content" in item
        assert "keywords" in item


def test_rag_retrieval_matches_tax_query():
    results = retrieve_statutory_context("How are commute and home office expenses deducted?")
    assert len(results) > 0
    assert any("§ 9 EStG" in r["statute"] for r in results)


def test_rag_retrieval_matches_pension_query():
    results = retrieve_statutory_context("What are Entgeltpunkte and Rentenlücke in German retirement?")
    assert len(results) > 0
    assert any("SGB VI" in r["statute"] for r in results)


def test_risk_model_detects_unhedged_human_capital():
    profile = {
        "age": 28,
        "retirement_age": 67,
        "income": 75000,
        "monthly_investment": 600,
        "existing_insurances": ["privathaftpflicht"],
        "unsecured_debt_rate": 0.0,
        "risk_profile": "high"
    }
    analysis = {"tax": {"net_income": 45000}}
    result = evaluate_risk_profile(profile, analysis)
    
    assert "capacity_score" in result
    assert "suitability_tier" in result
    anomalies = result["anomalies_detected"]
    assert any(a["code"] == "HUMAN_CAPITAL_EXPOSURE" for a in anomalies)


def test_risk_model_detects_debt_arbitrage():
    profile = {
        "age": 35,
        "retirement_age": 67,
        "income": 50000,
        "monthly_investment": 300,
        "existing_insurances": ["privathaftpflicht", "bu"],
        "unsecured_debt_rate": 0.12,  # 12% expensive consumer debt
        "risk_profile": "medium"
    }
    analysis = {"tax": {"net_income": 32000}}
    result = evaluate_risk_profile(profile, analysis)
    
    anomalies = result["anomalies_detected"]
    assert any(a["code"] == "DEBT_ARBITRAGE_FRICTION" for a in anomalies)


def test_deterministic_investment_monte_carlo():
    res1 = simulate_investment_growth(10000, 500, 20, "medium", seed=42)
    res2 = simulate_investment_growth(10000, 500, 20, "medium", seed=42)
    
    assert res1["projected_p50"] == res2["projected_p50"]
    assert res1["projected_p10"] == res2["projected_p10"]
    assert res1["projected_p90"] == res2["projected_p90"]
    assert res1["projected_p10"] <= res1["projected_p50"] <= res1["projected_p90"]
