"""Deterministic multi-strategy portfolio laboratory.

The module uses forward-looking capital-market assumptions, not forecasts.
Every strategy is simulated with the same random shocks so comparisons are
stable and attributable to allocation rather than sampling noise.
"""

from __future__ import annotations

import math
import random
from typing import Any, Dict, List


MODEL_ID = "multi-strategy-investment-lab"
MODEL_ASSUMPTION_VERSION = "advanced-investment-cma-illustrative-2026.1"

ASSETS: Dict[str, Dict[str, Any]] = {
    "world_equity": {"label": "Developed-world equity", "return": .067, "vol": .155, "yield": .018, "color": "#10251a"},
    "em_equity": {"label": "Emerging-market equity", "return": .074, "vol": .205, "yield": .026, "color": "#b8964f"},
    "quality_equity": {"label": "Quality / profitability equity", "return": .070, "vol": .145, "yield": .017, "color": "#3e6b52"},
    "small_value": {"label": "Global small-cap value", "return": .076, "vol": .195, "yield": .022, "color": "#6f815f"},
    "global_bonds": {"label": "EUR-hedged global bonds", "return": .033, "vol": .052, "yield": .035, "color": "#7892a1"},
    "inflation_bonds": {"label": "Euro inflation-linked bonds", "return": .030, "vol": .065, "yield": .025, "color": "#a6b9ad"},
    "listed_property": {"label": "Global listed property", "return": .058, "vol": .175, "yield": .036, "color": "#9b684b"},
    "gold": {"label": "Physical gold ETC", "return": .035, "vol": .150, "yield": 0, "color": "#d2ad4f"},
    "cash": {"label": "EUR money market / cash", "return": .022, "vol": .008, "yield": .022, "color": "#cbd4ca"},
}

INSTRUMENTS = {
    "vwce": {"name": "Vanguard FTSE All-World UCITS ETF (Acc)", "ticker": "VWCE", "isin": "IE00BK5BQT80", "ter": .0022, "role": "One-fund global equity core including developed and emerging markets.", "risk": "Equity, valuation and currency risk; capital can fall substantially."},
    "eunl": {"name": "iShares Core MSCI World UCITS ETF (Acc)", "ticker": "EUNL", "isin": "IE00B4L5Y983", "ter": .0020, "role": "Liquid developed-market core with broad company diversification.", "risk": "No emerging markets; equity and foreign-currency exposure."},
    "euna": {"name": "iShares Core Global Aggregate Bond EUR Hedged", "ticker": "EUNA", "isin": "IE00BDBRDM35", "ter": .0010, "role": "Diversified investment-grade bond stabilizer with EUR currency hedging.", "risk": "Duration, credit and interest-rate risk; hedging is imperfect."},
    "zprv": {"name": "SPDR MSCI USA Small Cap Value Weighted UCITS ETF", "ticker": "ZPRV", "isin": "IE00BSPLC413", "ter": .0030, "role": "Targeted size and value-factor satellite.", "risk": "Can underperform the broad market for long periods."},
    "iwdp": {"name": "iShares Developed Markets Property Yield UCITS ETF", "ticker": "IWDP", "isin": "IE00B1FZS350", "ter": .0059, "role": "Liquid listed real-estate exposure without direct-property concentration.", "risk": "Rate-sensitive and equity-like drawdowns; not a cash substitute."},
    "4gld": {"name": "Xetra-Gold", "ticker": "4GLD", "isin": "DE000A0S9GB0", "ter": 0.0, "role": "Physically backed crisis diversifier; one note represents one gram of gold.", "risk": "No income, issuer structure, storage fee and gold-price volatility."},
}

