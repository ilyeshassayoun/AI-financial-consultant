"""Explainable German household insurance needs analysis.

This module deliberately separates needs analysis from underwriting. It does not
pretend to quote premiums or predict claim acceptance from sparse profile data.
"""

from __future__ import annotations

from math import pow
from typing import Any, Dict, Iterable, List


MODEL_YEAR = 2026
JAEG_2026 = 77_400.0
GKV_BBG_2026 = 69_750.0
DEFAULT_DISCOUNT_RATE = 0.03
DEFAULT_WAGE_GROWTH = 0.01

SOURCES = [
    {
        "label": "Federal Government — 2026 social-insurance thresholds",
        "url": "https://www.bundesregierung.de/breg-de/bundesregierung/bundeskanzleramt/beitragsgemessungsgrenzen-2386514",
    },
    {
        "label": "BaFin consumer information — insurance",
        "url": "https://www.bafin.de/DE/Verbraucher/Versicherung/versicherung_node.html",
    },
]


def _money(value: Any) -> float:
    try:
        return max(0.0, float(value or 0.0))
    except (TypeError, ValueError):
        return 0.0


def _normalise(values: Iterable[str]) -> set[str]:
    aliases = {
        "liability": "liability",
        "privathaftpflicht": "liability",
        "privathaftpflichtversicherung": "liability",
        "bu": "bu",
        "berufsunfaehigkeit": "bu",
        "berufsunfähigkeitsversicherung": "bu",
        "term life": "term_life",
        "risikoleben": "term_life",
        "risikolebensversicherung": "term_life",
        "contents": "contents",
        "hausrat": "contents",
        "hausratversicherung": "contents",
        "building": "building",
        "wohngebaeude": "building",
        "wohngebäudeversicherung": "building",
        "motor": "motor",
        "kfz": "motor",
        "kfz-versicherung": "motor",
        "legal": "legal",
        "rechtsschutz": "legal",
        "rechtsschutzversicherung": "legal",
        "pkv": "pkv",
    }
    normalised = set()
    for raw in values or []:
        key = str(raw).strip().lower()
        normalised.add(aliases.get(key, key))
    return normalised


def _present_value_income(net_annual: float, years: int) -> float:
    """Present value of growing annual net income using a growing annuity."""
    if years <= 0 or net_annual <= 0:
        return 0.0
    discount = DEFAULT_DISCOUNT_RATE
    growth = DEFAULT_WAGE_GROWTH
    if abs(discount - growth) < 1e-9:
        return net_annual * years / (1.0 + discount)
    ratio = (1.0 + growth) / (1.0 + discount)
    return net_annual * (1.0 - pow(ratio, years)) / (discount - growth)


def _status(active: bool, applicable: bool = True) -> str:
    if not applicable:
        return "not_applicable"
    return "active" if active else "gap"


