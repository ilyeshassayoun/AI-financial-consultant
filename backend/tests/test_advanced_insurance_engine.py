from advanced_insurance_engine import JAEG_2026, build_insurance_lab


BASE = {
    "age": 35,
    "retirement_age": 67,
    "income": 80_000,
    "housing_cost": 1_300,
    "living_cost": 650,
    "mobility_cost": 250,
    "monthly_debt_payment": 200,
    "liquid_savings": 12_000,
    "existing_insurances": [],
}
TAX = {"net_income": 48_000}


def test_lab_prioritises_existential_gaps_and_is_explainable():
    lab = build_insurance_lab(BASE, TAX)
    assert lab["readiness"] == "gated"
    assert "liability" in lab["missing_essential"]
    assert "bu" in lab["missing_essential"]
    assert lab["summary"]["human_capital_present_value"] > TAX["net_income"]
    assert len(lab["assumptions"]) >= 4
    assert lab["sources"]


def test_existing_core_cover_removes_core_gaps():
    profile = {**BASE, "existing_insurances": ["Liability", "BU"], "bu_monthly_benefit": 3_000}
    lab = build_insurance_lab(profile, TAX)
    assert "liability" not in lab["missing_essential"]
    assert "bu" not in lab["missing_essential"]


def test_dependent_and_property_needs_are_calculated():
    profile = {
        **BASE,
        "has_dependents": True,
        "has_property": True,
        "property_price": 420_000,
        "property_down_payment": 100_000,
    }
    lab = build_insurance_lab(profile, TAX)
    assert lab["summary"]["term_life_need"] > 320_000
    assert {"term_life", "building"}.issubset(lab["missing_essential"])


def test_health_eligibility_uses_2026_jaeg_without_recommending_a_switch():
    eligible = build_insurance_lab({**BASE, "income": JAEG_2026 + 1}, TAX)["health_decision"]
    ineligible = build_insurance_lab({**BASE, "income": JAEG_2026}, TAX)["health_decision"]
    assert eligible["eligible_for_comparison"] is True
    assert ineligible["eligible_for_comparison"] is False
    assert "not a recommendation" in eligible["recommendation"]


def test_stress_test_preserves_more_capital_with_target_cover():
    lab = build_insurance_lab(BASE, TAX)
    for scenario in lab["income_stress"]:
        assert scenario["with_target_cover"] <= scenario["without_repair"]
        assert scenario["capital_preserved"] >= 0


def test_policy_token_never_synthesises_a_benefit_amount():
    lab = build_insurance_lab({**BASE, "existing_insurances": ["Liability", "BU"], "bu_monthly_benefit": 0}, TAX)
    assert "bu" in lab["missing_essential"]
    assert lab["summary"]["bu_gap_monthly"] > 0


def test_explicit_zero_mortgage_is_preserved_for_homeowner():
    profile = {**BASE, "has_dependents": True, "has_property": True, "mortgage_balance": 0}
    lab = build_insurance_lab(profile, TAX)
    expected = sum(profile[key] for key in ("housing_cost", "living_cost", "mobility_cost", "monthly_debt_payment")) * 12 * 10
    assert lab["summary"]["term_life_need"] == expected


def test_current_private_health_cover_avoids_false_gkv_compulsion():
    decision = build_insurance_lab({**BASE, "income": 50_000, "has_private_health": True}, TAX)["health_decision"]
    assert decision["eligible_for_comparison"] is True
    assert decision["eligibility_basis"] == "current_private_cover"


def test_zero_required_expenses_do_not_create_a_reserve_gap():
    profile = {**BASE, "housing_cost": 0, "living_cost": 0, "mobility_cost": 0, "monthly_debt_payment": 0,
               "existing_insurances": ["Liability", "BU"], "bu_monthly_benefit": 10_000}
    lab = build_insurance_lab(profile, TAX)
    assert lab["summary"]["reserve_months"] is None
    assert lab["readiness"] == "ready_for_broker_review"
