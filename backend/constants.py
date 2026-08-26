"""
constants.py — 2026 German Statutory Financial Constants
=========================================================
Single source of truth for all statutory thresholds, rates, and limits.
All values reflect the 2026 Beitragsjahr unless otherwise noted.

References:
  § 32a EStG   — Income tax progressive tariff
  § 9 EStG     — Werbungskosten (commute / home-office)
  § 9a EStG    — Arbeitnehmer-Pauschbetrag
  § 10 EStG    — Sonderausgaben (Vorsorgeaufwendungen)
  § 10a EStG   — Riester deduction
  § 24b EStG   — Entlastungsbetrag für Alleinerziehende
  § 31 EStG    — Kindergeld / Kinderfreibetrag Günstigerprüfung
  § 35a EStG   — Steuerermäßigung für Haushaltsnahe Dienstleistungen
  § 4 SolzG    — Solidaritätszuschlag (2021 reform Freigrenze)
  SGB VI       — Gesetzliche Rentenversicherung
  BetrAVG      — Betriebliche Altersversorgung
  VVG / JAEG   — Krankenversicherung Jahresarbeitsentgeltgrenze
"""

# ---------------------------------------------------------------------------
# 1. Income Tax Brackets (§ 32a EStG, Grundtarif 2026)
# ---------------------------------------------------------------------------
GRUNDFREIBETRAG = 12_348.0          # Tax-free allowance
ZONE_1_UPPER = 17_799.0             # Upper bound of polynomial zone 1
ZONE_2_UPPER = 69_878.0             # Upper bound of polynomial zone 2
ZONE_3_UPPER = 277_825.0            # Upper bound of 42% flat rate zone
# Zone 1 polynomial: (914.51·y + 1400)·y
POLY_1_A = 914.51
POLY_1_B = 1_400.0
# Zone 2 polynomial: (173.10·z + 2397)·z + 1034.87
POLY_2_A = 173.10
POLY_2_B = 2_397.0
POLY_2_C = 1_034.87
# Zone 3 / Zone 4 linear coefficients
RATE_ZONE3 = 0.42
CONST_ZONE3 = 11_135.63
RATE_ZONE4 = 0.45
CONST_ZONE4 = 19_470.38

# ---------------------------------------------------------------------------
# 2. Werbungskosten (§ 9, § 9a EStG)
# ---------------------------------------------------------------------------
WORKDAYS_PER_YEAR = 230             # Statutory working-day basis (§ 9 EStG)
COMMUTE_RATE_PER_KM = 0.38         # Pendlerpauschale per km (2026)
HOME_OFFICE_RATE_PER_DAY = 6.0     # Homeoffice-Pauschale 2026 (§ 4 Abs. 5 Nr. 6b EStG)
HOME_OFFICE_MAX_ANNUAL = 1_260.0   # Annual cap (210 days × €6)
WORK_EQUIPMENT_PAUSCHALE = 110.0   # Typical equipment flat rate
ACCOUNT_MAINTENANCE_PAUSCHALE = 16.0
WERBUNGSKOSTEN_PAUSCHALE = 1_230.0 # § 9a Nr. 1 EStG minimum

# ---------------------------------------------------------------------------
# 3. Social Security Beitragsbemessungsgrenzen 2026 (SGB IV / SGB V / SGB VI)
# ---------------------------------------------------------------------------
BBG_KV_PV_2026 = 69_750.0          # KV & PV ceiling (West & East unified 2026)
BBG_RV_AV_2026 = 101_400.0         # RV & AV ceiling (West & East unified 2026)

# Employee-share rates
KV_EMPLOYEE_RATE = 0.0875           # 7.3% base + 1.45% half of avg. Zusatzbeitrag
PV_RATE_CHILDLESS_23_PLUS = 0.024  # Childless ≥ 23 (§ 55 SGB XI)
PV_RATE_BASE = 0.018               # Base rate with children
PV_SAXONY_ADDON = 0.005            # Saxony employee surcharge
PV_CHILD_REDUCTION_PER_CHILD = 0.0025  # Each additional child (2nd-5th) reduces rate
PV_RATE_MIN = 0.008                # Floor rate even with 5 children
RV_EMPLOYEE_RATE = 0.093           # 18.6% / 2
AV_EMPLOYEE_RATE = 0.013           # 2.6% / 2