STRATEGIES: Dict[str, Dict[str, Any]] = {
    "global_core": {"name": "Global Market Core", "subtitle": "Maximum simplicity", "weights": {"world_equity": .85, "em_equity": .15}, "instruments": ["vwce"], "why": "Best when the priority is low complexity, high equity participation and minimal manager-selection risk."},
    "balanced_60_40": {"name": "Balanced 60/40", "subtitle": "Growth with ballast", "weights": {"world_equity": .52, "em_equity": .08, "global_bonds": .35, "cash": .05}, "instruments": ["eunl", "euna"], "why": "Reduces sequence and drawdown risk while retaining meaningful long-run equity exposure."},
    "factor_tilt": {"name": "Evidence Factor Tilt", "subtitle": "Long-horizon return premia", "weights": {"world_equity": .55, "em_equity": .10, "quality_equity": .20, "small_value": .15}, "instruments": ["eunl", "zprv"], "why": "Adds diversified quality and value/size exposures for investors able to tolerate tracking error."},
    "all_weather": {"name": "All-Weather Defensive", "subtitle": "Regime diversification", "weights": {"world_equity": .35, "global_bonds": .30, "inflation_bonds": .15, "gold": .15, "cash": .05}, "instruments": ["eunl", "euna", "4gld"], "why": "Spreads risk across growth, disinflation, inflation and crisis-sensitive assets rather than maximizing equity beta."},
    "real_asset_income": {"name": "Real-Asset Income", "subtitle": "Income and inflation sensitivity", "weights": {"world_equity": .40, "global_bonds": .20, "listed_property": .25, "gold": .10, "cash": .05}, "instruments": ["eunl", "euna", "iwdp", "4gld"], "why": "Adds listed property and gold for investors seeking income and real-asset diversification."},
}

TAXABLE_GAIN_SHARE = {
    "world_equity": .70,
    "em_equity": .70,
    "quality_equity": .70,
    "small_value": .70,
    "listed_property": .70,
    "global_bonds": 1.0,
    "inflation_bonds": 1.0,
    "cash": 1.0,
    "gold": 0.0,
}

EQUITY_ASSETS = {"world_equity", "em_equity", "quality_equity", "small_value"}
BOND_ASSETS = {"global_bonds", "inflation_bonds"}


def _asset_correlation(first: str, second: str) -> float:
    """Return the documented coarse asset-class correlation assumption."""
    if first == second:
        return 1.0
    pair = {first, second}
    if first in EQUITY_ASSETS and second in EQUITY_ASSETS:
        return .72
    if (first in BOND_ASSETS and second in EQUITY_ASSETS) or (
        second in BOND_ASSETS and first in EQUITY_ASSETS
    ):
        return -.05
    if "gold" in pair:
        return .08
    if "cash" in pair:
        return .05
    if "listed_property" in pair:
        return .48
    return .25


def _portfolio_moments(weights: Dict[str, float]) -> tuple[float, float, float]:
    expected = sum(weight * float(ASSETS[key]["return"]) for key, weight in weights.items())
    income_yield = sum(weight * float(ASSETS[key]["yield"]) for key, weight in weights.items())
    keys = list(weights)
    variance = 0.0
    for a in keys:
        for b in keys:
            corr = _asset_correlation(a, b)
            variance += weights[a] * weights[b] * float(ASSETS[a]["vol"]) * float(ASSETS[b]["vol"]) * corr
    return expected, math.sqrt(max(variance, 0)), income_yield


def _pct(values: List[float], percentile: float) -> float:
    ordered = sorted(values)
    return ordered[min(len(ordered) - 1, int((len(ordered) - 1) * percentile))]


