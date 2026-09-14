"""
Unit tests for the investment engine (Monte Carlo simulation).
Tests Cholesky decomposition, GBM return properties, Abgeltungsteuer,
and portfolio allocation integrity.
"""
import sys
import os
import math
import random

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from investment_engine import (
    _cholesky_decompose,
    _generate_correlated_returns,
    _apply_german_capital_gains_tax,
    simulate_investment,
    ASSET_CLASSES,
    PORTFOLIO_MODELS,
    CORRELATION_MATRIX,
    ASSET_ORDER,
    MODEL_ASSUMPTION_VERSION,
)


class TestCholeskyDecomposition:
    """Tests for the Cholesky matrix decomposition."""

    def test_identity_matrix(self):
        """Cholesky of identity matrix is identity."""
        I = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
        L = _cholesky_decompose(I)
        for i in range(3):
            for j in range(3):
                expected = 1.0 if i == j else 0.0
                assert abs(L[i][j] - expected) < 1e-10

    def test_reconstruction(self):
        """L @ L^T should reconstruct the original correlation matrix."""
        L = _cholesky_decompose(CORRELATION_MATRIX)
        n = len(CORRELATION_MATRIX)
        for i in range(n):
            for j in range(n):
                reconstructed = sum(L[i][k] * L[j][k] for k in range(n))
                assert abs(reconstructed - CORRELATION_MATRIX[i][j]) < 1e-6, \
                    f"Reconstruction failed at [{i}][{j}]: {reconstructed} != {CORRELATION_MATRIX[i][j]}"

    def test_lower_triangular(self):
        """Result must be lower triangular (zeros above diagonal)."""
        L = _cholesky_decompose(CORRELATION_MATRIX)
        n = len(L)
        for i in range(n):
            for j in range(i + 1, n):
                assert L[i][j] == 0.0, f"Non-zero above diagonal at [{i}][{j}]"


class TestCapitalGainsTax:
    """Tests for German Abgeltungsteuer (26.375%)."""

    def test_gains_within_sparerpauschbetrag(self):
        """Gains up to 1,000€ are tax-free (Sparerpauschbetrag)."""
        tax, used = _apply_german_capital_gains_tax(500, 0.0)
        assert tax == 0.0
        assert used == 500.0

    def test_gains_exceeding_sparerpauschbetrag(self):
        """Gains above 1,000€ are taxed at 26.375%."""
        tax, used = _apply_german_capital_gains_tax(2000, 0.0)
        # First 1000 is free, remaining 1000 taxed at 26.375%
        expected_tax = 1000 * 0.26375
        assert abs(tax - expected_tax) < 0.01

    def test_already_used_allowance(self):
        """If allowance is already used, all gains are taxed."""
        tax, used = _apply_german_capital_gains_tax(500, 1000.0)
        expected_tax = 500 * 0.26375
        assert abs(tax - expected_tax) < 0.01

    def test_allowance_usage_is_bounded(self):
        tax, used = _apply_german_capital_gains_tax(500, 1500)
        assert tax == pytest.approx(500 * 0.26375)
        assert used == 1000.0


class TestPortfolioModels:
    """Tests for portfolio configuration integrity."""

    def test_allocations_sum_to_one(self):
        """Each portfolio's weights must sum to 1.0 (100%)."""
        for profile, model in PORTFOLIO_MODELS.items():
            total = sum(model['allocation'].values())
            assert abs(total - 1.0) < 1e-10, \
                f"Portfolio '{profile}' weights sum to {total}, not 1.0"

    def test_all_allocated_assets_exist(self):
        """Every asset in a portfolio must exist in ASSET_CLASSES."""
        for profile, model in PORTFOLIO_MODELS.items():
            for asset in model['allocation']:
                assert asset in ASSET_CLASSES, \
                    f"Portfolio '{profile}' references unknown asset '{asset}'"

    def test_asset_order_complete(self):
        """ASSET_ORDER must contain all defined asset classes."""
        for asset in ASSET_CLASSES:
            assert asset in ASSET_ORDER, f"Asset '{asset}' missing from ASSET_ORDER"

    def test_correlation_matrix_symmetric(self):
        """Correlation matrix must be symmetric."""
        n = len(CORRELATION_MATRIX)
        for i in range(n):
            for j in range(n):
                assert abs(CORRELATION_MATRIX[i][j] - CORRELATION_MATRIX[j][i]) < 1e-10

    def test_correlation_diagonal_is_one(self):
        """Diagonal of correlation matrix must be 1.0."""
        for i in range(len(CORRELATION_MATRIX)):
            assert CORRELATION_MATRIX[i][i] == 1.0