def build_insurance_lab(profile: Dict[str, Any], tax_result: Dict[str, Any]) -> Dict[str, Any]:
    age = max(18, int(profile.get("age", 30)))
    retirement_age = max(age + 1, int(profile.get("retirement_age", 67)))
    years_remaining = retirement_age - age
    gross_income = _money(profile.get("income"))
    net_annual = _money(tax_result.get("net_income")) or gross_income * 0.62
    net_monthly = net_annual / 12.0
    existing = _normalise(profile.get("existing_insurances", []))

    housing = _money(profile.get("housing_cost"))
    living = _money(profile.get("living_cost"))
    mobility = _money(profile.get("mobility_cost"))
    debt_payment = _money(profile.get("monthly_debt_payment"))
    essential_monthly = housing + living + mobility + debt_payment
    liquid_savings = _money(profile.get("liquid_savings"))
    reserve_months = liquid_savings / essential_monthly if essential_monthly > 0 else None

    human_capital = _present_value_income(net_annual, years_remaining)
    bu_target = min(net_monthly * 0.80, max(essential_monthly * 1.10, net_monthly * 0.65))
    current_bu = _money(profile.get("bu_monthly_benefit"))
    bu_gap = max(0.0, bu_target - current_bu)

    mortgage_input = profile.get("mortgage_balance")
    mortgage_balance = _money(mortgage_input)
    if mortgage_input is None and profile.get("has_property"):
        mortgage_balance = max(0.0, _money(profile.get("property_price")) - _money(profile.get("property_down_payment")))
    dependant_years = max(5, min(20, 18 - int(profile.get("youngest_dependent_age", 8))))
    term_life_need = mortgage_balance + essential_monthly * 12 * dependant_years

    has_dependants = bool(profile.get("has_dependents") or int(profile.get("num_children", 0)) > 0)
    has_property = bool(profile.get("has_property"))
    has_car = bool(profile.get("has_car"))
    current_pkv = bool(profile.get("has_private_health"))
    pkv_salary_eligible = gross_income > JAEG_2026
    pkv_comparison_relevant = pkv_salary_eligible or current_pkv

    needs: List[Dict[str, Any]] = [
        {
            "id": "liability", "name": "Private liability", "priority": 100,
            "status": _status("liability" in existing), "severity": "existential",
            "recommended_cover": 10_000_000,
            "decision": "Verify personal injury, financial loss, rented-property damage, key loss and gradual damage wording.",
            "why": "A low-frequency third-party claim can exceed the household's entire balance sheet.",
        },
        {
            "id": "bu", "name": "Occupational disability", "priority": 96,
            "status": _status("bu" in existing and bu_gap <= 1), "severity": "existential",
            "recommended_cover": round(bu_target),
            "decision": "Obtain anonymous pre-assessment before an application; compare occupation definition, exclusions, abstract referral waiver and guaranteed increases.",
            "why": "Income capacity is the largest household asset; the target is needs-based, not an insurer quote.",
        },
        {
            "id": "term_life", "name": "Term life", "priority": 90 if has_dependants else 20,
            "status": _status("term_life" in existing, has_dependants), "severity": "existential" if has_dependants else "limited",
            "recommended_cover": round(term_life_need) if has_dependants else 0,
            "decision": "Use a term aligned with dependant support and mortgage amortisation; compare level versus decreasing cover.",
            "why": "The capital need funds essential spending and debt after the loss of an earner.",
        },
        {
            "id": "building", "name": "Residential building", "priority": 92 if has_property else 10,
            "status": _status("building" in existing, has_property), "severity": "existential" if has_property else "limited",
            "recommended_cover": round(_money(profile.get("property_price"))) if has_property else 0,
            "decision": "Check replacement-value indexation, gross-negligence protection and natural-hazard extension for the address.",
            "why": "Owners need reconstruction-cost protection; market value is only a placeholder until the insurer calculates replacement value.",
        },
        {
            "id": "motor", "name": "Motor liability", "priority": 100 if has_car else 10,
            "status": _status("motor" in existing, has_car), "severity": "mandatory" if has_car else "limited",
            "recommended_cover": 100_000_000 if has_car else 0,
            "decision": "Confirm compulsory liability first; choose comprehensive cover from vehicle value, financing and loss tolerance.",
            "why": "Motor liability is compulsory when a vehicle is operated in Germany.",
        },
        {
            "id": "contents", "name": "Household contents", "priority": 58,
            "status": _status("contents" in existing), "severity": "material",
            "recommended_cover": round(_money(profile.get("living_space_sqm", 70)) * 650),
            "decision": "Inventory replacement value and check bicycle, valuables, cyber and natural-hazard sublimits.",
            "why": "Self-insure only if replacing the full household after a total loss is affordable.",
        },
        {
            "id": "legal", "name": "Legal expenses", "priority": 35,
            "status": _status("legal" in existing), "severity": "budget",
            "recommended_cover": 500_000,
            "decision": "Select modules only for real exposures and review waiting periods, deductibles and exclusions.",
            "why": "This protects access to legal enforcement, but it ranks below existential risks.",
        },
    ]
    needs.sort(key=lambda item: float(item.get("priority", 0)), reverse=True)

    scenarios = []
    for months in (12, 36, 60):
        baseline_shortfall = max(0.0, essential_monthly - current_bu) * months
        protected_shortfall = max(0.0, essential_monthly - bu_target) * months
        scenarios.append({
            "months": months,
            "without_repair": round(baseline_shortfall),
            "with_target_cover": round(protected_shortfall),
            "capital_preserved": round(max(0.0, baseline_shortfall - protected_shortfall)),
        })

    gkv_employee_estimate = min(gross_income, GKV_BBG_2026) * 0.0875 / 12.0
    health_decision = {
        "eligible_for_comparison": pkv_comparison_relevant,
        "eligibility_basis": "current_private_cover" if current_pkv else ("salary_threshold" if pkv_salary_eligible else "no_salary_route_identified"),
        "threshold": JAEG_2026,
        "income_headroom": round(gross_income - JAEG_2026),
        "gkv_employee_health_estimate": round(gkv_employee_estimate),
        "recommendation": (
            "Current private cover is recorded; validate the eligibility route and compare lifetime affordability before changing systems."
            if current_pkv else
            "Run a lifetime-cost comparison; salary eligibility is not a recommendation to switch."
            if pkv_salary_eligible else
            "Remain in the statutory system unless another eligibility route applies; supplementary cover can be assessed separately."
        ),
        "compare": ["family co-insurance", "health underwriting", "deductible", "premium relief", "retirement affordability", "return-to-GKV constraints"],
        "warning": "PKV premiums require medical underwriting and tariff data; this model intentionally does not invent a quote.",
    }

    missing_essential = [str(item["id"]) for item in needs if float(item.get("priority", 0)) >= 90 and item.get("status") == "gap"]
    reserve_gap = essential_monthly > 0 and (reserve_months or 0) < 3
    readiness = "gated" if missing_essential or reserve_gap else "ready_for_broker_review"

    return {
        "model": {"name": "Explainable needs-based protection model", "version": "2026.1", "year": MODEL_YEAR},
        "readiness": readiness,
        "missing_essential": missing_essential,
        "summary": {
            "human_capital_present_value": round(human_capital),
            "essential_monthly_spend": round(essential_monthly),
            "reserve_months": round(reserve_months, 1) if reserve_months is not None else None,
            "bu_target_monthly": round(bu_target),
            "bu_gap_monthly": round(bu_gap),
            "term_life_need": round(term_life_need) if has_dependants else 0,
        },
        "needs": needs,
        "income_stress": scenarios,
        "health_decision": health_decision,
        "implementation": [
            "Close mandatory and existential gaps before convenience cover.",
            "Collect policy schedules and compare wording, exclusions, limits and waiting periods—not premium alone.",
            "Use anonymous risk pre-assessment for health-sensitive applications before submitting personal applications.",
            "Review beneficiaries, insured sums and household changes annually and after marriage, birth, property purchase or career change.",
        ],
        "assumptions": [
            "Human capital is the present value of modelled net income to retirement using 1% wage growth and a 3% discount rate.",
            "Coverage amounts are planning targets, not offers; underwriting, occupation, health, location and policy wording are not priced.",
            "The BU target is capped at 80% of modelled net income and must be checked against insurer acceptance limits.",
            "The GKV estimate covers the employee health contribution only and excludes care insurance and tariff-specific details.",
        ],
        "sources": SOURCES,
    }