def _simulate_strategy(strategy_id: str, initial: float, monthly: float, years: int,
                       inflation: float, target: float, seed: int, paths: int = 600,
                       annual_fee: float = 0.0) -> Dict[str, Any]:
    strategy = STRATEGIES[strategy_id]
    gross_mu, sigma, income_yield = _portfolio_moments(strategy["weights"])
    # The profile fee is the all-in annual cost assumption, not an extra TER.
    # Convert arithmetic expected return to log drift before applying shocks.
    mu = (1 + gross_mu) * (1 - annual_fee) - 1
    log_drift = math.log1p(gross_mu) - .5 * sigma * sigma + math.log1p(-annual_fee)
    terminal, real_terminal, drawdowns = [], [], []
    downside_squared = 0.0
    risk_free = .02
    snapshots: List[List[float]] = [[] for _ in range(years + 1)]
    rng = random.Random(seed)
    annual_contribution = monthly * 12
    for _ in range(paths):
        value = initial
        unit_value, peak, max_drawdown = 1.0, 1.0, 0.0
        snapshots[0].append(value)
        for year in range(1, years + 1):
            shock = rng.gauss(0, 1)
            annual_return = math.exp(log_drift + sigma * shock) - 1
            value = max(0, (value + annual_contribution / 2) * (1 + annual_return) + annual_contribution / 2)
            # Unitized performance excludes deposits from market drawdowns.
            unit_value *= 1 + annual_return
            peak = max(peak, unit_value)
            max_drawdown = max(max_drawdown, 1 - unit_value / peak)
            downside_squared += min(0.0, annual_return - risk_free) ** 2
            snapshots[year].append(value)
        terminal.append(value)
        real_terminal.append(value / ((1 + inflation) ** years))
        drawdowns.append(max_drawdown)
    p05, p10, p50, p90, p95 = [_pct(terminal, p) for p in (.05, .10, .50, .90, .95)]
    loss_threshold = initial + annual_contribution * years
    downside = sorted(terminal)[:max(1, int(paths * .05))]
    sharpe = (mu - risk_free) / sigma if sigma else 0
    downside_vol = math.sqrt(downside_squared / (paths * years))
    sortino = (mu - risk_free) / downside_vol if downside_vol else 0
    timeline = []
    for year in range(years + 1):
        values = snapshots[year]
        timeline.append({"year": year, "p10": round(_pct(values, .10)), "p50": round(_pct(values, .50)), "p90": round(_pct(values, .90)), "contributions": round(initial + annual_contribution * year)})
    return {
        "id": strategy_id, "name": strategy["name"], "subtitle": strategy["subtitle"], "why": strategy["why"],
        "expected_return": round(mu, 4), "expected_volatility": round(sigma, 4), "income_yield": round(income_yield, 4),
        "gross_expected_return": round(gross_mu, 4), "annual_fee_rate": annual_fee,
        "sharpe_ratio": round(sharpe, 2), "sortino_ratio": round(sortino, 2),
        "p05": round(p05), "p10": round(p10), "p50": round(p50), "p90": round(p90), "p95": round(p95),
        "real_p50": round(_pct(real_terminal, .50)), "expected_shortfall_95": round(sum(downside) / len(downside)),
        "probability_above_contributions": round(sum(v >= loss_threshold for v in terminal) / paths, 3),
        "probability_target": round(sum(v >= target for v in terminal) / paths, 3),
        "median_max_drawdown": round(_pct(drawdowns, .50), 4), "timeline": timeline,
        "allocation": [{"key": key, "name": ASSETS[key]["label"], "weight": weight, "color": ASSETS[key]["color"]} for key, weight in strategy["weights"].items()],
        "instruments": [INSTRUMENTS[key] for key in strategy["instruments"]],
    }


def _irr(cashflows: List[float]) -> float | None:
    """Annual IRR only for a conventional, bracketed cash-flow sequence.

    All-negative flows have no IRR; multiple sign changes may have multiple
    roots. Neither case should be turned into a plausible-looking percentage.
    """
    nonzero = [flow for flow in cashflows if flow != 0]
    if not nonzero or nonzero[0] >= 0 or nonzero[-1] <= 0:
        return None
    changes = sum((a > 0) != (b > 0) for a, b in zip(nonzero, nonzero[1:]))
    if changes != 1:
        return None

    def npv(rate: float) -> float:
        return sum(flow / ((1 + rate) ** period) for period, flow in enumerate(cashflows))

    low, high = -.9999, 2.0
    while npv(high) > 0 and high < 1024:
        high *= 2
    if npv(low) <= 0 or npv(high) >= 0:
        return None
    for _ in range(100):
        rate = (low + high) / 2
        if npv(rate) > 0:
            low = rate
        else:
            high = rate
    return (low + high) / 2


def _future_value(initial: float, monthly: float, years: int, annual_rate: float) -> float:
    periods = max(1, years * 12)
    monthly_rate = annual_rate / 12
    if abs(monthly_rate) < 1e-10:
        return initial + monthly * periods
    growth = (1 + monthly_rate) ** periods
    return initial * growth + monthly * (growth - 1) / monthly_rate


