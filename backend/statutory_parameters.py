"""Versioned statutory inputs used by the 2026 German tax estimate.

Keep legal thresholds and contribution assumptions in this module so the
calculator, tests, API metadata, and documentation refer to one source of
truth. Values are annual EUR amounts unless their names state otherwise.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class TaxParameters:
    year: int = 2026
    version: str = "de-tax-2026.1"
    grundfreibetrag: float = 12_348.0
    first_progression_upper: float = 17_799.0
    second_progression_upper: float = 69_878.0
    reichensteuer_threshold: float = 277_825.0
    werbungskosten_pauschale: float = 1_230.0
    commute_rate_per_km: float = 0.38
    home_office_daily_rate: float = 6.0
    home_office_annual_cap: float = 1_260.0
    bbg_health_and_care: float = 69_750.0
    bbg_pension_and_unemployment: float = 101_400.0
    health_employee_rate: float = 0.0875
    pension_employee_rate: float = 0.093
    unemployment_employee_rate: float = 0.013
    pension_deduction_cap_per_person: float = 29_344.0
    single_parent_allowance: float = 4_260.0
    riester_deduction_cap: float = 2_100.0
    riester_basic_allowance: float = 175.0
    riester_child_allowance: float = 300.0
    child_benefit_monthly: float = 259.0
    child_allowance_total: float = 9_756.0
    soli_threshold_single: float = 20_350.0
    soli_threshold_joint: float = 40_700.0
    soli_taper_rate: float = 0.119
    soli_standard_rate: float = 0.055


TAX_2026 = TaxParameters()

TAX_2026_SOURCES = (
    "https://www.bundesfinanzministerium.de/Content/DE/Standardartikel/Themen/Steuern/das-aendert-sich-2025.html",
    "https://www.bundesfinanzministerium.de/Monatsberichte/Ausgabe/2026/02/Inhalte/Kapitel-2-Analysen/2-5-wichtigste-steuerliche-aenderungen-2026-pdf.pdf",
)
