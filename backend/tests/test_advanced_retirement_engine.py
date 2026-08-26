from advanced_retirement_engine import (
    AVG_EARNINGS_2026, PENSION_VALUE_JULY_2026, RV_BBG_2026,
    build_retirement_lab,
)


BASE = {
    "age": 35,
    "retirement_age": 67,
    "longevity_age": 95,
    "income": 80_000,
    "years_worked": 10,
    "monthly_investment": 700,
    "initial_amount": 20_000,
    "target_pension_ratio": 0.8,
    "expected_inflation": 0.02,
    "safe_withdrawal_rate": 0.035,
}
TAX = {"net_income": 48_000}
INVESTMENT = {"selected": {"name": "Balanced 60/40", "expected_return": 0.062, "expected_volatility": 0.11}}


def test_uses_official_2026_reference_values_and_today_euros():
    lab = build_retirement_lab(BASE, TAX, INVESTMENT)
    assert lab["model"]["year"] == 2026
    assert lab["statutory"]["pension_value"] == PENSION_VALUE_JULY_2026
    assert lab["statutory"]["ep_per_future_year"] == round(min(BASE["income"], RV_BBG_2026) / AVG_EARNINGS_2026, 3)
    assert lab["target"]["real_monthly"] == 3_200


def test_provided_drv_points_replace_income_based_past_estimate():
    estimated = build_retirement_lab(BASE, TAX, INVESTMENT)
    provided = build_retirement_lab({**BASE, "current_entgeltpunkte": 12.5}, TAX, INVESTMENT)
    assert estimated["statutory"]["ep_source"] == "estimated_from_current_income"
    assert provided["statutory"]["ep_past"] == 12.5
    assert provided["readiness"]["status"] == "ready_for_review"


def test_private_tax_applies_to_gain_not_total_capital():
    capital = build_retirement_lab(BASE, TAX, INVESTMENT)["private_capital"]
    assert capital["gain"] == capital["gross"] - capital["contributions"]
    assert capital["estimated_liquidation_tax"] < capital["gain"]
    assert capital["net"] <= capital["gross"]


def test_nominal_and_real_outputs_are_not_mixed():
    lab = build_retirement_lab(BASE, TAX, INVESTMENT)
    assert lab["target"]["nominal_monthly"] > lab["target"]["real_monthly"]
    assert lab["totals"]["nominal_monthly"] > lab["totals"]["real_monthly"]


def test_withdrawal_simulation_is_reproducible_and_rate_sensitive():
    first = build_retirement_lab(BASE, TAX, INVESTMENT)["withdrawal_strategies"]
    second = build_retirement_lab(BASE, TAX, INVESTMENT)["withdrawal_strategies"]
    assert first == second
    assert first[0]["success_probability"] >= first[-1]["success_probability"]
    assert first[0]["real_monthly_income"] < first[-1]["real_monthly_income"]


def test_later_retirement_improves_modelled_real_income():
    scenarios = build_retirement_lab(BASE, TAX, INVESTMENT)["retirement_age_scenarios"]
    assert scenarios[-1]["real_monthly_income"] > scenarios[0]["real_monthly_income"]


def test_required_savings_never_reports_negative_addition():
    gap = build_retirement_lab(BASE, TAX, INVESTMENT)["savings_gap"]
    assert gap["additional_monthly"] >= 0
    assert gap["required_monthly_total"] == BASE["monthly_investment"] + gap["additional_monthly"]


def test_impossible_pre_63_state_pension_is_not_counted():
    lab = build_retirement_lab({**BASE, "age": 30, "retirement_age": 60}, TAX, INVESTMENT)
    assert lab["statutory"]["access_factor"] == 0
    assert lab["statutory"]["real_net_estimate"] == 0
    assert any("eligibility" in flag.lower() for flag in lab["readiness"]["flags"])