def _required_return(initial: float, monthly: float, years: int, target: float) -> float:
    if target <= _future_value(initial, monthly, years, 0):
        return 0.0
    low, high = 0.0, .50
    for _ in range(80):
        rate = (low + high) / 2
        if _future_value(initial, monthly, years, rate) < target:
            low = rate
        else:
            high = rate
    return (low + high) / 2


def _required_monthly(initial: float, years: int, target: float, annual_rate: float) -> float:
    periods = max(1, years * 12)
    monthly_rate = annual_rate / 12
    if abs(monthly_rate) < 1e-10:
        return max(0.0, (target - initial) / periods)
    growth = (1 + monthly_rate) ** periods
    return max(0.0, (target - initial * growth) * monthly_rate / (growth - 1))


def _required_years(initial: float, monthly: float, target: float, annual_rate: float) -> int:
    for years in range(1, 51):
        if _future_value(initial, monthly, years, annual_rate) >= target:
            return years
    return 50


def _tax_analysis(strategy: Dict[str, Any], profile: Dict[str, Any], initial: float,
                  monthly: float, years: int) -> Dict[str, Any]:
    contributions = initial + monthly * 12 * years
    gross_terminal = float(strategy["p50"])
    gross_gain = max(0.0, gross_terminal - contributions)
    weights = STRATEGIES[strategy["id"]]["weights"]
    taxable_share = sum(weight * TAXABLE_GAIN_SHARE[key] for key, weight in weights.items())
    jointly_assessed = profile.get("is_married", False) and profile.get("joint_assessment", False)
    allowance = 2000.0 if jointly_assessed else 1000.0
    capital_tax_rate = .27995 if profile.get("church_tax", False) else .26375
    taxable_gain = max(0.0, gross_gain * taxable_share - allowance)
    estimated_tax = taxable_gain * capital_tax_rate
    after_tax = max(0.0, gross_terminal - estimated_tax)
    return {
        "gross_terminal": round(gross_terminal),
        "cost_basis": round(contributions),
        "gross_gain": round(gross_gain),
        "taxable_gain_share": round(taxable_share, 4),
        "saver_allowance": round(allowance),
        "capital_tax_rate": round(capital_tax_rate, 5),
        "estimated_liquidation_tax": round(estimated_tax),
        "after_tax_terminal": round(after_tax),
        "tax_drag": round(gross_terminal - after_tax),
        "assumptions": [
            "25% capital-income tax plus 5.5% solidarity surcharge; church-tax case assumes a 9% church-tax jurisdiction.",
            "The €2,000 married saver allowance assumes joint assessment; otherwise the individual allowance is used.",
            "30% partial exemption is applied to qualifying equity-fund gains; bond and cash gains are fully taxable.",
            "Eligible physically backed gold ETC gains are modeled tax-free after a holding period above one year.",
            "Illustrative full liquidation at the horizon; annual distributions, advance lump sums, loss pots and broker-specific withholding are not modeled.",
        ],
    }


