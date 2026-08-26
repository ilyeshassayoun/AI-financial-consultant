from advanced_tax_engine import build_tax_lab
from tax_calculator import calculate_german_tax


BASE = {
    "age": 35,
    "income": 75_000,
    "tax_class": 1,
    "is_married": False,
    "num_children": 0,
    "commute_km": 30,
    "home_office_days": 80,
    "additional_deductions": 0,
    "annual_capital_gains": 8_000,
    "equity_fund_share": 1,
}


def _baseline(profile=BASE):
    return calculate_german_tax(
        gross_income=profile["income"],
        tax_class=profile.get("tax_class", 1),
        is_married=profile.get("is_married", False),
        num_children=profile.get("num_children", 0),
        commute_km=profile.get("commute_km", 0),
        home_office_days=profile.get("home_office_days", 0),
        age=profile.get("age", 35),
    )


def test_tax_lab_uses_complete_recalculations_and_sources():
    lab = build_tax_lab(BASE, _baseline())
    assert lab["scenarios"][1]["annual_tax"] >= lab["scenarios"][0]["annual_tax"]
    assert lab["deductions"]["modelled_tax_saving"] >= 0
    assert lab["sources"]
    assert lab["model"]["year"] == 2026


def test_capital_income_applies_partial_exemption_and_allowance():
    lab = build_tax_lab(BASE, _baseline())["capital_income"]
    assert lab["partial_exemption"] == 2_400
    assert lab["saver_allowance"] == 1_000
    assert lab["taxable_amount"] == 4_600
    assert lab["estimated_tax"] > 0


def test_married_missing_spouse_income_is_flagged():
    profile = {**BASE, "is_married": True, "tax_class": 4}
    lab = build_tax_lab(profile, _baseline(profile))
    assert any("Spouse income" in flag for flag in lab["input_flags"])
    assert lab["assessment"]["mode"] == "joint_estimate"


def test_care_rate_follows_2026_child_rules():
    childless = calculate_german_tax(50_000, age=35, num_children=0)
    one_child = calculate_german_tax(50_000, age=35, num_children=1, children_under_25=1)
    three_children = calculate_german_tax(50_000, age=35, num_children=3, children_under_25=3)
    assert childless["details"]["social_security"]["care_employee_rate"] == 0.024
    assert one_child["details"]["social_security"]["care_employee_rate"] == 0.018
    assert three_children["details"]["social_security"]["care_employee_rate"] == 0.013


def test_tax_class_does_not_change_final_annual_liability_for_single_assessment():
    class_one = calculate_german_tax(60_000, tax_class=1)
    class_six = calculate_german_tax(60_000, tax_class=6)
    assert class_one["tax_amount"] == class_six["tax_amount"]


def test_statutory_allowance_addbacks_are_visible():
    child = calculate_german_tax(150_000, num_children=1)
    assert child["details"]["child_benefit_used"] == "kinderfreibetrag"
    assert child["details"]["kindergeld_addback"] > 0
    assert child["details"]["kindergeld_received"] > 0

    riester = calculate_german_tax(200_000, riester_contribution=2_100)
    assert riester["details"]["riester_benefit_used"] == "deduction"
    assert riester["details"]["riester_allowance_addback"] == 175
