import math
from typing import Dict, Any, List
from constants import (
    DURCHSCHNITTSENTGELT_2026, BBG_PENSION_2026, RENTENWERT_WEST_JULY_2026,
    REGELALTERSGRENZE, PENSION_INCREASE_RATE, KVDR_PVDR_DEDUCTION,
    FRUEHESTE_RENTE_ALTER, BAV_EMPLOYER_SUBSIDY_RATE, BAV_RETURN_RATE,
    SAFE_WITHDRAWAL_RATE, RIESTER_PAYOUT_RATE,
    ABGELTUNGSTEUER_RATE, TEILFREISTELLUNG_EQUITY, SPARERPAUSCHBETRAG_SINGLE, SPARERPAUSCHBETRAG_MARRIED,
)

def calculate_retirement_plan(
    current_age: int,
    retirement_age: int,
    gross_income: float,
    years_worked: int,
    monthly_investment: float,
    risk_profile: str = "medium",
    is_married: bool = False,
    num_children: int = 0,
    riester_contribution: float = 0.0,
    target_pension_ratio: float = 0.8,
    inflation_rate: float = 0.02,
    bav_contribution: float = 0.0
) -> Dict[str, Any]:
    """
    Institutional German Actuarial Retirement & 3-Pillar Solvency Engine.
    Computes SGB VI Entgeltpunkte (EP), Zugangsfaktor and the 2026 Rentenwert,
    KVdR/PVdR pensioner health deductions, Alterseinkünftegesetz taxation,
    bAV employer subsidies (§ 1a BetrAVG), private ETF capital accumulation,
    and the exact monthly investment required to close the Rentenlücke.
    """
    current_age = max(18, int(current_age))
    retirement_age = max(current_age + 1, int(retirement_age))
    gross_income = max(0.0, float(gross_income))
    years_worked = max(0, int(years_worked))
    monthly_investment = max(0.0, float(monthly_investment))
    bav_contribution = max(0.0, float(bav_contribution))
    
    # 2026 statutory/current values from constants.py
    DURCHSCHNITTSENTGELT = DURCHSCHNITTSENTGELT_2026
    BBG_PENSION = BBG_PENSION_2026
    RENTENWERT = RENTENWERT_WEST_JULY_2026
    
    years_until_retirement = retirement_age - current_age
    months_until_retirement = years_until_retirement * 12
    payout_years = max(15, 87 - retirement_age)  # Actuarial life expectancy 87
    payout_months = payout_years * 12
    
    # 1. Statutory GRV State Pension Calculation
    relevant_income = min(gross_income, BBG_PENSION)
    ep_per_year = relevant_income / DURCHSCHNITTSENTGELT
    
    ep_past = ep_per_year * years_worked
    ep_future = ep_per_year * years_until_retirement
    ep_total = ep_past + ep_future
    
    # Zugangsfaktor: 0.3% penalty per early month (max 14.4%), 0.5% bonus per late month
    months_early = max(0, (REGELALTERSGRENZE - retirement_age) * 12)
    months_late = max(0, (retirement_age - REGELALTERSGRENZE) * 12)
    zugangsfaktor = max(0.0, 1.0 - (months_early * 0.003) + (months_late * 0.005))
    
    # Guard: statutory GRV cannot be accessed before age 63 (long-insured requirement)
    # Accessing before 63 would set state pension entitlement to zero for this model.
    state_pension_accessible = retirement_age >= FRUEHESTE_RENTE_ALTER
    if not state_pension_accessible:
        zugangsfaktor = 0.0
    
    # Current monthly gross pension value
    current_gross_pension = ep_total * RENTENWERT * zugangsfaktor
    # Nominal projected future pension with increases
    nominal_gross_pension = current_gross_pension * ((1.0 + PENSION_INCREASE_RATE) ** years_until_retirement)
    # Net statutory pension after KVdR/PVdR deductions (~11.5%) and estimated Alterseinkünftegesetz tax (~8%)
    statutory_net_pension_future = nominal_gross_pension * (1.0 - KVDR_PVDR_DEDUCTION - 0.08)
    statutory_net_pension_real = statutory_net_pension_future / ((1.0 + inflation_rate) ** years_until_retirement)
    
    # 2. 2nd Pillar: Company Pension (bAV - Direktversicherung § 3 Nr. 63 EStG)
    # Mandatory 15% employer subsidy (§ 1a Abs. 1a BetrAVG)
    total_bav_monthly_inflow = bav_contribution * (1.0 + BAV_EMPLOYER_SUBSIDY_RATE)
    bav_accumulated_capital = (total_bav_monthly_inflow * 12.0) * ((math.pow(1 + BAV_RETURN_RATE, years_until_retirement) - 1.0) / BAV_RETURN_RATE) if bav_contribution > 0 and years_until_retirement > 0 else 0.0
    bav_monthly_payout = (bav_accumulated_capital * SAFE_WITHDRAWAL_RATE) / 12.0

    # 3. 3rd Pillar: Private ETF Annuity & Riester
    etf_return_rate = 0.075 if risk_profile == "high" else 0.045 if risk_profile == "low" else 0.062
    total_etf_contributions = monthly_investment * 12.0 * years_until_retirement
    private_accumulated_capital = (monthly_investment * 12.0) * ((math.pow(1 + etf_return_rate, years_until_retirement) - 1.0) / etf_return_rate) if monthly_investment > 0 and years_until_retirement > 0 else 0.0
    
    # FIX (§ 20 EStG + § 20 InvStG): Tax only applies to GAINS after 30% Teilfreistellung,
    # not the total accumulated capital. Principal (contributions) was already taxed at source.
    sparerpauschbetrag = SPARERPAUSCHBETRAG_MARRIED if is_married else SPARERPAUSCHBETRAG_SINGLE
    etf_gross_gains = max(0.0, private_accumulated_capital - total_etf_contributions)
    etf_taxable_gains = etf_gross_gains * (1.0 - TEILFREISTELLUNG_EQUITY)  # 30% exemption
    etf_tax = max(0.0, etf_taxable_gains - sparerpauschbetrag) * ABGELTUNGSTEUER_RATE
    private_net_capital = private_accumulated_capital - etf_tax
    private_monthly_annuity = (private_net_capital * SAFE_WITHDRAWAL_RATE) / 12.0
    
    # Riester monthly pension (annual contribution basis)

    riester_capital = (riester_contribution) * ((math.pow(1 + 0.035, years_until_retirement) - 1.0) / 0.035) if riester_contribution > 0 else 0.0
    riester_monthly_pension = (riester_capital * 0.035) / 12.0
    
    # 4. Target Retirement Income & Rentenlücke Gap
    current_net_monthly = (gross_income * 0.60) / 12.0 # Approx net
    target_net_monthly_nominal = current_net_monthly * target_pension_ratio
    target_net_monthly_inflation_adjusted = target_net_monthly_nominal * math.pow(1.0 + inflation_rate, years_until_retirement)
    
    total_projected_net_monthly = statutory_net_pension_future + bav_monthly_payout + private_monthly_annuity + riester_monthly_pension
    pension_gap_monthly = max(0.0, target_net_monthly_inflation_adjusted - total_projected_net_monthly)
    
    replacement_ratio = min(2.0, total_projected_net_monthly / target_net_monthly_inflation_adjusted) if target_net_monthly_inflation_adjusted > 0 else 1.0
    
    # 5. Required Extra Monthly Investment to Bridge 100% of Rentenlücke
    if pension_gap_monthly > 0 and years_until_retirement > 0:
        required_capital_gap = (pension_gap_monthly * 12.0) / 0.04
        compound_factor = (math.pow(1.0 + etf_return_rate, years_until_retirement) - 1.0) / etf_return_rate
        required_monthly_savings_to_close = (required_capital_gap / compound_factor) / 12.0
    else:
        required_monthly_savings_to_close = 0.0

    return {
        "current_age": current_age,
        "retirement_age": retirement_age,
        "years_until_retirement": years_until_retirement,
        "entgeltpunkte_total": round(ep_total, 2),
        "entgeltpunkte_per_year": round(ep_per_year, 2),
        "zugangsfaktor": round(zugangsfaktor, 3),
        "early_late_penalty_pct": round((1.0 - zugangsfaktor) * 100.0, 1),
        "state_pension_monthly_gross": round(nominal_gross_pension, 2),
        "state_pension_monthly": round(statutory_net_pension_future, 2),
        "state_pension_monthly_real": round(statutory_net_pension_real, 2),
        "bav_pension_monthly": round(bav_monthly_payout, 2),
        "private_pension_monthly": round(private_monthly_annuity, 2),
        "riester_pension_monthly": round(riester_monthly_pension, 2),
        "total_retirement_income_monthly": round(total_projected_net_monthly, 2),
        "target_retirement_income_monthly": round(target_net_monthly_inflation_adjusted, 2),
        "pension_gap_monthly": round(pension_gap_monthly, 2),
        "replacement_ratio": round(replacement_ratio, 3),
        "solvency_score": round(min(100.0, replacement_ratio * 100.0)),
        "required_monthly_savings_to_close_gap": round(required_monthly_savings_to_close, 2),
        "private_nest_egg_projected": round(private_net_capital, 2),
        "calculation_basis": {
            "year": 2026,
            "average_earnings": DURCHSCHNITTSENTGELT,
            "pension_value": RENTENWERT,
            "rv_bbg": BBG_PENSION,
            "state_pension_accessible": state_pension_accessible,
            "etf_tax_on_gains_only": True,  # Fixed in 2026 audit
        },
    }
