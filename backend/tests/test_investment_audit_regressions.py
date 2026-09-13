"""Regression tests derived from the September production audit."""

import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import advanced_investment_engine as engine
from advanced_investment_engine import _real_estate_case, build_investment_lab


BASE = {
    "initial_amount": 5000,
    "monthly_investment": 500,
    "investment_years": 20,
    "investment_strategy": "balanced_60_40",
    "target_wealth": 250000,
    "management_fee": 0,
}


def test_higher_fees_reduce_each_strategy_outcome_with_identical_shocks():
    free = build_investment_lab(BASE)
    costly = build_investment_lab({**BASE, "management_fee": .05})
    for before, after in zip(free["strategies"], costly["strategies"]):
        assert after["p50"] < before["p50"]
        assert after["after_tax_terminal"] < before["after_tax_terminal"]
        assert after["expected_return"] < before["expected_return"]
        assert after["annual_fee_rate"] == .05


def test_fee_math_matches_a_known_one_year_return(monkeypatch):
    monkeypatch.setattr(engine, "_portfolio_moments", lambda weights: (.10, 0, 0))
    result = engine._simulate_strategy("balanced_60_40", 1000, 0, 1, 0, 2000, 1, annual_fee=.02)
    assert result["p50"] == 1078  # 1000 * 1.10 * 0.98
    assert result["expected_return"] == .078


def test_zero_inflation_preserves_nominal_purchasing_power():
    selected = build_investment_lab({**BASE, "expected_inflation": 0})["selected"]
    assert selected["real_p50"] == selected["p50"]


@pytest.mark.parametrize("monthly", [0, 500, 5000])
def test_portfolio_drawdown_is_independent_of_external_contributions(monthly):
    reference = build_investment_lab({**BASE, "monthly_investment": 0})["selected"]
    selected = build_investment_lab({**BASE, "monthly_investment": monthly})["selected"]
    assert selected["median_max_drawdown"] == reference["median_max_drawdown"]


@pytest.mark.parametrize("married,joint,allowance", [
    (False, False, 1000), (False, True, 1000),
    (True, False, 1000), (True, True, 2000),
])
def test_saver_allowance_respects_assessment_mode(married, joint, allowance):
    lab = build_investment_lab({**BASE, "is_married": married, "joint_assessment": joint})
    assert lab["tax_analysis"]["saver_allowance"] == allowance


def test_property_retains_underwater_sale_liability():
    case = _real_estate_case({
        "property_price": 350000, "property_down_payment": 0,
        "mortgage_rate": .04, "mortgage_amortization": 0,
        "property_appreciation": -.05,
    }, 20)
    assert case["exit_equity"] == round(350000 * .95 ** 20 * .965 - 350000)
    assert case["levered_irr"] is None  # no positive cash flow -> no IRR root


def test_property_marks_unachievable_occupancy_instead_of_capping_it():
    case = _real_estate_case({}, 20)
    assert case["break_even_occupancy"] > 1
    assert case["occupancy_feasible"] is False


def test_zero_rent_has_no_break_even_occupancy():
    case = _real_estate_case({"gross_rental_yield": 0}, 20)
    assert case["break_even_occupancy"] is None
    assert case["occupancy_feasible"] is False


def test_mortgage_payments_stop_at_payoff():
    case = _real_estate_case({
        "property_price": 100000, "property_down_payment": 50000,
        "mortgage_rate": 0, "mortgage_amortization": 1,
    }, 3)
    assert case["remaining_loan"] == 0
    assert case["total_debt_service"] == 50000
    assert case["cash_flow_schedule"][1]["debt_service"] == 0
    assert case["cash_flow_schedule"][2]["net_cash_flow"] > case["annual_net_cash_flow"]


@pytest.mark.parametrize("years", [1, 3, 30])
def test_portfolio_and_property_use_the_requested_horizon(years):
    lab = build_investment_lab({**BASE, "investment_years": years})
    assert lab["selected"]["timeline"][-1]["year"] == years
    assert lab["real_estate"]["horizon_years"] == years


@pytest.mark.parametrize("constraint", [
    {"investment_liquidity": "short"}, {"investment_years": 3},
    {"investment_loss_tolerance": "low"}, {"risk_profile": "low"},
    {"investment_priority": "stability"},
])
def test_policy_enforces_risk_constraints_even_for_direct_api_consumers(constraint):
    lab = build_investment_lab({**BASE, "liquid_savings": 100000,
                                "housing_cost": 1000, **constraint})
    assert lab["investment_policy"]["execution_status"] == "gated"
    assert lab["investment_policy"]["suitability_flags"]


def test_api_preserves_constraints_zero_inflation_and_nullable_property_results():
    from fastapi.testclient import TestClient
    from main import app

    response = TestClient(app).post("/api/lab/investment", json={
        **BASE, "expected_inflation": 0, "investment_liquidity": "short",
        "property_down_payment": 0, "mortgage_amortization": 0,
        "property_appreciation": -.05,
    })
    assert response.status_code == 200
    result = response.json()
    assert result["selected"]["real_p50"] == result["selected"]["p50"]
    assert result["investment_policy"]["execution_status"] == "gated"
    assert result["real_estate"]["levered_irr"] is None
    assert result["real_estate"]["exit_equity"] < 0
