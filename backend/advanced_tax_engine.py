"""Scenario-driven, explainable German tax planning layer for 2026.

The statutory calculator remains deterministic. This layer compares complete
recalculations instead of multiplying deductions by a hard-coded tax rate.
"""

from __future__ import annotations

from typing import Any, Dict

from tax_calculator import calculate_german_tax


MODEL_YEAR = 2026
SOURCES = [
    {"label": "§ 32a EStG — 2026 tariff and splitting", "url": "https://www.gesetze-im-internet.de/estg/__32a.html"},
    {"label": "BMF 2026 payroll-tax values", "url": "https://esth.bundesfinanzministerium.de/lsth/2026/tabellarische-Uebersicht/Anlage-tabellarische-%C3%9Cbersicht.pdf?__blob=publicationFile&v=5"},
    {"label": "BMG — care-insurance contribution rates", "url": "https://www.bundesgesundheitsministerium.de/themen/pflege/online-ratgeber-pflege/die-pflegeversicherung/finanzierung"},
    {"label": "§ 9 EStG — employment expenses", "url": "https://ao.bundesfinanzministerium.de/lsth/2026/A-Einkommensteuergesetz/II-Einkommen-2-24b/4-Ueberschuss-d-Einnahmen-ueber-die-Werbungsk-8-9a/Paragraf-9/inhalt.html"},
]


