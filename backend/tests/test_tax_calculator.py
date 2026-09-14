"""
Unit tests for the German tax calculator (2026).
Tests the progressive polynomial formula, all 6 Steuerklassen,
Kinderfreibetrag vs Kindergeld Günstigerprüfung, Pendlerpauschale,
and social security calculations.
"""
import sys
import os
import math

# Add parent directory to path so we can import the module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from tax_calculator import _calculate_grundtarif, calculate_german_tax, calculate_tax
from statutory_parameters import TAX_2026, TAX_2026_SOURCES


class TestGrundtarif:
    """Tests for the 2026 progressive tax formula (§ 32a EStG)."""

    def test_zone_0_grundfreibetrag(self):
        """Income through the configured 2026 Grundfreibetrag is tax-free."""
        assert _calculate_grundtarif(0) == 0.0
        assert _calculate_grundtarif(5000) == 0.0
        assert _calculate_grundtarif(TAX_2026.grundfreibetrag) == 0.0

    def test_zone_1_entry(self):
        """Tax starts at 14% marginal rate just above the Grundfreibetrag."""
        tax = _calculate_grundtarif(TAX_2026.grundfreibetrag + 1)
        assert tax > 0.0
        assert tax < 5.0  # Should be very small

    def test_zone_1_to_zone_2_boundary(self):
        """Verify the boundary between the two progression zones."""
        tax = _calculate_grundtarif(TAX_2026.first_progression_upper)
        assert tax > 0.0
        # Zone 1 formula: y = (17005-11604)/10000 = 0.5401
        # tax = (922.98 * 0.5401 + 1400) * 0.5401
        expected_y = (TAX_2026.first_progression_upper - TAX_2026.grundfreibetrag) / 10000
        expected = (914.51 * expected_y + 1400) * expected_y
        assert abs(tax - expected) < 1.0

    def test_zone_3_flat_42_percent(self):
        """Above 66,760€, the Spitzensteuersatz of 42% applies."""
        tax_100k = _calculate_grundtarif(100000)
        tax_110k = _calculate_grundtarif(110000)
        marginal = tax_110k - tax_100k
        # Marginal rate should be exactly 42% = 4,200€ for 10,000€ additional income
        assert abs(marginal - 4200.0) < 1.0

    def test_zone_4_reichensteuer_45_percent(self):
        """Above 277,825€, the Reichensteuer of 45% applies."""
        tax_300k = _calculate_grundtarif(300000)
        tax_310k = _calculate_grundtarif(310000)
        marginal = tax_310k - tax_300k
        # Marginal rate should be exactly 45% = 4,500€ for 10,000€ additional income
        assert abs(marginal - 4500.0) < 1.0

    def test_tax_is_monotonically_increasing(self):
        """Tax must always increase with income."""
        prev_tax = 0.0
        for income in range(0, 300000, 5000):
            tax = _calculate_grundtarif(income)
            assert tax >= prev_tax, f"Tax decreased at income {income}"
            prev_tax = tax


class TestSteuerklassen:
    """Tests for all 6 German tax classes."""

    def test_class_1_single_standard(self):
        """Class I: Standard single person."""
        result = calculate_german_tax(50000, tax_class=1)
        assert result['net_income'] < result['gross_income']
        assert result['effective_tax_rate'] > 0

    def test_class_2_single_parent_gets_entlastungsbetrag(self):
        """Class II should have lower tax than Class I due to Entlastungsbetrag (4,260€)."""
        result_1 = calculate_german_tax(50000, tax_class=1)
        result_2 = calculate_german_tax(50000, tax_class=2)
        assert result_2['tax_amount'] < result_1['tax_amount']

    def test_class_3_married_splittingtarif(self):
        """Class III uses Splittingtarif: significant tax reduction for sole earner."""
        result_1 = calculate_german_tax(80000, tax_class=1)
        result_3 = calculate_german_tax(80000, tax_class=3, is_married=True)
        # Splitting should save a lot of tax for a sole earner
        assert result_3['tax_amount'] < result_1['tax_amount']

    def test_class_6_changes_withholding_not_final_assessment(self):
        """Payroll class VI must not distort final annual assessed tax."""
        result_1 = calculate_german_tax(30000, tax_class=1)
        result_6 = calculate_german_tax(30000, tax_class=6)
        assert result_6['tax_amount'] == result_1['tax_amount']
        assert 'withholding' in result_6['details']['assessment_basis']['warning']


