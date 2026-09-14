"""Concurrency and latency benchmark test.

Simulates 25 concurrent requests across /api/analyze and /api/health to
demonstrate system throughput, thread-pool isolation, and zero event loop crashes.
Records p50, p95, and p99 latencies for production capacity planning.
"""

import asyncio
import os
import sys
import time
import pytest
import httpx

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from main import app

BENCHMARK_PROFILE = {
    "age": 34,
    "is_married": False,
    "has_dependents": False,
    "num_children": 0,
    "children_under_25": 0,
    "is_saxony": False,
    "joint_assessment": True,
    "spouse_income": 0,
    "church_tax": False,
    "tax_class": 1,
    "income": 72000,
    "secondary_income": 0,
    "additional_deductions": 1200,
    "riester_contribution": 0,
    "has_private_health": False,
    "private_health_cost": 0,
    "employment_stability": "stable",
    "occupation_risk": "medium",
    "smoker": False,
    "housing_cost": 1200,
    "living_cost": 650,
    "mobility_cost": 250,
    "leisure_cost": 350,
    "subscriptions_cost": 90,
    "travel_cost": 200,
    "commute_km": 18,
    "home_office_days": 45,
    "initial_amount": 15000,
    "monthly_investment": 750,
    "investment_years": 25,
    "risk_profile": "high",
    "investment_strategy": "growth_80_20",
    "target_wealth": 500000,
    "management_fee": 0.0018,
    "equity_fund_share": 1.0,
    "annual_capital_gains": 0,
    "existing_assets": ["etf", "emergency_fund"],
    "has_property": False,
    "has_car": True,
    "property_price": 420000,
    "property_down_payment": 84000,
    "mortgage_rate": 0.038,
    "mortgage_amortization": 0.025,
    "gross_rental_yield": 0.038,
    "property_appreciation": 0.02,
    "expected_inflation": 0.022,
    "expected_pension_growth": 0.015,
    "bav_contribution": 0,
    "bav_employer_subsidy_rate": 0.15,
    "bav_expected_return": 0.04,
    "bav_retirement_deduction_rate": 0.20,
    "retirement_age": 67,
    "longevity_age": 92,
    "years_worked": 8,
    "current_entgeltpunkte": None,
    "target_pension_ratio": 0.8,
    "retirement_health_care_rate": None,
    "retirement_tax_rate": 0.08,
    "safe_withdrawal_rate": 0.038,
    "existing_insurances": ["Liability", "BU"],
    "bu_monthly_benefit": 2400,
    "living_space_sqm": 75,
    "mortgage_balance": None,
    "youngest_dependent_age": 0,
    "liquid_savings": 12000,
    "unsecured_debt": 0,
    "unsecured_debt_rate": 0.08,
    "monthly_debt_payment": 0,
    "debt_payoff_years": 5,
    "goals": ["freedom", "etf_wealth"],
}


def _percentile(values: list[float], pct: float) -> float:
    if not values:
        return 0.0
    k = (len(values) - 1) * pct
    f = int(k)
    c = f + 1
    if c < len(values):
        return values[f] + (k - f) * (values[c] - values[f])
    return values[f]


@pytest.mark.anyio
async def test_concurrent_benchmarking_and_non_blocking_health():
    """Simulates 25 concurrent requests (20 analyze + 5 health), recording p50/p95 latency and verifying stability."""
    original_limiter_enabled = getattr(app.state.limiter, "enabled", True)
    app.state.limiter.enabled = False

    transport = httpx.ASGITransport(app=app)
    try:
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            analyze_latencies: list[float] = []
            health_latencies: list[float] = []

            async def run_analyze(idx: int):
                t0 = time.perf_counter()
                resp = await client.post("/api/analyze", json=BENCHMARK_PROFILE)
                elapsed = time.perf_counter() - t0
                assert resp.status_code == 200, f"Analyze {idx} failed with {resp.status_code}"
                analyze_latencies.append(elapsed * 1000.0)

            async def run_health(idx: int):
                t0 = time.perf_counter()
                resp = await client.get("/api/health")
                elapsed = time.perf_counter() - t0
                assert resp.status_code == 200, f"Health {idx} failed with {resp.status_code}"
                health_latencies.append(elapsed * 1000.0)

            # Build concurrent load batch
            tasks = []
            for i in range(20):
                tasks.append(run_analyze(i))
                if i % 4 == 0:
                    tasks.append(run_health(i // 4))

            t_start = time.perf_counter()
            await asyncio.gather(*tasks)
            total_duration = time.perf_counter() - t_start

            analyze_sorted = sorted(analyze_latencies)
            health_sorted = sorted(health_latencies)

            p50_analyze = _percentile(analyze_sorted, 0.50)
            p95_analyze = _percentile(analyze_sorted, 0.95)
            p99_analyze = _percentile(analyze_sorted, 0.99)

            p50_health = _percentile(health_sorted, 0.50)
            p95_health = _percentile(health_sorted, 0.95)

            print(
                f"\n--- CONCURRENCY BENCHMARK RESULTS ---"
                f"\nTotal Concurrent Requests: {len(tasks)} in {total_duration:.2f}s"
                f"\nAnalyze ({len(analyze_latencies)} calls): p50 = {p50_analyze:.1f}ms, p95 = {p95_analyze:.1f}ms, p99 = {p99_analyze:.1f}ms"
                f"\nHealth  ({len(health_latencies)} calls): p50 = {p50_health:.1f}ms, p95 = {p95_health:.1f}ms"
                f"\n-------------------------------------"
            )

            # Assertions for throughput and stability:
            assert len(analyze_latencies) == 20
            assert len(health_latencies) == 5
            assert total_duration < 15.0, f"Total duration too high: {total_duration:.2f}s"
            assert p50_analyze < 6000.0, f"Analyze p50 was higher than expected: {p50_analyze:.1f}ms"
            assert p95_health < 5000.0, f"Health p95 was higher than expected: {p95_health:.1f}ms"
    finally:
        app.state.limiter.enabled = original_limiter_enabled


if __name__ == "__main__":
    asyncio.run(test_concurrent_benchmarking_and_non_blocking_health())