# ---------------------------------------------------------------------------
# 4. Sonderausgaben / Vorsorgeaufwendungen (§ 10 EStG, 2026)
# ---------------------------------------------------------------------------
# The deductible ceiling for Vorsorgeaufwendungen (tied to Knappschaft BBG 2026)
# = Knappschaftliche RV BBG (134,400) × 9.3% × 2 = 25,007 but the statutory cap
# for employees is min(own contributions × 2, Höchstbetrag). The 2026 value
# referenced in § 10 Abs. 3 Satz 1 EStG (based on Knappschaftliche Rentenversicherung
# BBG = 125,400 × 0.234) is approx. 29,344 €.
VORSORGE_PENSION_MAX_2026 = 29_344.0
# Riester (§ 10a EStG)
RIESTER_MAX_DEDUCTION = 2_100.0
RIESTER_GRUNDZULAGE = 175.0
RIESTER_KINDZULAGE = 300.0

# ---------------------------------------------------------------------------
# 5. Tax Credits (§ 35a EStG)
# ---------------------------------------------------------------------------
HANDWERKER_MAX_CREDIT = 1_200.0    # 20% of labor costs, max €1,200
HANDWERKER_CREDIT_RATE = 0.20
HAUSHALTSNAH_MAX_CREDIT = 4_000.0  # 20% of costs, max €4,000
HAUSHALTSNAH_CREDIT_RATE = 0.20

# ---------------------------------------------------------------------------
# 6. Solidarity Surcharge (§ 4 SolzG, 2021 reform)
# ---------------------------------------------------------------------------
SOLI_FREIGRENZE_SINGLE = 20_350.0
SOLI_FREIGRENZE_JOINT = 40_700.0
SOLI_MILDERUNG_RATE = 0.119
SOLI_STANDARD_RATE = 0.055

# ---------------------------------------------------------------------------
# 7. Child Benefits (§ 31, § 32 EStG)
# ---------------------------------------------------------------------------
KINDERGELD_PER_CHILD_MONTHLY = 259.0   # 2026 value
KINDERFREIBETRAG_PER_CHILD = 9_756.0   # § 32 Abs. 6 EStG (incl. BEA)

# ---------------------------------------------------------------------------
# 8. Single-Parent Relief (§ 24b EStG)
# ---------------------------------------------------------------------------
ENTLASTUNGSBETRAG_ALLEINERZIEHENDE = 4_260.0

# ---------------------------------------------------------------------------
# 9. Investment Capital Gains (§ 20 EStG, § 18 InvStG)
# ---------------------------------------------------------------------------
ABGELTUNGSTEUER_RATE = 0.26375        # 25% + 5.5% Soli
SPARERPAUSCHBETRAG_SINGLE = 1_000.0   # § 20 Abs. 9 EStG
SPARERPAUSCHBETRAG_MARRIED = 2_000.0
TEILFREISTELLUNG_EQUITY = 0.30        # 30% exemption for equity funds (§ 20 InvStG)
# Vorabpauschale Basiszins (Bundesbank published, 2026)
BASISZINS_2026 = 0.025

# ---------------------------------------------------------------------------
# 10. Statutory Retirement (SGB VI, 2026)
# ---------------------------------------------------------------------------
DURCHSCHNITTSENTGELT_2026 = 51_944.0  # Official average earnings reference value
BBG_PENSION_2026 = 101_400.0          # Beitragsbemessungsgrenze RV 2026 (= BBG_RV_AV_2026)
RENTENWERT_WEST_JULY_2026 = 42.52     # § 68 SGB VI Rentenwert July 2026
REGELALTERSGRENZE = 67                 # Standard legal retirement age
PENSION_INCREASE_RATE = 0.015         # Estimated annual GRV pension growth
KVDR_PVDR_DEDUCTION = 0.115          # KV+PV for pensioners (~11.5%)
FRUEHESTE_RENTE_ALTER = 63            # Earliest statutory pension access (long-insured)

# ---------------------------------------------------------------------------
# 11. Betriebliche Altersversorgung (BetrAVG)
# ---------------------------------------------------------------------------
BAV_EMPLOYER_SUBSIDY_RATE = 0.15      # Mandatory 15% employer contribution (§ 1a BetrAVG)
BAV_RETURN_RATE = 0.045               # Conservative bAV fund growth estimate

# ---------------------------------------------------------------------------
# 12. Insurance (VVG / JAEG 2026)
# ---------------------------------------------------------------------------
JAEG_2026 = 77_400.0                  # PKV eligibility threshold 2026 (§ 6 SGB V)

# ---------------------------------------------------------------------------
# 13. Safe Withdrawal Rate
# ---------------------------------------------------------------------------
SAFE_WITHDRAWAL_RATE = 0.04           # 4% Rule (Bengen 1994)
RIESTER_PAYOUT_RATE = 0.035          # Riester annuity conversion factor
