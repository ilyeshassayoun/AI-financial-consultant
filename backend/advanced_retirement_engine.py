"""Explainable German retirement adequacy lab using 2026 reference values."""

from __future__ import annotations

import math
import random
from typing import Any, Dict, List


MODEL_YEAR = 2026
AVG_EARNINGS_2026 = 51_944.0
RV_BBG_2026 = 101_400.0
PENSION_VALUE_JULY_2026 = 42.52
REGULAR_RETIREMENT_AGE = 67

SOURCES = [
    {"label": "DRV — current pension value and 2026 reference values", "url": "https://www.deutsche-rentenversicherung.de/DRV/DE/Experten/Zahlen-und-Fakten/Werte-der-Rentenversicherung/werte-der-rentenversicherung.html"},
    {"label": "Federal Government — 2026 social-insurance parameters", "url": "https://www.bundesregierung.de/breg-de/aktuelles/beitragsgemessungsgrenzen-2386514"},
    {"label": "DRV — early-retirement deductions", "url": "https://www.deutsche-rentenversicherung.de/DRV/DE/Ueber-uns-und-Presse/Presse/Meldungen/2026/260119-rentenminderung-ausgleichen.html"},
    {"label": "DRV — regular retirement age", "url": "https://www.deutsche-rentenversicherung.de/DRV/DE/Experten/Arbeitgeber-und-Steuerberater/summa-summarum/Lexikon/R/regelaltersgrenze.html"},
    {"label": "BMF — taxation of statutory pensions", "url": "https://www.bundesfinanzministerium.de/Content/DE/Standardartikel/Themen/Steuern/Steuerliche_Themengebiete/Rentenbesteuerung/2021-04-28-Rentenbesteuerung-Eine-Frage-der-Gerechtigkeit.html"},
]


def _number(value: Any, default: float = 0.0) -> float:
    try:
        result = float(value)
        return result if math.isfinite(result) else default
    except (TypeError, ValueError):
        return default


def _future_value(initial: float, monthly: float, years: int, annual_return: float) -> float:
    periods = max(0, years * 12)
    monthly_rate = annual_return / 12.0
    if periods == 0:
        return initial
    if abs(monthly_rate) < 1e-10:
        return initial + monthly * periods
    growth = (1.0 + monthly_rate) ** periods
    return initial * growth + monthly * (growth - 1.0) / monthly_rate


def _required_monthly(initial: float, target: float, years: int, annual_return: float) -> float:
    periods = max(1, years * 12)
    monthly_rate = annual_return / 12.0
    if abs(monthly_rate) < 1e-10:
        return max(0.0, (target - initial) / periods)
    growth = (1.0 + monthly_rate) ** periods
    return max(0.0, (target - initial * growth) * monthly_rate / (growth - 1.0))


def _access_factor(retirement_age: int) -> float:
    if retirement_age < 63:
        return 0.0
    months_early = min(48, max(0, (REGULAR_RETIREMENT_AGE - retirement_age) * 12))
    months_late = max(0, (retirement_age - REGULAR_RETIREMENT_AGE) * 12)
    return max(0.0, 1.0 - months_early * 0.003 + months_late * 0.005)


def _after_tax_private_capital(gross: float, contributions: float, married: bool, church_tax: bool) -> Dict[str, float]:
    gain = max(0.0, gross - contributions)
    partial_exemption = gain * 0.30
    allowance = 2_000.0 if married else 1_000.0
    taxable_gain = max(0.0, gain - partial_exemption - allowance)
    tax_rate = 0.27995 if church_tax else 0.26375
    tax = taxable_gain * tax_rate
    return {
        "gross": gross, "contributions": contributions, "gain": gain,
        "partial_exemption": partial_exemption, "allowance": allowance,
        "estimated_liquidation_tax": tax, "net": max(0.0, gross - tax),
    }


