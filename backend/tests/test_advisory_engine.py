import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from advisory_engine import build_advisory_plan
from main import ClientProfile, _run_full_analysis


def _inputs(**overrides):
    profile = {
        "age": 35, "retirement_age": 67, "income": 80000,
        "housing_cost": 1200, "living_cost": 600, "mobility_cost": 250,
        "leisure_cost": 300, "subscriptions_cost": 80, "travel_cost": 150,
        "monthly_investment": 700, "initial_amount": 10000,
        "liquid_savings": 10000, "risk_profile": "medium",
        "num_children": 1, "has_dependents": True,
    }
    profile.update(overrides)
    tax = {"net_income": 50000, "effective_tax_rate": .22}
    investment = {"projected_p10": 220000, "projected_p50": 380000,
                  "projected_p90": 620000, "total_contributions": 270000}
    retirement = {"pension_gap_monthly": 650, "replacement_ratio": .72,
                  "required_monthly_savings_to_close_gap": 240}
    return profile, tax, investment, retirement


def test_plan_explains_scenarios_and_assumptions():
    plan = build_advisory_plan(*_inputs())
    assert len(plan["stress_tests"]) == 3
    assert len(plan["assumptions"]) >= 4
    assert plan["portfolio_suitability"]["p10"] < plan["portfolio_suitability"]["p50"]
    assert 0 <= plan["financial_resilience_score"] <= 100


def test_liquidity_and_debt_are_prioritized_before_investing():
    plan = build_advisory_plan(*_inputs(
        liquid_savings=500, unsecured_debt=15000,
        unsecured_debt_rate=.12, monthly_debt_payment=250,
    ))
    ids = [action["id"] for action in plan["action_plan"]]
    assert "fund-reserve" in ids
    assert "repay-debt" in ids
    # Expensive debt dominates expected portfolio returns, so the engine does
    # not recommend simultaneous investing as a primary action.
    assert "automate-investing" not in ids
    assert ids.index("repay-debt") <= 1


def test_sufficient_reserve_removes_reserve_action():
    plan = build_advisory_plan(*_inputs(liquid_savings=50000))
    assert "fund-reserve" not in [a["id"] for a in plan["action_plan"]]
    assert plan["stress_tests"][0]["result"] == "pass"


def test_full_pipeline_exposes_advisory_plan():
    result = _run_full_analysis(ClientProfile())
    assert "advisory_plan" in result
    assert "household_kpis" in result["advisory_plan"]
    assert result["advisory_plan"]["action_plan"]
    assert result["optimization"]["summary"]["financial_health_score"] == result["advisory_plan"]["financial_resilience_score"]
    assert result["optimization"]["summary"]["score_breakdown"] == result["advisory_plan"]["score_components"]
    assert result["model_metadata"]["investment_lab_simulations_per_strategy"] == 600


def test_nominal_bu_benefit_does_not_count_as_adequate_income_protection():
    profile, tax, investment, retirement = _inputs(bu_monthly_benefit=1, existing_insurances=["BU"])
    plan = build_advisory_plan(profile, tax, investment, retirement)

    assert plan["protection_needs"]["bu_gap_monthly"] > 1000
    assert plan["score_components"]["protection"] < 5
    assert "protect-income" in [action["id"] for action in plan["action_plan"]]