def _goal_optimizer(selected: Dict[str, Any], strategies: List[Dict[str, Any]],
                    initial: float, monthly: float, years: int, target: float) -> Dict[str, Any]:
    expected_return = float(selected["expected_return"])
    required_return = _required_return(initial, monthly, years, target)
    required_monthly = _required_monthly(initial, years, target, expected_return)
    required_years = _required_years(initial, monthly, target, expected_return)
    best_probability = max(strategies, key=lambda item: item["probability_target"])
    probability = float(selected["probability_target"])
    if probability >= .65:
        status = "on_track"
        headline = "The goal is statistically well funded under the selected assumptions."
    elif probability >= .40:
        status = "conditional"
        headline = "The goal is plausible, but the funding margin is not yet robust."
    else:
        status = "underfunded"
        headline = "The goal needs a funding, time, target or risk adjustment."
    return {
        "status": status,
        "headline": headline,
        "required_return": round(required_return, 4),
        "selected_expected_return": round(expected_return, 4),
        "deterministic_terminal": round(_future_value(initial, monthly, years, expected_return)),
        "required_monthly": round(required_monthly),
        "additional_monthly": round(max(0.0, required_monthly - monthly)),
        "required_years": required_years,
        "additional_years": max(0, required_years - years),
        "revised_target": round(selected["after_tax_terminal"]),
        "target_reduction": round(max(0.0, target - selected["after_tax_terminal"])),
        "best_probability_strategy": {
            "id": best_probability["id"],
            "name": best_probability["name"],
            "probability": best_probability["probability_target"],
            "expected_volatility": best_probability["expected_volatility"],
            "probability_improvement": round(best_probability["probability_target"] - probability, 3),
        },
        "levers": [
            {"id": "contribution", "title": "Increase contributions", "value": round(required_monthly), "delta": round(max(0.0, required_monthly - monthly)), "unit": "monthly"},
            {"id": "horizon", "title": "Extend the horizon", "value": required_years, "delta": max(0, required_years - years), "unit": "years"},
            {"id": "target", "title": "Reset the target", "value": round(selected["after_tax_terminal"]), "delta": round(max(0.0, target - selected["after_tax_terminal"])), "unit": "wealth"},
            {"id": "risk", "title": "Review the risk budget", "value": best_probability["probability_target"], "delta": round(best_probability["probability_target"] - probability, 3), "unit": "probability"},
        ],
    }


def _investment_policy(profile: Dict[str, Any], selected: Dict[str, Any], optimizer: Dict[str, Any]) -> Dict[str, Any]:
    essential_monthly = sum(float(profile.get(key, 0) or 0) for key in ("housing_cost", "living_cost", "mobility_cost"))
    reserve_months = float(profile.get("liquid_savings", 0) or 0) / essential_monthly if essential_monthly else 0
    debt_rate = float(profile.get("unsecured_debt_rate", 0) or 0)
    debt = float(profile.get("unsecured_debt", 0) or 0)
    flags = []
    if profile.get("investment_liquidity") == "short" or int(profile.get("investment_years", 20)) <= 3:
        flags.append({"level": "gate", "title": "Short-term capital requirement",
                      "detail": "No growth-portfolio match is suitable for automatic implementation when capital is needed within three years."})
    loss_tolerance = profile.get("investment_loss_tolerance") or profile.get("risk_profile", "medium")
    if loss_tolerance == "low" or profile.get("investment_priority") == "stability":
        flags.append({"level": "gate", "title": "Capital-preservation review required",
                      "detail": "These growth portfolios cannot guarantee capital stability or a 10% loss limit."})
    max_vol = {"low": .06, "medium": .12, "high": 1.0}.get(loss_tolerance, .12)
    if selected.get("expected_volatility", 0) > max_vol:
        flags.append({"level": "gate", "title": "Strategy volatility exceeds stated risk tolerance",
                      "detail": f"The selected strategy has {selected.get('expected_volatility', 0) * 100:.1f}% modeled volatility, "
                                 f"which exceeds the {max_vol * 100:.0f}% ceiling implied by the stated loss tolerance."})
    if reserve_months < 3:
        flags.append({"level": "gate", "title": "Liquidity reserve below policy minimum", "detail": f"{reserve_months:.1f} months funded versus a 3-month minimum."})
    if debt > 0 and debt_rate > .06:
        flags.append({"level": "gate", "title": "High-cost unsecured debt", "detail": f"Debt costing {debt_rate * 100:.1f}% should generally be prioritized before additional market risk."})
    return {
        "objective": f"Fund a €{float(profile.get('target_wealth', 0)):,.0f} target over {int(profile.get('investment_years', 20))} years.",
        "strategy": selected["name"],
        "status": optimizer["status"],
        "reserve_months": round(reserve_months, 1),
        "suitability_flags": flags,
        "execution_status": "gated" if flags else "eligible_for_review",
        "rebalancing_rule": "Review annually and rebalance when an allocation drifts by ±5 percentage points.",
        "tax_policy": "Use the saver allowance deliberately, prefer tax-efficient fund wrappers, and verify advance lump-sum and loss-pot treatment annually.",
        "monitoring_rule": "Review after a material goal, income, family, tax-law or liquidity change; ignore ordinary market noise.",
    }