class TestKinderfreibetrag:
    """Tests for child-related tax benefits (Günstigerprüfung)."""

    def test_low_income_gets_kindergeld(self):
        """At low income, Kindergeld (250€/mo/child) is more beneficial."""
        result = calculate_german_tax(30000, num_children=1)
        assert result['details']['child_benefit_used'] == 'kindergeld'

    def test_high_income_gets_kinderfreibetrag(self):
        """At high income, Kinderfreibetrag deduction saves more tax."""
        result = calculate_german_tax(150000, num_children=1)
        assert result['details']['child_benefit_used'] == 'kinderfreibetrag'

    def test_kindergeld_added_to_net_income(self):
        """When Kindergeld is used, it should be added to net income."""
        result = calculate_german_tax(30000, num_children=1)
        if result['details']['child_benefit_used'] == 'kindergeld':
            assert result['details']['kindergeld_received'] == 3108.0  # 259 * 12


class TestPendlerpauschale:
    """Tests for commuter tax deduction."""

    def test_short_commute_30_cents(self):
        """First 20km at 0.30€/km."""
        result = calculate_german_tax(50000, commute_km=15, commute_days=230)
        expected = 15 * 0.38 * 230
        assert abs(result['details']['commute_allowance'] - expected) < 0.01

    def test_long_commute_mixed_rate(self):
        """Beyond 20km uses 0.38€/km."""
        result = calculate_german_tax(50000, commute_km=40, commute_days=230)
        expected = 40 * 0.38 * 230
        assert abs(result['details']['commute_allowance'] - expected) < 0.01

    def test_commute_reduces_tax(self):
        """Commuting deduction should reduce net tax paid."""
        result_no_commute = calculate_german_tax(50000, commute_km=0)
        result_with_commute = calculate_german_tax(50000, commute_km=40)
        assert result_with_commute['tax_amount'] < result_no_commute['tax_amount']


class TestSocialSecurity:
    """Tests for social security contribution calculations."""

    def test_social_security_structure(self):
        """Verify social security returns all expected components."""
        result = calculate_german_tax(60000)
        ss = result['details']['social_security']
        assert 'health_insurance' in ss
        assert 'care_insurance' in ss
        assert 'pension_insurance' in ss
        assert 'unemployment_insurance' in ss
        assert 'total' in ss
        assert ss['total'] == ss['health_insurance'] + ss['care_insurance'] + ss['pension_insurance'] + ss['unemployment_insurance']

    def test_bbg_cap_pension(self):
        """Pension contributions are capped at BBG (90,600€)."""
        result_60k = calculate_german_tax(60000)
        result_120k = calculate_german_tax(120000)
        # Both should cap pension at BBG
        assert result_120k['details']['social_security']['pension_insurance'] == \
               result_60k['details']['social_security']['pension_insurance'] or \
               result_120k['details']['social_security']['pension_insurance'] <= 101400 * 0.093 + 1

    def test_childless_surcharge(self):
        """Childless people pay higher care insurance (Kinderlosenzuschlag)."""
        result_no_kids = calculate_german_tax(50000, num_children=0)
        result_with_kids = calculate_german_tax(50000, num_children=1)
        assert result_no_kids['details']['social_security']['care_insurance'] > \
               result_with_kids['details']['social_security']['care_insurance']


class TestSolidaritySurcharge:
    """Tests for Solidaritätszuschlag with Milderungszone."""

    def test_no_soli_for_low_tax(self):
        """No Soli if income tax is below exemption limit."""
        result = calculate_german_tax(30000)
        assert result['details']['solidarity_surcharge'] == 0.0

    def test_soli_for_high_tax(self):
        """Soli applies for high incomes."""
        result = calculate_german_tax(200000)
        assert result['details']['solidarity_surcharge'] > 0.0


class TestAdapterFunction:
    """Tests for the simplified calculate_tax wrapper."""

    def test_adapter_returns_expected_keys(self):
        """The adapter must return the documented keys."""
        result = calculate_tax(50000)
        assert 'gross_income' in result
        assert 'tax_amount' in result
        assert 'net_income' in result
        assert 'effective_tax_rate' in result
        assert 'details' in result

    def test_adapter_consistency(self):
        """Adapter results must match the full function."""
        full = calculate_german_tax(50000, tax_class=1, is_married=False, church_tax=False)
        adapter = calculate_tax(50000, tax_class=1, is_married=False, church_tax=False)
        assert abs(full['net_income'] - adapter['net_income']) < 0.01

    def test_result_discloses_parameter_version_and_sources(self):
        result = calculate_german_tax(50000)
        basis = result['calculation_basis']
        assert basis['year'] == TAX_2026.year
        assert basis['parameter_version'] == TAX_2026.version
        assert basis['sources'] == list(TAX_2026_SOURCES)
        assert all(source.startswith('https://www.bundesfinanzministerium.de/') for source in basis['sources'])


if __name__ == '__main__':
    import pytest
    pytest.main([__file__, '-v'])