def _withdrawal_success(start_real: float, annual_withdrawal: float, years: int,
                        real_return: float, volatility: float, seed: int, paths: int = 1_000) -> float:
    if start_real <= 0:
        return 0.0
    rng = random.Random(seed)
    successes = 0
    for _ in range(paths):
        capital = start_real
        for _year in range(years):
            capital -= annual_withdrawal
            if capital <= 0:
                break
            capital *= max(0.0, 1.0 + rng.gauss(real_return, volatility))
        if capital > 0:
            successes += 1
    return successes / paths


def build_retirement_lab(profile: Dict[str, Any], tax_result: Dict[str, Any],
                         investment_lab: Dict[str, Any]) -> Dict[str, Any]:
    age = max(18, int(profile.get("age", 30)))
    retirement_age = max(age + 1, int(profile.get("retirement_age", 67)))
    longevity_age = max(retirement_age + 1, int(profile.get("longevity_age", 95)))
    years = retirement_age - age
    decumulation_years = longevity_age - retirement_age
    inflation = _number(profile.get("expected_inflation"), 0.02)
    pension_growth = _number(profile.get("expected_pension_growth"), 0.015)
    inflation_factor = (1.0 + inflation) ** years

    gross_income = _number(profile.get("income"))
    current_net_monthly = _number(tax_result.get("net_income"), gross_income * 0.62) / 12.0
    target_ratio = _number(profile.get("target_pension_ratio"), 0.80)
    target_real = current_net_monthly * target_ratio
    target_nominal = target_real * inflation_factor

    ep_per_year = min(gross_income, RV_BBG_2026) / AVG_EARNINGS_2026
    recorded_ep = profile.get("current_entgeltpunkte")
    ep_source = "provided_drv_record" if recorded_ep is not None else "estimated_from_current_income"
    ep_past = max(0.0, _number(recorded_ep)) if recorded_ep is not None else ep_per_year * max(0, int(profile.get("years_worked", 0)))
    ep_future = ep_per_year * years
    ep_total = ep_past + ep_future
    access = _access_factor(retirement_age)
    state_current_euro_gross = ep_total * PENSION_VALUE_JULY_2026 * access
    state_nominal_gross = state_current_euro_gross * ((1.0 + pension_growth) ** years)
    state_real_gross = state_nominal_gross / inflation_factor
    supplied_health_rate = profile.get("retirement_health_care_rate")
    if supplied_health_rate is None:
        state_health_rate = 0.1295 if int(profile.get("num_children", 0)) == 0 else 0.1235
    else:
        state_health_rate = _number(supplied_health_rate, 0.1235)
    state_tax_rate = _number(profile.get("retirement_tax_rate"), 0.08)
    state_net_factor = max(0.0, 1.0 - state_health_rate - state_tax_rate)
    state_nominal_net = state_nominal_gross * state_net_factor
    state_real_net = state_nominal_net / inflation_factor

    selected = investment_lab.get("selected", {})
    selected_return = _number(selected.get("expected_return"), 0.062)
    selected_volatility = _number(selected.get("expected_volatility"), 0.11)
    monthly_private = _number(profile.get("monthly_investment"))
    initial_private = _number(profile.get("initial_amount"))
    gross_private = _future_value(initial_private, monthly_private, years, selected_return)
    contributions = initial_private + monthly_private * years * 12
    private_tax = _after_tax_private_capital(
        gross_private, contributions, bool(profile.get("is_married")), bool(profile.get("church_tax"))
    )
    withdrawal_rate = _number(profile.get("safe_withdrawal_rate"), 0.035)
    private_nominal_income = private_tax["net"] * withdrawal_rate / 12.0
    private_real_income = private_nominal_income / inflation_factor

    bav_employee = _number(profile.get("bav_contribution"))
    bav_subsidy = _number(profile.get("bav_employer_subsidy_rate"), 0.15)
    bav_return = _number(profile.get("bav_expected_return"), 0.04)
    bav_gross = _future_value(0.0, bav_employee * (1.0 + bav_subsidy), years, bav_return)
    bav_deduction = _number(profile.get("bav_retirement_deduction_rate"), 0.20)
    bav_nominal_income = bav_gross * withdrawal_rate * max(0.0, 1.0 - bav_deduction) / 12.0
    bav_real_income = bav_nominal_income / inflation_factor

    riester_annual = _number(profile.get("riester_contribution"))
    riester_gross = _future_value(0.0, riester_annual / 12.0, years, 0.03)
    riester_nominal_income = riester_gross * 0.03 * max(0.0, 1.0 - state_tax_rate) / 12.0
    riester_real_income = riester_nominal_income / inflation_factor

    total_real = state_real_net + bav_real_income + private_real_income + riester_real_income
    total_nominal = state_nominal_net + bav_nominal_income + private_nominal_income + riester_nominal_income
    real_gap = max(0.0, target_real - total_real)
    nominal_gap = max(0.0, target_nominal - total_nominal)
    funded_ratio = total_real / target_real if target_real > 0 else 1.0
    required_real_capital = real_gap * 12.0 / max(0.01, withdrawal_rate)
    required_nominal_capital = required_real_capital * inflation_factor
    additional_monthly = _required_monthly(0.0, required_nominal_capital, years, selected_return)
    required_monthly_total = monthly_private + additional_monthly

    real_private_capital = private_tax["net"] / inflation_factor
    selected_real_return = (1.0 + selected_return) / (1.0 + inflation) - 1.0
    withdrawal_strategies = []
    for rate, label in ((0.03, "Durability first"), (0.035, "Balanced planning rate"), (0.04, "Higher initial income")):
        annual = real_private_capital * rate
        withdrawal_strategies.append({
            "rate": rate, "label": label, "real_monthly_income": round(annual / 12.0),
            "success_probability": round(_withdrawal_success(real_private_capital, annual, decumulation_years, selected_real_return, selected_volatility, 20260 + int(rate * 10_000)), 3),
        })

    age_scenarios: List[Dict[str, Any]] = []
    for scenario_age in sorted(set([max(age + 1, 63), 65, 67, min(70, max(retirement_age, 68))])):
        if scenario_age <= age or scenario_age > 70:
            continue
        scenario_years = scenario_age - age
        scenario_inflation = (1.0 + inflation) ** scenario_years
        scenario_ep = ep_past + ep_per_year * scenario_years
        scenario_state_nominal = scenario_ep * PENSION_VALUE_JULY_2026 * _access_factor(scenario_age) * ((1.0 + pension_growth) ** scenario_years) * state_net_factor
        scenario_private = _after_tax_private_capital(
            _future_value(initial_private, monthly_private, scenario_years, selected_return),
            initial_private + monthly_private * scenario_years * 12,
            bool(profile.get("is_married")), bool(profile.get("church_tax")),
        )["net"] * withdrawal_rate / 12.0
        scenario_real = (scenario_state_nominal + scenario_private) / scenario_inflation
        age_scenarios.append({
            "age": scenario_age, "access_factor": round(_access_factor(scenario_age), 3),
            "real_monthly_income": round(scenario_real), "real_gap": round(max(0.0, target_real - scenario_real)),
            "eligibility_unverified": scenario_age < REGULAR_RETIREMENT_AGE,
        })

    timeline = []
    for elapsed in sorted(set(list(range(0, years + 1, 5)) + [years])):
        gross = _future_value(initial_private, monthly_private, elapsed, selected_return)
        timeline.append({
            "age": age + elapsed, "nominal_capital": round(gross),
            "real_capital": round(gross / ((1.0 + inflation) ** elapsed)),
            "contributions": round(initial_private + monthly_private * elapsed * 12),
        })

    flags = []
    if recorded_ep is None:
        flags.append("Current Entgeltpunkte are missing; past points are estimated from today's income and years worked.")
    if retirement_age < REGULAR_RETIREMENT_AGE:
        flags.append("Early-retirement eligibility and waiting periods are not verified; the 0.3% monthly deduction is illustrative only.")
    flags.append("Retirement tax and health/care deductions are planning rates, not an individual tax assessment.")

    return {
        "model": {"name": "2026 retirement adequacy and decumulation lab", "version": "retirement-lab.v1", "year": MODEL_YEAR, "basis": "today-euro planning estimate"},
        "readiness": {"status": "incomplete" if recorded_ep is None else "ready_for_review", "flags": flags},
        "horizon": {"current_age": age, "retirement_age": retirement_age, "years": years, "longevity_age": longevity_age, "decumulation_years": decumulation_years},
        "target": {"current_net_monthly": round(current_net_monthly), "replacement_ratio": round(target_ratio, 3), "real_monthly": round(target_real), "nominal_monthly": round(target_nominal)},
        "statutory": {
            "ep_source": ep_source, "ep_past": round(ep_past, 2), "ep_future": round(ep_future, 2), "ep_total": round(ep_total, 2), "ep_per_future_year": round(ep_per_year, 3),
            "pension_value": PENSION_VALUE_JULY_2026, "access_factor": round(access, 3),
            "current_euro_gross": round(state_current_euro_gross), "nominal_gross": round(state_nominal_gross), "real_gross": round(state_real_gross),
            "nominal_net_estimate": round(state_nominal_net), "real_net_estimate": round(state_real_net),
            "health_care_rate": round(state_health_rate, 4), "tax_rate": round(state_tax_rate, 4),
        },
        "pillars": [
            {"id": "statutory", "label": "Statutory pension", "real_monthly": round(state_real_net), "nominal_monthly": round(state_nominal_net), "status": "estimated"},
            {"id": "bav", "label": "Company pension", "real_monthly": round(bav_real_income), "nominal_monthly": round(bav_nominal_income), "status": "modelled"},
            {"id": "private", "label": "Private portfolio", "real_monthly": round(private_real_income), "nominal_monthly": round(private_nominal_income), "status": "simulated"},
            {"id": "riester", "label": "Riester", "real_monthly": round(riester_real_income), "nominal_monthly": round(riester_nominal_income), "status": "simplified"},
        ],
        "totals": {"real_monthly": round(total_real), "nominal_monthly": round(total_nominal), "real_gap": round(real_gap), "nominal_gap": round(nominal_gap), "funded_ratio": round(funded_ratio, 3)},
        "private_capital": {key: round(value) for key, value in private_tax.items()},
        "withdrawal_strategies": withdrawal_strategies,
        "retirement_age_scenarios": age_scenarios,
        "savings_gap": {"required_real_capital": round(required_real_capital), "required_monthly_total": round(required_monthly_total), "additional_monthly": round(additional_monthly)},
        "timeline": timeline,
        "assumptions": {
            "selected_strategy": selected.get("name", "Balanced portfolio"), "expected_nominal_return": round(selected_return, 4), "expected_volatility": round(selected_volatility, 4),
            "inflation": round(inflation, 4), "pension_growth": round(pension_growth, 4), "withdrawal_rate": round(withdrawal_rate, 4),
            "bav_employer_subsidy": round(bav_subsidy, 4), "bav_retirement_deduction": round(bav_deduction, 4), "simulation_paths": 1_000,
        },
        "actions": [
            "Upload or transcribe the latest DRV Renteninformation and replace estimated past Entgeltpunkte.",
            "Verify early-retirement eligibility, credited periods and pension start date directly with DRV.",
            "Confirm bAV employer subsidy, guarantees, fees and retirement tax/health treatment from the contract.",
            "Select a withdrawal rate only after testing longevity, allocation, flexibility and sequence risk.",
            "Review the plan annually and after income, family, health or retirement-date changes.",
        ],
        "limitations": [
            "Market simulations are scenario tools, not forecasts or guarantees.",
            "The model does not reconstruct historical contribution records, pension splitting, survivor benefits or every credited period.",
            "Tax, KVdR/PVdR status, bAV social contributions and fund taxation require individual verification at retirement.",
        ],
        "sources": SOURCES,
    }
