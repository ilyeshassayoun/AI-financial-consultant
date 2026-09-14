"""Automated test suite for historical crisis stress testing and SRR laboratory (R1).

Verifies mathematical reproducibility, peak-to-trough drawdown %, recovery horizon,
real purchasing power erosion, and fragile decumulation Sequence-of-Returns Risk.
"""

import pytest
from fastapi.testclient import TestClient
from main import app
from stress_test_engine import (
    HISTORICAL_REGIMES,
    STANDARD_STRATEGY_WEIGHTS,
    resolve_strategy_weights,
    compute_weighted_annual_returns,
    run_stress_test_simulation,
    evaluate_decumulation_srr,
)

client = TestClient(app)


def test_historical_regimes_benchmark_data_integrity():
    """Verify historical crisis return profiles match verified macroeconomic benchmarks."""
    # 2008 GFC
    gfc = HISTORICAL_REGIMES["gfc_2008"]
    assert gfc["start_year"] == 2007
    assert gfc["trough_year"] == 2009
    assert gfc["annual_returns"][2008]["world_equity"] == -0.407
    assert gfc["annual_returns"][2008]["em_equity"] == -0.533
    assert gfc["annual_returns"][2008]["global_bonds"] == 0.052
    assert gfc["annual_returns"][2009]["world_equity"] == 0.300

    # 2000 Dot-com
    dotcom = HISTORICAL_REGIMES["dotcom_2000"]
    assert dotcom["annual_returns"][2000]["world_equity"] == -0.132
    assert dotcom["annual_returns"][2001]["world_equity"] == -0.168
    assert dotcom["annual_returns"][2002]["world_equity"] == -0.199

    # 1973 Stagflation
    stag = HISTORICAL_REGIMES["stagflation_1973"]
    assert stag["annual_returns"][1973]["cpi"] == 0.088
    assert stag["annual_returns"][1974]["cpi"] == 0.122
    assert stag["annual_returns"][1973]["gold"] == 0.735


def test_strategy_weight_resolution_and_normalization():
    """Verify standard strategies resolve correctly and custom weights normalize properly."""
    core = resolve_strategy_weights("global_core")
    assert pytest.approx(core["world_equity"], 1e-4) == 0.85
    assert pytest.approx(core["em_equity"], 1e-4) == 0.15

    balanced = resolve_strategy_weights("balanced")
    assert pytest.approx(sum(balanced.values()), 1e-4) == 1.0

    # Custom weights normalization
    custom = resolve_strategy_weights("custom", custom_weights={"world_equity": 50, "global_bonds": 50})
    assert pytest.approx(custom["world_equity"], 1e-4) == 0.5
    assert pytest.approx(custom["global_bonds"], 1e-4) == 0.5

    with pytest.raises(ValueError):
        resolve_strategy_weights("custom", custom_weights={"world_equity": 0, "cash": 0})


def test_gfc_2008_simulation_max_drawdown_and_recovery():
    """Verify 2008 GFC shock simulation reproduces expected drawdown depth and multi-year recovery."""
    res = run_stress_test_simulation(
        scenario="gfc_2008",
        strategy="global_core",
        initial_capital=100000.0,
        monthly_cashflow=0.0,
        is_decumulation=False,
    )

    assert res["scenario"] == "gfc_2008"
    assert res["max_drawdown_pct"] < -0.40  # Global core equity drawdown exceeds -40%
    assert res["recovery_horizon_years"] > 3.0  # Takes multiple years to recover peak
    assert res["trough_year"] in (2008, 2009)
    assert 0.0 <= res["srr_metrics"]["survival_probability"] <= 1.0
    assert res["srr_metrics"]["survival_probability"] >= 0.4
    assert res["srr_metrics"]["ruin_probability"] == round(1.0 - res["srr_metrics"]["survival_probability"], 2)



def test_stagflation_1973_nominal_vs_real_purchasing_power_destruction():
    """Verify 1973 stagflation causes severe real purchasing power loss due to double-digit inflation."""
    res = run_stress_test_simulation(
        scenario="stagflation_1973",
        strategy="balanced",
        initial_capital=100000.0,
        monthly_cashflow=0.0,
        is_decumulation=False,
    )

    # Real drawdown is deeper than nominal drawdown because cumulative inflation > 20%
    assert res["max_drawdown_real_pct"] < res["max_drawdown_pct"]
    assert res["terminal_real_value"] < res["terminal_nominal_value"]


