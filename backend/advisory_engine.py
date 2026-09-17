"""Holistic, explainable financial-planning engine.

The calculations in this module deliberately separate facts, assumptions and
recommendations.  It is deterministic so every recommendation can be audited
and regression-tested; an LLM may explain the plan, but never invent it.
"""

from __future__ import annotations

from typing import Any, Dict, List


def _money(value: float) -> float:
    return round(max(0.0, float(value)), 2)


def _monthly_payment(principal: float, annual_rate: float, years: int) -> float:
    if principal <= 0 or years <= 0:
        return 0.0
    monthly_rate = max(0.0, annual_rate) / 12
    months = years * 12
    if monthly_rate == 0:
        return principal / months
    return principal * monthly_rate / (1 - (1 + monthly_rate) ** -months)


def build_advisory_plan(
    profile: Dict[str, Any],
    tax: Dict[str, Any],
    investment: Dict[str, Any],
    retirement: Dict[str, Any],
) -> Dict[str, Any]:
    """Return a suitability-aware household plan and stress-test dashboard."""
    gross_annual = float(profile.get("income", 0))
    net_annual = float(tax.get("net_income", 0))
    net_monthly = net_annual / 12
    secondary_income = float(profile.get("secondary_income", 0) or 0)
    essential_costs = sum(float(profile.get(k, 0) or 0) for k in (
        "housing_cost", "living_cost", "mobility_cost",
    ))
    discretionary_costs = sum(float(profile.get(k, 0) or 0) for k in (
        "leisure_cost", "subscriptions_cost", "travel_cost",
    ))
    debt_payment = float(profile.get("monthly_debt_payment", 0) or 0)
    monthly_investment = float(profile.get("monthly_investment", 0) or 0)
    total_income = net_monthly + secondary_income
    available_before_planned_investing = total_income - essential_costs - discretionary_costs - debt_payment
    free_cash_flow = available_before_planned_investing - monthly_investment
    savings_capacity = max(0.0, available_before_planned_investing)
    savings_rate = savings_capacity / total_income if total_income else 0
    debt_service_ratio = debt_payment / total_income if total_income else 0

    liquid_assets = float(profile.get("liquid_savings", profile.get("initial_amount", 0)) or 0)
    dependents = int(profile.get("num_children", 0) or 0) + int(bool(profile.get("has_dependents")))
    employment_stability = profile.get("employment_stability", "stable")
    reserve_months = 3 + min(2, dependents) + (3 if employment_stability == "variable" else 0)
    reserve_target = essential_costs * reserve_months
    reserve_gap = max(0.0, reserve_target - liquid_assets)
    current_reserve_months = liquid_assets / essential_costs if essential_costs else 0

    unsecured_debt = float(profile.get("unsecured_debt", 0) or 0)
    debt_rate = float(profile.get("unsecured_debt_rate", 0.08) or 0)
    debt_years = int(profile.get("debt_payoff_years", 5) or 5)
    required_debt_payment = _monthly_payment(unsecured_debt, debt_rate, debt_years)
    # Paying down consumer debt avoids the contractual interest rate. Applying
    # the household's income-tax rate here understated that benefit and implied
    # a tax treatment that is not generally available for private debt.
    debt_avoidance_rate = debt_rate

    age = int(profile.get("age", 30))
    retirement_age = int(profile.get("retirement_age", 67))
    remaining_years = max(1, retirement_age - age)
    target_income_cover = 0.75
    bu_target = net_monthly * target_income_cover
    existing_bu = float(profile.get("bu_monthly_benefit", 0) or 0)
    bu_gap = max(0.0, bu_target - existing_bu)
    life_cover_need = max(0.0, essential_costs * 12 * (8 if dependents else 2) + unsecured_debt - liquid_assets)

    p10 = float(investment.get("projected_p10", 0) or 0)
    p50 = float(investment.get("projected_p50", 0) or 0)
    p90 = float(investment.get("projected_p90", 0) or 0)
    total_contributions = float(investment.get("total_contributions", 0) or 0)
    downside_ratio = p10 / total_contributions if total_contributions else 0
    pension_gap = float(retirement.get("pension_gap_monthly", 0) or 0)
    retirement_funding_ratio = float(retirement.get("replacement_ratio", 0) or 0)

    job_loss_runway = liquid_assets / essential_costs if essential_costs else 0
    high_inflation_real_income = total_income / (1.04 ** 5)
    market_shock_loss = liquid_assets * 0.0 + float(profile.get("initial_amount", 0) or 0) * 0.30
    stressed_liquid_assets = max(0.0, liquid_assets - market_shock_loss)

    actions: List[Dict[str, Any]] = []

    def add_action(action_id: str, title: str, rationale: str, monthly: float,
                   priority: int, horizon: str, success_metric: str, category: str) -> None:
        actions.append({
            "id": action_id,
            "title": title,
            "rationale": rationale,
            "monthly_commitment": _money(monthly),
            "priority": priority,
            "horizon": horizon,
            "success_metric": success_metric,
            "category": category,
        })

    if reserve_gap > 0:
        reserve_monthly = min(max(100.0, savings_capacity * 0.35), reserve_gap / 12)
        add_action(
            "fund-reserve", "Close the emergency-liquidity gap",
            f"Your reserve covers {current_reserve_months:.1f} months versus a {reserve_months}-month target.",
            reserve_monthly, 1, "0–12 months", f"Reach €{reserve_target:,.0f} in instant-access cash", "Liquidity",
        )
    if unsecured_debt > 0 and debt_rate >= 0.06:
        additional_debt_payment = max(0.0, required_debt_payment - debt_payment)
        add_action(
            "repay-debt", "Accelerate expensive unsecured debt",
            f"Repayment avoids interest near {debt_avoidance_rate*100:.1f}% before any case-specific tax effects.",
            additional_debt_payment, 1, f"Within {debt_years} years", "Unsecured balance reaches €0", "Debt",
        )
    if bu_gap > 50:
        add_action(
            "protect-income", "Close the occupational-disability income gap",
            f"The modeled benefit target is 75% of net income; the uncovered gap is €{bu_gap:,.0f}/month.",
            0, 1, "Within 30 days", f"BU benefit of at least €{bu_target:,.0f}/month", "Protection",
        )
    required_savings = float(retirement.get("required_monthly_savings_to_close_gap", 0) or 0)
    if pension_gap > 0:
        add_action(
            "fund-retirement", "Fund the retirement shortfall",
            f"The base case leaves a real pension gap of €{pension_gap:,.0f}/month.",
            required_savings, 2, "Start this quarter", "Base-case retirement funding ratio ≥ 100%", "Retirement",
        )
    if monthly_investment > 0 and debt_rate < 0.06:
        add_action(
            "automate-investing", "Automate the strategic asset allocation",
            f"The modeled range at the horizon is €{p10:,.0f}–€{p90:,.0f}; €{p50:,.0f} is a median, not a promise.",
            monthly_investment, 3, "Monthly", "Annual rebalance and allocation drift below 5 percentage points", "Investment",
        )

    actions.sort(key=lambda item: (item["priority"], item["category"]))
    priority_one_commitment = sum(a["monthly_commitment"] for a in actions if a["priority"] == 1)
    capacity_after_priority_ones = free_cash_flow - priority_one_commitment
    current_plan_feasible = free_cash_flow >= -25
    plan_feasible = current_plan_feasible and capacity_after_priority_ones >= -25
    if not plan_feasible:
        for action in actions:
            if action["priority"] > 1:
                action["status"] = "sequence_after_foundation"

    score_components = {
        "liquidity": min(20.0, current_reserve_months / max(1, reserve_months) * 20),
        "cash_flow": min(20.0, max(0.0, savings_rate) / 0.20 * 20),
        "debt": max(0.0, 20.0 - debt_service_ratio / 0.25 * 20),
        "protection": 20.0 if bu_gap <= 50 else max(0.0, 20.0 - bu_gap / max(1, bu_target) * 20),
        "retirement": min(20.0, retirement_funding_ratio * 20),
    }
    score = round(sum(score_components.values()))

    return {
        "as_of": "2026 planning basis — verify statutory thresholds annually",
        "scope": "Deterministic household suitability and scenario analysis; educational planning, not regulated advice.",
        "household_kpis": {
            "net_monthly_income": _money(total_income),
            "essential_monthly_spend": _money(essential_costs),
            "free_cash_flow_after_investing": round(free_cash_flow, 2),
            "available_before_planned_investing": round(available_before_planned_investing, 2),
            "priority_action_capacity": round(capacity_after_priority_ones, 2),
            "current_plan_feasible": current_plan_feasible,
            "savings_rate": round(savings_rate, 4),
            "debt_service_ratio": round(debt_service_ratio, 4),
            "emergency_fund_months": round(current_reserve_months, 1),
            "emergency_fund_target": _money(reserve_target),
            "retirement_funding_ratio": round(retirement_funding_ratio, 4),
        },
        "protection_needs": {
            "bu_target_monthly": _money(bu_target),
            "bu_gap_monthly": _money(bu_gap),
            "life_cover_need": _money(life_cover_need),
            "human_capital_years": remaining_years,
        },
        "portfolio_suitability": {
            "risk_profile": profile.get("risk_profile", "medium"),
            "p10": _money(p10), "p50": _money(p50), "p90": _money(p90),
            "downside_funding_ratio": round(downside_ratio, 3),
            "interpretation": "P10 is an adverse modeled outcome, P50 is the median, and P90 is optimistic; none is guaranteed.",
        },
        "stress_tests": [
            {"name": "Six-month income interruption", "result": "pass" if job_loss_runway >= 6 else "vulnerable", "metric": f"{job_loss_runway:.1f} months of essential costs funded"},
            {"name": "4% inflation for five years", "result": "watch", "metric": f"Current monthly income equals €{high_inflation_real_income:,.0f} in today's purchasing power"},
            {"name": "30% immediate market decline", "result": "pass" if stressed_liquid_assets >= essential_costs * 3 else "vulnerable", "metric": f"€{market_shock_loss:,.0f} modeled mark-to-market loss"},
        ],
        "action_plan": actions,
        "plan_feasible": plan_feasible,
        "financial_resilience_score": score,
        "score_components": {k: round(v, 1) for k, v in score_components.items()},
        "assumptions": [
            "Cash-flow costs are monthly and income is annual gross unless explicitly labelled otherwise.",
            "Emergency reserves are held in liquid, low-volatility accounts and are not invested in equities.",
            "Tax, social-security and pension calculations are estimates; filing facts and future law can change outcomes.",
            "Market percentiles are simulations based on model assumptions, not forecasts or guarantees.",
        ],
    }