def _real_estate_case(profile: Dict[str, Any], years: int) -> Dict[str, Any]:
    price = max(0.0, float(profile.get("property_price", 350000) or 0))
    down_payment = min(price, max(0.0, float(profile.get("property_down_payment", 70000) or 0)))
    rate = max(0.0, float(profile.get("mortgage_rate", .04) or 0))
    amortization_rate = max(0.0, float(profile.get("mortgage_amortization", .02) or 0))
    gross_yield = max(0.0, float(profile.get("gross_rental_yield", .035) or 0))
    appreciation = max(-.20, float(profile.get("property_appreciation", .02) or 0))
    loan = price - down_payment
    transaction_cost = price * .10
    annual_rent = price * gross_yield
    fixed_operating = price * .012
    net_rent = annual_rent * .95  # 5% variable operating allowance
    monthly_payment = loan * (rate + amortization_rate) / 12
    balance = loan
    monthly_rate = rate / 12
    schedule = []
    annual_flows = []
    total_debt_service = 0.0
    for year in range(1, years + 1):
        debt_service = 0.0
        for _ in range(12):
            interest = balance * monthly_rate
            payment = min(monthly_payment, balance + interest)
            balance = max(0.0, balance + interest - payment)
            debt_service += payment
        cash_flow = net_rent - fixed_operating - debt_service
        annual_flows.append(cash_flow)
        total_debt_service += debt_service
        schedule.append({"year": year, "debt_service": round(debt_service),
                         "net_cash_flow": round(cash_flow), "remaining_loan": round(balance)})
    annual_debt_service = schedule[0]["debt_service"]
    annual_cash_flow = annual_flows[0]
    future_value = price * ((1 + appreciation) ** years)
    remaining_loan = balance
    principal_paydown = loan - remaining_loan
    equity_exit = future_value * .965 - remaining_loan
    invested_equity = down_payment + transaction_cost
    cashflows = [-invested_equity] + annual_flows
    cashflows[-1] += equity_exit
    contributed = -sum(min(0, flow) for flow in cashflows)
    distributions = sum(max(0, flow) for flow in cashflows)
    equity_multiple = distributions / contributed if contributed else None
    irr = _irr(cashflows)
    occupancy = (fixed_operating + annual_debt_service) / net_rent if net_rent else None
    if occupancy is None:
        occupancy_status = "no_rental_income"
        occupancy_detail = "No rental income is modeled, so a break-even occupancy rate cannot be calculated."
    elif occupancy <= 1:
        occupancy_status = "feasible"
        occupancy_detail = f"Break-even at {occupancy * 100:.1f}% occupancy — the modeled rent covers debt service and fixed costs."
    else:
        occupancy_status = "infeasible"
        occupancy_detail = (f"Break-even requires {occupancy * 100:.1f}% occupancy, which exceeds 100%. "
                           "Full occupancy cannot cover the modeled debt service and operating costs in year one.")
    return {
        "price": round(price), "down_payment": round(down_payment), "loan": round(loan),
        "transaction_cost": round(transaction_cost), "horizon_years": years,
        "monthly_mortgage_payment": round(monthly_payment),
        "annual_net_cash_flow": round(annual_cash_flow), "annual_debt_service": annual_debt_service,
        "total_debt_service": round(total_debt_service), "cash_flow_schedule": schedule,
        "principal_paydown": round(principal_paydown), "remaining_loan": round(remaining_loan),
        "exit_equity": round(equity_exit),
        "equity_multiple": round(equity_multiple, 2) if equity_multiple is not None else None,
        "levered_irr": round(irr, 4) if irr is not None else None,
        "irr_status": "calculated" if irr is not None else "not_uniquely_defined",
        "break_even_occupancy": round(occupancy, 3) if occupancy is not None else None,
        "occupancy_feasible": occupancy is not None and occupancy <= 1,
        "occupancy_status": occupancy_status,
        "occupancy_detail": occupancy_detail,
        "warning": "Illustrative property case with flat rents, 1.2% fixed operating costs, 5% variable operating costs and 3.5% exit costs. Cash flow and occupancy show year one; payments stop at payoff. Negative exit equity is shown where applicable. Excludes personal tax, major renovation, acquisition financing fees and local rent regulation.",
    }


