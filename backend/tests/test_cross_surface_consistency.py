"""Ensure summaries and exports preserve canonical analysis values."""

from analysis import run_full_analysis
from routers.audit import _build_dossier
from schemas import ClientProfile


def test_audit_dossier_matches_the_canonical_analysis_result():
    profile = ClientProfile(
        age=35,
        income=75_000,
        monthly_investment=650,
        initial_amount=15_000,
        retirement_age=67,
        expected_inflation=0.02,
        management_fee=0.0018,
    )
    analysis = run_full_analysis(profile)
    dossier = _build_dossier(profile, analysis_override=analysis)["dossier"]
    exported = dossier["statutory_outputs"]

    assert exported["tax"]["income_tax"] == analysis["tax"]["details"]["income_tax"]
    assert exported["tax"]["solidarity_surcharge"] == analysis["tax"]["details"]["solidarity_surcharge"]
    assert exported["tax"]["net_income"] == analysis["tax"]["net_income"]
    assert exported["tax"]["parameter_version"] == analysis["tax"]["calculation_basis"]["parameter_version"]

    assert exported["investment"]["projected_p50"] == analysis["investment"]["projected_p50"]
    assert exported["investment"]["real_p50"] == analysis["investment"]["real_p50"]
    assert exported["investment"]["model_id"] == "household-investment-projection"

    assert exported["retirement"]["pension_gap_monthly"] == analysis["retirement"]["pension_gap_monthly"]
    assert exported["retirement"]["replacement_ratio"] == analysis["retirement"]["replacement_ratio"]


def test_nominal_and_real_values_are_explicitly_distinguished_in_export():
    profile = ClientProfile(age=35, retirement_age=67, expected_inflation=0.03)
    analysis = run_full_analysis(profile)
    investment = _build_dossier(profile, analysis_override=analysis)["dossier"]["statutory_outputs"]["investment"]

    assert investment["real_p50"] < investment["projected_p50"]
    assert "nominal EUR" in investment["value_basis"]["projected_percentiles"]
    assert "purchasing power" in investment["value_basis"]["real_percentiles"]
