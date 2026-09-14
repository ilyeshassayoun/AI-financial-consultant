"""Independent reference fixtures and sampling-stability diagnostics."""

import json
import math
from pathlib import Path

import pytest

from investment_engine import _apply_german_capital_gains_tax, simulate_investment
from model_validation import investment_convergence_report
from tax_calculator import _calculate_grundtarif


FIXTURES = Path(__file__).parent / "fixtures"


def test_2026_tariff_matches_published_reference_cases():
    reference = json.loads((FIXTURES / "tax_2026_reference_cases.json").read_text(encoding="utf-8"))
    assert reference["source"].startswith("https://www.gesetze-im-internet.de/estg/")
    for case in reference["cases"]:
        actual = _calculate_grundtarif(case["taxable_income_eur"])
        assert actual == pytest.approx(case["expected_tariff_tax_eur"], abs=reference["tolerance_eur"]), case["name"]


def test_investment_convergence_is_measured_against_larger_reference_run():
    report = investment_convergence_report()
    assert report["status"] == "stable"
    assert report["reference_simulation_count"] == 4_000
    assert report["runs"][-2]["max_relative_deviation"] <= report["tolerance"]
    assert "does not" in report["interpretation"]


def test_higher_fee_cannot_improve_identical_household_projection():
    baseline = simulate_investment(10_000, 500, 20, "medium", management_fee=0, seed=77)
    costly = simulate_investment(10_000, 500, 20, "medium", management_fee=0.02, seed=77)
    for field in ("projected_p10", "projected_p50", "projected_p90", "real_p50"):
        assert costly[field] < baseline[field]


def test_negative_gain_does_not_consume_saver_allowance():
    tax, allowance_used = _apply_german_capital_gains_tax(-500, 200)
    assert tax == 0
    assert allowance_used == 200


@pytest.mark.parametrize(
    "kwargs",
    [
        {"initial_amount": math.inf},
        {"monthly_contribution": -1},
        {"years": 0},
        {"num_simulations": 0},
        {"inflation_rate": -1},
        {"management_fee": 0.11},
    ],
)
def test_projection_rejects_invalid_direct_call_inputs(kwargs):
    inputs = {
        "initial_amount": 10_000,
        "monthly_contribution": 500,
        "years": 20,
        "risk_profile": "medium",
        "num_simulations": 25,
    }
    with pytest.raises(ValueError):
        simulate_investment(**{**inputs, **kwargs})