def test_zero_capital_edge_case_handles_gracefully():
    """Verify zero capital does not produce NaN or division by zero."""
    res = run_stress_test_simulation(
        scenario="gfc_2008",
        strategy="global_core",
        initial_capital=0.0,
        monthly_cashflow=0.0,
    )
    assert res["max_drawdown_pct"] == 0.0
    assert res["recovery_horizon_years"] == 0.0
    assert res["terminal_nominal_value"] == 0.0


def test_sequence_of_returns_risk_decumulation_divergence():
    """Verify adverse returns early in retirement permanently deplete capital compared to late shocks."""
    annual_rets = [-0.25, -0.20, -0.15, 0.15, 0.20]
    cpi_rates = [0.03, 0.03, 0.03, 0.02, 0.02]

    srr = evaluate_decumulation_srr(
        initial_capital=500000.0,
        annual_returns=annual_rets,
        cpi_rates=cpi_rates,
        monthly_withdrawal=2000.0,
        decumulation_years=25,
    )

    assert 0.0 <= srr["survival_probability"] <= 1.0
    assert srr["ruin_probability"] == round(1.0 - srr["survival_probability"], 2)
    assert srr["safe_withdrawal_rate_calibrated"] <= 0.04

    # Divergence: early adverse returns lead to lower terminal wealth than delayed crisis
    div = srr["early_vs_late_terminal_divergence"]
    assert div["early_crisis_terminal_wealth"] < div["late_crisis_terminal_wealth"]


def test_api_stress_test_endpoint_success():
    """Verify POST /api/lab/stress-test returns valid JSON matching interface contract."""
    payload = {
        "scenario": "gfc_2008",
        "strategy": "global_core",
        "initial_capital": 150000.0,
        "monthly_cashflow": 500.0,
        "horizon_years": 5,
        "is_decumulation": False,
    }
    resp = client.post("/api/lab/stress-test", json=payload)
    assert resp.status_code == 200
    data = resp.json()

    assert data["scenario"] == "gfc_2008"
    assert "max_drawdown_pct" in data
    assert "recovery_horizon_years" in data
    assert "trajectory" in data
    assert "srr_metrics" in data
    assert len(data["trajectory"]) > 0
    assert "survival_probability" in data["srr_metrics"]


def test_api_stress_test_invalid_scenario_returns_422():
    """Verify invalid scenario parameter raises 422."""
    payload = {
        "scenario": "invalid_alien_invasion_2099",
        "strategy": "global_core",
    }
    resp = client.post("/api/lab/stress-test", json=payload)
    assert resp.status_code == 422
    assert "Invalid crisis scenario" in resp.json()["detail"]


def test_stress_engine_diversified_equity_recovery_horizon():
    """Verify diversified equity portfolios (factor_tilt: 55% world, 10% EM, 20% quality, 15% small_value)

    correctly aggregate total equity > 0.6 and receive benchmark 5.2-year recovery horizon rather than 2.3-year.
    """
    # Factor tilt has world_equity=0.55 <= 0.6, but total_equity=1.00 > 0.6
    res_factor = run_stress_test_simulation(
        scenario="gfc_2008",
        strategy="factor_tilt",
        initial_capital=100000.0,
        monthly_cashflow=0.0,
        horizon_years=2,  # Truncated so fallback applies
    )
    assert res_factor["recovery_horizon_years"] == 5.2

    # Custom diversified portfolio with 50% World, 20% EM, 30% Quality (total = 1.0 > 0.6)
    res_custom = run_stress_test_simulation(
        scenario="gfc_2008",
        strategy="custom",
        initial_capital=100000.0,
        monthly_cashflow=0.0,
        horizon_years=2,
        asset_weights={"world_equity": 0.50, "em_equity": 0.20, "quality_equity": 0.30},
    )
    assert res_custom["recovery_horizon_years"] == 5.2

    # Balanced portfolio with total_equity = 0.60 (not > 0.6) receives 2.3 years
    res_balanced = run_stress_test_simulation(
        scenario="gfc_2008",
        strategy="balanced",
        initial_capital=100000.0,
        monthly_cashflow=0.0,
        horizon_years=2,
    )
    assert res_balanced["recovery_horizon_years"] == 2.3

