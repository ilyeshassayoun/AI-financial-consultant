from typing import Any
from tax_calculator import calculate_german_tax
from investment_engine import simulate_investment
from mock_insurance_data import get_insurance_recommendation
from retirement_planner import calculate_retirement_plan
from financial_optimizer import generate_optimization_suggestions
from advisory_engine import build_advisory_plan
from advanced_investment_engine import build_investment_lab
from advanced_insurance_engine import build_insurance_lab
from advanced_tax_engine import build_tax_lab
from advanced_retirement_engine import build_retirement_lab
from risk_model import evaluate_risk_profile
from schemas.models import ClientProfile

def run_full_analysis(profile: ClientProfile) -> dict[str, Any]:
    """Runs the complete German financial actuarial analysis pipeline."""
    # 1. Tax Analysis (full German progressive EStG tax engine)
    tax_info = calculate_german_tax(
        gross_income=profile.income,
        tax_class=profile.tax_class,
        is_married=profile.is_married,
        church_tax=profile.church_tax,
        num_children=profile.num_children,
        additional_deductions=profile.additional_deductions,
        commute_km=profile.commute_km,
        commute_days=230,
        home_office_days=profile.home_office_days,
        riester_contribution=profile.riester_contribution,
        has_private_health=profile.has_private_health,
        private_health_cost=profile.private_health_cost,
        age=profile.age,
        children_under_25=profile.children_under_25 if profile.children_under_25 is not None else profile.num_children,
        is_saxony=profile.is_saxony,
        joint_assessment=profile.joint_assessment,
    )

    # 2. Investment Projection (Monte Carlo simulation with correlated assets)
    investment_info = simulate_investment(
        initial_amount=profile.initial_amount,
        monthly_contribution=profile.monthly_investment,
        years=profile.investment_years,
        risk_profile=profile.risk_profile,
        inflation_rate=profile.expected_inflation,
        management_fee=profile.management_fee,
        num_simulations=250,
    )

    # 3. Insurance Needs Analysis
    insurance_info = get_insurance_recommendation(
        age=profile.age,
        has_dependents=profile.has_dependents,
        income=profile.income,
        is_married=profile.is_married,
        has_property=profile.has_property,
        has_car=profile.has_car,
        existing_insurances=profile.existing_insurances,
    )

    # 4. Retirement Planning (DRV Rentenlücke & 3-Pillar)
    retirement_info = calculate_retirement_plan(
        current_age=profile.age,
        retirement_age=profile.retirement_age,
        gross_income=profile.income,
        years_worked=profile.years_worked,
        monthly_investment=profile.monthly_investment,
        risk_profile=profile.risk_profile,
        is_married=profile.is_married,
        num_children=profile.num_children,
        riester_contribution=profile.riester_contribution,
        target_pension_ratio=profile.target_pension_ratio,
        inflation_rate=profile.expected_inflation,
        bav_contribution=profile.bav_contribution,
    )

    # 5. Financial Optimization Suggestions
    profile_dict = profile.model_dump()
    optimizer_info = generate_optimization_suggestions(
        profile=profile_dict,
        tax_result=tax_info,
        investment_result=investment_info,
        retirement_result=retirement_info,
        insurance_list=insurance_info,
    )

    tax_result = {
        "gross_income": tax_info.get("gross_income", profile.income),
        "tax_amount": tax_info.get("tax_amount", 0),
        "net_income": tax_info.get("net_income", profile.income),
        "effective_tax_rate": tax_info.get("effective_tax_rate", 0),
        "marginal_tax_rate": tax_info.get("marginal_tax_rate", 0),
        "details": tax_info.get("details", tax_info),
        "calculation_basis": tax_info.get("calculation_basis", {}),
    }

    insurance_lab = build_insurance_lab(profile_dict, tax_result)
    investment_lab = build_investment_lab(profile_dict)
    retirement_lab = build_retirement_lab(profile_dict, tax_result, investment_lab)
    retirement_result = {
        **retirement_info,
        "entgeltpunkte_total": retirement_lab["statutory"]["ep_total"],
        "entgeltpunkte_per_year": retirement_lab["statutory"]["ep_per_future_year"],
        "zugangsfaktor": retirement_lab["statutory"]["access_factor"],
        "state_pension_monthly_gross": retirement_lab["statutory"]["nominal_gross"],
        "state_pension_monthly_real_gross": retirement_lab["statutory"]["real_gross"],
        "state_pension_monthly": retirement_lab["statutory"]["real_net_estimate"],
        "bav_pension_monthly": retirement_lab["pillars"][1]["real_monthly"],
        "private_pension_monthly": retirement_lab["pillars"][2]["real_monthly"],
        "riester_pension_monthly": retirement_lab["pillars"][3]["real_monthly"],
        "total_retirement_income_monthly": retirement_lab["totals"]["real_monthly"],
        "target_retirement_income_monthly": retirement_lab["target"]["real_monthly"],
        "pension_gap_monthly": retirement_lab["totals"]["real_gap"],
        "replacement_ratio": retirement_lab["totals"]["funded_ratio"],
        "required_monthly_savings_to_close_gap": retirement_lab["savings_gap"]["required_monthly_total"],
        "private_nest_egg_projected": retirement_lab["private_capital"]["net"],
    }
    raw_analysis = {
        "tax": tax_result,
        "tax_lab": build_tax_lab(profile_dict, tax_result),
        "investment": investment_info,
        "insurance": insurance_lab["needs"],
        "retirement": retirement_result,
        "retirement_lab": retirement_lab,
        "optimization": optimizer_info,
    }

    # 6. Deterministic, explainable household suitability plan.  This layer
    # sequences recommendations by solvency rather than by product category.
    raw_analysis["advisory_plan"] = build_advisory_plan(
        profile_dict, tax_result, investment_info, retirement_result
    )
    raw_analysis["risk_suitability"] = evaluate_risk_profile(profile_dict, raw_analysis)
    raw_analysis["investment_lab"] = investment_lab
    raw_analysis["insurance_lab"] = insurance_lab

    return raw_analysis