def _number(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _calculate(profile: Dict[str, Any], **overrides: Any) -> Dict[str, Any]:
    values = {**profile, **overrides}
    children_under_25 = values.get("children_under_25")
    if children_under_25 is None:
        children_under_25 = values.get("num_children", 0)
    return calculate_german_tax(
        gross_income=_number(values.get("income")),
        spouse_income=_number(values.get("spouse_income")),
        tax_class=int(values.get("tax_class", 1)),
        is_married=bool(values.get("is_married")),
        church_tax=bool(values.get("church_tax")),
        num_children=max(0, int(values.get("num_children", 0))),
        additional_deductions=max(0.0, _number(values.get("additional_deductions"))),
        commute_km=max(0, int(values.get("commute_km", 0))),
        commute_days=230,
        home_office_days=max(0, int(values.get("home_office_days", 0))),
        riester_contribution=max(0.0, _number(values.get("riester_contribution"))),
        has_private_health=bool(values.get("has_private_health")),
        private_health_cost=max(0.0, _number(values.get("private_health_cost"))),
        age=max(18, int(values.get("age", 30))),
        children_under_25=max(0, int(children_under_25)),
        is_saxony=bool(values.get("is_saxony")),
        joint_assessment=bool(values.get("joint_assessment", True)),
    )


def build_tax_lab(profile: Dict[str, Any], baseline: Dict[str, Any]) -> Dict[str, Any]:
    details = baseline.get("details", {})
    social = details.get("social_security", {})
    without_work_costs = _calculate(profile, commute_km=0, home_office_days=0)
    extra_deduction = _calculate(
        profile,
        additional_deductions=_number(profile.get("additional_deductions")) + 1_000,
    )

    tax_saving_work_costs = max(0.0, without_work_costs["tax_amount"] - baseline["tax_amount"])
    tax_saving_extra = max(0.0, baseline["tax_amount"] - extra_deduction["tax_amount"])

    breakdown = [
        {"id": "net", "label": "Net cash income", "amount": baseline.get("net_income", 0), "kind": "retained"},
        {"id": "income_tax", "label": "Income tax", "amount": details.get("income_tax", 0), "kind": "tax"},
        {"id": "solidarity", "label": "Solidarity surcharge", "amount": details.get("solidarity_surcharge", 0), "kind": "tax"},
        {"id": "church", "label": "Church tax", "amount": details.get("church_tax_amount", 0), "kind": "tax"},
        {"id": "social", "label": "Employee social insurance", "amount": social.get("total", 0), "kind": "social"},
    ]

    scenarios = [
        {"id": "baseline", "label": "Current recorded facts", "annual_tax": baseline["tax_amount"], "net_income": baseline["net_income"], "delta": 0},
        {"id": "no_work_costs", "label": "Without recorded commute / home office", "annual_tax": without_work_costs["tax_amount"], "net_income": without_work_costs["net_income"], "delta": round(without_work_costs["tax_amount"] - baseline["tax_amount"], 2)},
        {"id": "extra_deduction", "label": "+€1,000 verified deduction", "annual_tax": extra_deduction["tax_amount"], "net_income": extra_deduction["net_income"], "delta": round(extra_deduction["tax_amount"] - baseline["tax_amount"], 2)},
    ]

    annual_gains = max(0.0, _number(profile.get("annual_capital_gains")))
    equity_share = min(1.0, max(0.0, _number(profile.get("equity_fund_share"), 1.0)))
    saver_allowance = 2_000.0 if profile.get("is_married") else 1_000.0
    partial_exemption = annual_gains * equity_share * 0.30
    taxable_capital_income = max(0.0, annual_gains - partial_exemption - saver_allowance)
    capital_tax_rate = 0.27995 if profile.get("church_tax") else 0.26375
    estimated_capital_tax = taxable_capital_income * capital_tax_rate

    flags = []
    if profile.get("is_married") and _number(profile.get("spouse_income")) <= 0:
        flags.append("Spouse income is missing; the joint-assessment estimate currently behaves like a sole-earner case.")
    if int(profile.get("tax_class", 1)) in (3, 4, 5, 6):
        flags.append("Payroll tax class is shown for context only and does not determine final annual assessed income tax.")
    if profile.get("has_private_health") and _number(profile.get("private_health_cost")) <= 0:
        flags.append("Private health insurance is selected without an annual premium; net-income accuracy is limited.")
    if not flags:
        flags.append("No critical input inconsistency detected in the supplied core tax profile.")

    documents = [
        {"id": "wage", "label": "Annual wage-tax certificate", "required": True, "reason": "Reconcile gross pay and payroll withholding."},
        {"id": "commute", "label": "Workday and commute evidence", "required": bool(profile.get("commute_km")), "reason": "Support distance allowance and avoid overlap with home-office days."},
        {"id": "home", "label": "Home-office day record", "required": bool(profile.get("home_office_days")), "reason": "Substantiate eligible days and workplace conditions."},
        {"id": "pension", "label": "Pension and insurance certificates", "required": True, "reason": "Verify deductible contributions and allowances."},
        {"id": "capital", "label": "Broker annual tax statement", "required": annual_gains > 0, "reason": "Reconcile allowance, losses, distributions and withholding."},
    ]

    return {
        "model": {"name": "2026 deterministic tax scenario lab", "version": "2026.1", "year": MODEL_YEAR, "status": "estimate"},
        "headline": {
            "gross_income": baseline.get("gross_income", 0),
            "net_income": baseline.get("net_income", 0),
            "assessed_tax": baseline.get("tax_amount", 0),
            "effective_tax_rate": baseline.get("effective_tax_rate", 0),
            "marginal_tax_rate": baseline.get("marginal_tax_rate", 0),
            "taxable_income": details.get("zvE", 0),
        },
        "breakdown": breakdown,
        "social_security": {
            "components": [
                {"label": "Health", "amount": social.get("health_insurance", 0)},
                {"label": "Care", "amount": social.get("care_insurance", 0)},
                {"label": "Pension", "amount": social.get("pension_insurance", 0)},
                {"label": "Unemployment", "amount": social.get("unemployment_insurance", 0)},
            ],
            "total": social.get("total", 0),
            "care_employee_rate": social.get("care_employee_rate", 0),
            "children_under_25_assumed": social.get("children_under_25_assumed", 0),
            "saxony": social.get("saxony", False),
        },
        "deductions": {
            "commute_allowance": details.get("commute_allowance", 0),
            "home_office_allowance": details.get("home_office_allowance", 0),
            "employment_expenses": details.get("werbungskosten", 0),
            "above_lump_sum": details.get("werbungskosten_delta", 0),
            "modelled_tax_saving": round(tax_saving_work_costs, 2),
            "extra_1000_saving": round(tax_saving_extra, 2),
        },
        "assessment": details.get("assessment_basis", {}),
        "child_benefit": {
            "method": details.get("child_benefit_used", "none"),
            "kindergeld": details.get("kindergeld_received", 0),
            "allowance_saving": details.get("kinderfreibetrag_savings", 0),
        },
        "capital_income": {
            "gross_gain": round(annual_gains, 2),
            "equity_fund_share": round(equity_share, 4),
            "partial_exemption": round(partial_exemption, 2),
            "saver_allowance": saver_allowance,
            "taxable_amount": round(taxable_capital_income, 2),
            "estimated_tax": round(estimated_capital_tax, 2),
            "warning": "Simplified annual realization estimate; distributions, Vorabpauschale, loss pots and broker withholding require the annual tax statement.",
        },
        "scenarios": scenarios,
        "input_flags": flags,
        "documents": documents,
        "workflow": [
            "Confirm household assessment status and all income sources.",
            "Reconcile wage, insurance, pension and broker certificates.",
            "Validate deductible expenses and retain evidence before claiming them.",
            "Compare complete recalculations, then review the return with a tax professional where complexity or uncertainty is material.",
        ],
        "limitations": baseline.get("calculation_basis", {}).get("limitations", []),
        "sources": SOURCES,
    }