def build_investment_lab(profile: Dict[str, Any]) -> Dict[str, Any]:
    initial = float(profile.get("initial_amount", 5000) or 0)
    monthly = float(profile.get("monthly_investment", 500) or 0)
    years = max(1, min(60, int(profile.get("investment_years", 20) or 20)))
    inflation_value = profile.get("expected_inflation")
    inflation = .02 if inflation_value is None else float(inflation_value)
    fee_value = profile.get("management_fee")
    annual_fee = .0018 if fee_value is None else float(fee_value)
    if not math.isfinite(annual_fee) or not 0 <= annual_fee <= .10:
        raise ValueError("management_fee must be a finite rate between 0 and 0.10")
    target = float(profile.get("target_wealth", 250000) or 0)
    strategies = [_simulate_strategy(key, initial, monthly, years, inflation, target, 9173, annual_fee=annual_fee) for key in STRATEGIES]
    for strategy in strategies:
        strategy["tax"] = _tax_analysis(strategy, profile, initial, monthly, years)
        strategy["after_tax_terminal"] = strategy["tax"]["after_tax_terminal"]
    selected_id = profile.get("investment_strategy", "balanced_60_40")
    if selected_id not in STRATEGIES:
        selected_id = "balanced_60_40"
    selected = next(item for item in strategies if item["id"] == selected_id)
    optimizer = _goal_optimizer(selected, strategies, initial, monthly, years, target)
    policy = _investment_policy(profile, selected, optimizer)
    stresses = {
        "global_core": {"gfc": -.43, "covid": -.28, "rate_shock": -.16, "stagflation": -.22},
        "balanced_60_40": {"gfc": -.25, "covid": -.17, "rate_shock": -.18, "stagflation": -.14},
        "factor_tilt": {"gfc": -.46, "covid": -.31, "rate_shock": -.17, "stagflation": -.20},
        "all_weather": {"gfc": -.14, "covid": -.11, "rate_shock": -.13, "stagflation": -.07},
        "real_asset_income": {"gfc": -.28, "covid": -.22, "rate_shock": -.19, "stagflation": -.09},
    }
    return {"selected_strategy": selected_id, "strategies": strategies, "selected": selected,
            "target_wealth": round(target), "goal_optimizer": optimizer,
            "tax_analysis": selected["tax"], "investment_policy": policy,
            "real_estate": _real_estate_case(profile, years),
            "stress_matrix": [{"id": item["id"], "name": item["name"], **stresses[item["id"]]} for item in strategies],
            "methodology": {
                "model_id": MODEL_ID,
                "assumption_version": MODEL_ASSUMPTION_VERSION,
                "simulations_per_strategy": 600, "seed": 9173,
                "return_model": "Lognormal annual returns using fixed portfolio covariance assumptions and mid-year cash-flow timing",
                "fee_model": "Profile management_fee is the all-in annual portfolio cost, deducted multiplicatively. Listed instrument TERs are examples, not additional charges.",
                "annual_fee_rate": annual_fee,
                "risk_model": "Drawdown uses a unitized index excluding deposits, sampled annually (not intra-year). Sortino uses simulated downside deviation below a 2% annual target; Sharpe uses model moments.",
                "tax_model": "Illustrative German private-investor horizon-liquidation estimate using 2026 statutory baseline assumptions",
                "basis": "Forward-looking nominal capital-market assumptions; results are distributions, not predictions.",
                "value_basis": "Strategy percentiles are nominal EUR; real_p50 is discounted using expected_inflation; after_tax_terminal is an illustrative horizon-liquidation estimate.",
                "limitations": [
                    "Sampling stability does not validate the capital-market assumptions.",
                    "Returns are sampled annually and do not capture intra-year drawdowns or changing regimes.",
                    "Instrument names illustrate implementation candidates and are not personal recommendations.",
                ],
            }}
