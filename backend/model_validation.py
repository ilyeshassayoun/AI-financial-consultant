"""Repeatable validation diagnostics for financial model releases.

These checks are intentionally separate from production calculations. They
compare increasing Monte Carlo sample sizes against a deterministic reference
run so reviewers can see sampling stability instead of relying on a single
simulation count.
"""

from __future__ import annotations

from typing import Any, Iterable

from investment_engine import simulate_investment


PERCENTILE_FIELDS = ("projected_p10", "projected_p50", "projected_p90")


def investment_convergence_report(
    *,
    initial_amount: float = 10_000,
    monthly_contribution: float = 500,
    years: int = 20,
    risk_profile: str = "medium",
    seed: int = 2026,
    sample_sizes: Iterable[int] = (250, 1_000, 4_000),
    tolerance: float = 0.02,
) -> dict[str, Any]:
    """Compare percentile estimates with the largest deterministic run.

    ``tolerance`` is a relative deviation threshold, not a confidence interval.
    The report does not claim forecast accuracy; it only measures Monte Carlo
    sampling stability for one documented scenario.
    """
    sizes = tuple(sorted(set(int(size) for size in sample_sizes)))
    if len(sizes) < 2 or sizes[0] < 10:
        raise ValueError("sample_sizes must contain at least two values of 10 or more")
    if not 0 < tolerance < 1:
        raise ValueError("tolerance must be between 0 and 1")

    results = {
        size: simulate_investment(
            initial_amount,
            monthly_contribution,
            years,
            risk_profile,
            num_simulations=size,
            seed=seed,
        )
        for size in sizes
    }
    reference_size = sizes[-1]
    reference = results[reference_size]
    runs = []
    for size in sizes:
        deviations = {
            field: abs(float(results[size][field]) - float(reference[field]))
            / max(abs(float(reference[field])), 1.0)
            for field in PERCENTILE_FIELDS
        }
        runs.append({
            "simulation_count": size,
            "percentiles": {field: results[size][field] for field in PERCENTILE_FIELDS},
            "relative_deviation_from_reference": deviations,
            "max_relative_deviation": max(deviations.values()),
        })

    evaluated = runs[-2]
    return {
        "model_id": results[reference_size]["model_metadata"]["model_id"],
        "assumption_version": results[reference_size]["model_metadata"]["assumption_version"],
        "seed": seed,
        "reference_simulation_count": reference_size,
        "tolerance": tolerance,
        "status": "stable" if evaluated["max_relative_deviation"] <= tolerance else "review_required",
        "interpretation": "Sampling stability diagnostic only; it does not validate the capital-market assumptions or predict future returns.",
        "runs": runs,
    }