class TestSimulateInvestment:
    """Integration tests for the full Monte Carlo simulation."""

    def test_basic_output_structure(self):
        """Verify the simulation returns all expected keys."""
        result = simulate_investment(
            initial_amount=1000,
            monthly_contribution=100,
            years=5,
            risk_profile='medium'
        )
        required_keys = [
            'risk_profile', 'portfolio_label', 'years', 'initial_amount',
            'total_contributions', 'projected_p10', 'projected_p50', 'projected_p90',
            'real_p10', 'real_p50', 'real_p90', 'max_drawdown_pct',
            'yearly_data', 'allocation'
        ]
        for key in required_keys:
            assert key in result, f"Missing key: {key}"

    def test_percentiles_ordered(self):
        """P10 < P25 < P50 < P75 < P90 (pessimistic to optimistic)."""
        result = simulate_investment(0, 500, 10, 'medium')
        assert result['projected_p10'] <= result['projected_p50']
        assert result['projected_p50'] <= result['projected_p90']

    def test_contributions_calculated_correctly(self):
        """Total contributions = initial + monthly * 12 * years."""
        result = simulate_investment(5000, 200, 10, 'low')
        expected = 5000 + (200 * 12 * 10)
        assert abs(result['total_contributions'] - expected) < 0.01

    def test_yearly_data_length(self):
        """Yearly data should have years + 1 entries (year 0 through year N)."""
        years = 15
        result = simulate_investment(0, 100, years, 'high')
        assert len(result['yearly_data']) == years + 1

    def test_real_values_less_than_nominal(self):
        """Inflation-adjusted values must be less than nominal (with positive inflation)."""
        result = simulate_investment(0, 500, 20, 'medium', inflation_rate=0.02)
        assert result['real_p50'] < result['projected_p50']

    def test_invalid_risk_profile_defaults_to_medium(self):
        """Unknown risk profiles should default to 'medium'."""
        result = simulate_investment(0, 100, 5, 'nonexistent_profile')
        assert result['risk_profile'] == 'medium'

    def test_max_drawdown_is_reasonable(self):
        """Max drawdown should be between 0 and 100%."""
        result = simulate_investment(0, 500, 20, 'high')
        assert 0 <= result['max_drawdown_pct'] <= 100

    def test_model_metadata_discloses_scenario_assumptions(self):
        result = simulate_investment(1000, 100, 5, 'medium', num_simulations=25, seed=7)
        metadata = result['model_metadata']
        assert metadata['assumption_version'] == MODEL_ASSUMPTION_VERSION
        assert metadata['simulation_count'] == 25
        assert metadata['seed'] == 7
        assert len(metadata['limitations']) >= 3

    def test_simulation_is_deterministic_without_mutating_global_rng(self):
        random.seed(99)
        expected_next_random = random.random()
        random.seed(99)

        first = simulate_investment(1000, 100, 5, 'medium', num_simulations=25, seed=11)
        second = simulate_investment(1000, 100, 5, 'medium', num_simulations=25, seed=11)

        assert first['projected_p50'] == second['projected_p50']
        assert random.random() == expected_next_random


if __name__ == '__main__':
    import pytest
    pytest.main([__file__, '-v'])
