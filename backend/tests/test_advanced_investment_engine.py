import math
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from advanced_investment_engine import (
    ASSETS,
    MODEL_ASSUMPTION_VERSION,
    MODEL_ID,
    STRATEGIES,
    _portfolio_moments,
    build_investment_lab,
)


BASE = {"initial_amount": 10000, "monthly_investment": 700, "investment_years": 20, "expected_inflation": .02, "target_wealth": 400000}


def test_all_strategies_have_complete_allocations():
    assert len(STRATEGIES) >= 5
    for strategy in STRATEGIES.values():
        assert abs(sum(strategy["weights"].values()) - 1) < 1e-9
        assert strategy["instruments"]


def test_lab_is_deterministic_and_percentiles_are_ordered():
    first = build_investment_lab(BASE)
    second = build_investment_lab(BASE)
    assert first == second
    for strategy in first["strategies"]:
        assert strategy["p05"] <= strategy["p10"] <= strategy["p50"] <= strategy["p90"] <= strategy["p95"]
        assert 0 <= strategy["probability_target"] <= 1
        assert 0 <= strategy["median_max_drawdown"] <= 1


def test_defensive_strategy_has_lower_model_volatility_than_global_core():
    lab = build_investment_lab(BASE)
    strategies = {item["id"]: item for item in lab["strategies"]}
    assert strategies["all_weather"]["expected_volatility"] < strategies["global_core"]["expected_volatility"]


def test_small_value_uses_equity_correlation_not_fallback_bucket():
    _, volatility, _ = _portfolio_moments({"world_equity": .5, "small_value": .5})
    world_vol = ASSETS["world_equity"]["vol"]
    value_vol = ASSETS["small_value"]["vol"]
    expected = math.sqrt(.25 * world_vol ** 2 + .25 * value_vol ** 2 + .5 * world_vol * value_vol * .72)
    assert volatility == expected


def test_target_probability_declines_for_harder_goal():
    achievable = build_investment_lab({**BASE, "target_wealth": 250000})
    difficult = build_investment_lab({**BASE, "target_wealth": 1000000})
    assert achievable["selected"]["probability_target"] >= difficult["selected"]["probability_target"]


def test_real_estate_leverage_case_is_explainable():
    lab = build_investment_lab({**BASE, "property_price": 400000, "property_down_payment": 100000, "mortgage_rate": .04})
    case = lab["real_estate"]
    assert case["loan"] == 300000
    assert "levered_irr" in case
    assert "break_even_occupancy" in case
    assert case["warning"]


def test_tax_aware_terminal_value_is_explainable_and_below_gross():
    lab = build_investment_lab(BASE)
    tax = lab["tax_analysis"]
    assert tax["after_tax_terminal"] <= tax["gross_terminal"]
    assert tax["estimated_liquidation_tax"] >= 0
    assert tax["saver_allowance"] == 1000
    assert len(tax["assumptions"]) >= 3
    assert tax["taxable_gain_before_allowance"] - tax["allowance_used"] == tax["taxable_gain_after_allowance"]
    assert tax["gross_gain"] == tax["modeled_nontaxable_gain"] + tax["taxable_gain_before_allowance"]
    scenarios = {item["id"]: item for item in tax["sensitivity_scenarios"]}
    assert scenarios["no_allowance"]["after_tax_terminal"] <= scenarios["profile"]["after_tax_terminal"]


def test_implementation_plan_reconciles_weights_and_cash_flows():
    lab = build_investment_lab(BASE)
    plan = lab["implementation_plan"]
    assert plan["weight_total"] == 1
    assert sum(item["weight"] for item in plan["orders"]) == 1
    assert sum(item["monthly_amount"] for item in plan["orders"]) == BASE["monthly_investment"]
    assert sum(item["initial_amount"] for item in plan["orders"]) == BASE["initial_amount"]
    assert all(item["isin"] and item["ticker"] for item in plan["orders"])


def test_married_allowance_does_not_reduce_after_tax_value():
    single = build_investment_lab({**BASE, "is_married": False})
    married = build_investment_lab({**BASE, "is_married": True, "joint_assessment": True})
    assert married["tax_analysis"]["saver_allowance"] == 2000
    assert married["tax_analysis"]["after_tax_terminal"] >= single["tax_analysis"]["after_tax_terminal"]


def test_goal_optimizer_reacts_to_harder_target():
    easier = build_investment_lab({**BASE, "target_wealth": 250000})["goal_optimizer"]
    harder = build_investment_lab({**BASE, "target_wealth": 800000})["goal_optimizer"]
    assert harder["required_monthly"] > easier["required_monthly"]
    assert harder["required_return"] > easier["required_return"]
    assert len(harder["levers"]) == 4


def test_investment_policy_gates_low_liquidity_and_expensive_debt():
    lab = build_investment_lab({**BASE, "liquid_savings": 1000, "housing_cost": 1200, "living_cost": 600, "mobility_cost": 200, "unsecured_debt": 10000, "unsecured_debt_rate": .09})
    policy = lab["investment_policy"]
    assert policy["execution_status"] == "gated"
    assert len(policy["suitability_flags"]) == 2
    assert {flag["resolution_code"] for flag in policy["suitability_flags"]} == {"cash_flow"}


def test_methodology_distinguishes_strategy_lab_from_household_projection():
    methodology = build_investment_lab(BASE)["methodology"]
    assert methodology["model_id"] == MODEL_ID
    assert methodology["assumption_version"] == MODEL_ASSUMPTION_VERSION
    assert "nominal EUR" in methodology["value_basis"]
    assert len(methodology["limitations"]) >= 3
