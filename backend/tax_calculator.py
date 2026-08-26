import math
from typing import Dict, Any, Optional

def _calculate_grundtarif(zve: float) -> float:
    """
    Progressive Tax Formula (Grundtarif 2026 under § 32a EStG).
    Calculates income tax based on the taxable income (zu versteuerndes Einkommen - zvE).
    """
    zve = math.floor(max(0.0, zve))
    if zve <= 12348:
        return 0.0
    elif zve <= 17799:
        y = (zve - 12348) / 10000.0
        return (914.51 * y + 1400.0) * y
    elif zve <= 69878:
        z = (zve - 17799) / 10000.0
        return (173.10 * z + 2397.0) * z + 1034.87
    elif zve <= 277825:
        return 0.42 * zve - 11135.63
    else:
        return 0.45 * zve - 19470.38

def calculate_german_tax(
    gross_income: float,
    tax_class: int = 1,
    is_married: bool = False,
    church_tax: bool = False,
    church_tax_rate: float = 0.09,
    num_children: int = 0,
    additional_deductions: float = 0.0,
    has_private_health: bool = False,
    private_health_cost: float = 0.0,
    commute_km: int = 0,
    commute_days: int = 230,
    home_office_days: int = 0,
    riester_contribution: float = 0.0,
    handwerker_cost: float = 0.0,
    haushaltsnah_cost: float = 0.0,
    age: int = 30,
    children_under_25: Optional[int] = None,
    is_saxony: bool = False,
    joint_assessment: bool = True,
) -> Dict[str, Any]:
    """
    German Income Tax & Social Security Engine (2026 statutory schedules).
    Computes progressive EStG brackets, Soli Milderungszone (§ 4 SolzG), Werbungskosten (§ 9 EStG),
    Sonderausgaben (§ 10 EStG), Günstigerprüfung for Riester & Kindergeld, and direct tax credits.
    """
    details: Dict[str, Any] = {}
    gross_income = max(0.0, float(gross_income))
    
    # 1. Itemized Werbungskosten (§ 9 EStG)
    commute_days = min(max(0, commute_days), 230)
    actual_commute_days = max(0, commute_days - home_office_days)
    # 2026: €0.38 from the first distance kilometre (§ 9 EStG).
    commute_allowance = commute_km * 0.38 * actual_commute_days
    
    home_office_allowance = min(home_office_days * 6.0, 1260.0)
    work_equipment_pauschale = 110.0
    account_maintenance_pauschale = 16.0
    
    calculated_werbungskosten = commute_allowance + home_office_allowance + work_equipment_pauschale + account_maintenance_pauschale
    werbungskosten_pauschale = 1230.0  # § 9a Nr. 1 EStG
    effective_werbungskosten = max(werbungskosten_pauschale, calculated_werbungskosten)
    
    details['commute_allowance'] = round(commute_allowance, 2)
    details['home_office_allowance'] = round(home_office_allowance, 2)
    details['werbungskosten'] = round(effective_werbungskosten, 2)
    details['werbungskosten_exceeds_pauschale'] = calculated_werbungskosten > werbungskosten_pauschale
    details['werbungskosten_delta'] = round(max(0.0, calculated_werbungskosten - werbungskosten_pauschale), 2)
    
    # 2. Statutory Social Security Contributions (2026 schedules)
    BBG_KV_PV = 69750.0
    BBG_RV_AV = 101400.0
    
    # Statutory Rates (Employee Share)
    # 14.6% base plus 2.9% official average supplementary rate, shared equally.
    kv_gross = min(gross_income, BBG_KV_PV)
    if has_private_health and private_health_cost > 0:
        kv_employee = private_health_cost * 12.0 * 0.5  # Employer covers half up to max
    else:
        kv_employee = kv_gross * 0.0875
        
    # Pflegeversicherung (outside Saxony): 1.8% employee base share, plus
    # 0.6 percentage points for childless members aged 23+, or a 0.25 point
    # reduction for each second-to-fifth child under 25. Saxony shifts 0.5
    # percentage points from employer to employee.
    eligible_children = num_children if children_under_25 is None else max(0, children_under_25)
    if num_children == 0 and age >= 23:
        pv_rate = 0.024
    else:
        pv_rate = max(0.008, 0.018 - min(4, max(0, eligible_children - 1)) * 0.0025)
    if is_saxony:
        pv_rate += 0.005
    pv_employee = kv_gross * pv_rate
    
    # Rentenversicherung: 18.6% / 2 = 9.3%
    rv_gross = min(gross_income, BBG_RV_AV)
    rv_employee = rv_gross * 0.093
    
    # Arbeitslosenversicherung: 2.6% / 2 = 1.3%
    av_employee = rv_gross * 0.013
    
    total_social_security = kv_employee + pv_employee + rv_employee + av_employee
    
    details['social_security'] = {
        'health_insurance': round(kv_employee, 2),
        'care_insurance': round(pv_employee, 2),
        'pension_insurance': round(rv_employee, 2),
        'unemployment_insurance': round(av_employee, 2),
        'total': round(total_social_security, 2),
        'care_employee_rate': round(pv_rate, 4),
        'children_under_25_assumed': eligible_children,
        'saxony': is_saxony,
    }
    
    # 3. Sonderausgaben & Vorsorgeaufwendungen (§ 10 EStG)
    # Basic Health & Care is 100% tax deductible
    vorsorge_basis_health = kv_employee + pv_employee
    # Statutory pension contributions are treated as deductible retirement expenses (2026 cap €29,344).
    vorsorge_pension = min(rv_employee * 2.0, 29344.0) * 0.5 # Employee share
    total_vorsorge = vorsorge_basis_health + vorsorge_pension
    
    # Tax Class Adjustments
    class_allowance = 0.0
    if tax_class == 2:
        class_allowance = 4260.0  # Entlastungsbetrag für Alleinerziehende (§ 24b EStG)
        
    # Riester deduction (§ 10a EStG)
    max_riester = min(float(riester_contribution), 2100.0)
    riester_zulagen = 175.0 + (300.0 * num_children) if riester_contribution > 0 else 0.0
    
    total_deductions = effective_werbungskosten + total_vorsorge + additional_deductions + class_allowance + max_riester
    zve = max(0.0, gross_income - total_deductions)
    details['zvE'] = round(zve, 2)
    
    # 4. Progressive Base Tax Calculation (§ 32a EStG)
    def calc_tax(income_zve: float, married: bool) -> float:
        if married and joint_assessment:
            return _calculate_grundtarif(income_zve / 2.0) * 2.0
        return _calculate_grundtarif(income_zve)

    details['assessment_basis'] = {
        'mode': 'joint_estimate' if (is_married and joint_assessment) else 'individual_estimate',
        'withholding_tax_class': tax_class,
        'warning': 'Steuerklasse affects payroll withholding, not final assessed annual income tax. Joint splitting requires the conditions of §§ 26, 26b EStG and combined spouse income.',
    }
            
    base_tax = calc_tax(zve, is_married)
    
    # Riester Günstigerprüfung
    tax_without_riester = calc_tax(zve + max_riester, is_married)
    riester_tax_savings = max(0.0, tax_without_riester - base_tax)
    if riester_tax_savings > riester_zulagen and riester_contribution > 0:
        # § 10a(2): if the special-expense deduction wins, the allowance claim
        # is added back to assessed income tax.
        assessed_tax_pre_credits = base_tax + riester_zulagen
        riester_addback = riester_zulagen
        details['riester_benefit_used'] = 'deduction'
        details['riester_tax_benefit'] = round(riester_tax_savings - riester_zulagen, 2)
    else:
        assessed_tax_pre_credits = tax_without_riester
        riester_addback = 0.0
        details['riester_benefit_used'] = 'zulage' if riester_contribution > 0 else 'none'
        details['riester_tax_benefit'] = round(riester_zulagen, 2)
    details['riester_allowance_addback'] = round(riester_addback, 2)

    # Kinderfreibetrag vs Kindergeld (Günstigerprüfung § 31 EStG)
    kindergeld_received = num_children * 259.0 * 12.0
    kinderfreibetrag_total = num_children * 9756.0
    tax_with_kinderfreibetrag = calc_tax(
        max(0.0, (zve if details.get('riester_benefit_used') == 'deduction' else zve + max_riester) - kinderfreibetrag_total),
        is_married
    ) + riester_addback
    
    tax_savings_from_kinderfreibetrag = max(0.0, assessed_tax_pre_credits - tax_with_kinderfreibetrag)
    if num_children > 0 and tax_savings_from_kinderfreibetrag > kindergeld_received:
        # § 31: the child-benefit claim is added to assessed tax when the
        # allowance is more advantageous. The cash transfer remains received.
        assessed_tax_pre_credits = tax_with_kinderfreibetrag + kindergeld_received
        details['child_benefit_used'] = 'kinderfreibetrag'
        details['kinderfreibetrag_savings'] = round(tax_savings_from_kinderfreibetrag - kindergeld_received, 2)
        details['kindergeld_received'] = round(kindergeld_received, 2)
        details['kindergeld_addback'] = round(kindergeld_received, 2)
    else:
        details['child_benefit_used'] = 'kindergeld' if num_children > 0 else 'none'
        details['kindergeld_received'] = round(kindergeld_received, 2)
        details['kinderfreibetrag_savings'] = 0.0
        details['kindergeld_addback'] = 0.0

    # 5. Direct Tax Credits (§ 35a EStG)
    # Handwerkerleistungen: 20% of labor up to max €1,200
    handwerker_credit = min(handwerker_cost * 0.20, 1200.0)
    # Haushaltsnahe Dienstleistungen: 20% up to max €4,000
    haushaltsnah_credit = min(haushaltsnah_cost * 0.20, 4000.0)
    total_tax_credits = handwerker_credit + haushaltsnah_credit
    
    final_tax = max(0.0, assessed_tax_pre_credits - total_tax_credits)
    details['income_tax'] = round(final_tax, 2)
    details['tax_credits'] = round(total_tax_credits, 2)

    # 6. Solidaritätszuschlag 2026: assessed on tax liability before § 35a credits (§ 51a EStG, § 4 SolzG)
    soli_basis_tax = assessed_tax_pre_credits
    soli_freigrenze = 40700.0 if (is_married or tax_class == 3) else 20350.0
    if soli_basis_tax <= soli_freigrenze:
        soli = 0.0
    else:
        # Milderungszone: 11.9% of excess over Freigrenze, capped at standard 5.5% of total tax
        milderung_soli = (soli_basis_tax - soli_freigrenze) * 0.119
        standard_soli = soli_basis_tax * 0.055
        soli = min(milderung_soli, standard_soli)
    details['solidarity_surcharge'] = round(soli, 2)

    # 7. Church Tax (Kirchensteuer 8% in Bayern/Baden-Württemberg, 9% elsewhere)
    if church_tax:
        church_tax_amount = final_tax * church_tax_rate
    else:
        church_tax_amount = 0.0
    details['church_tax_amount'] = round(church_tax_amount, 2)

    # 8. Net Income Calculation
    total_statutory_deductions = final_tax + soli + church_tax_amount + total_social_security
    net_income = max(0.0, gross_income - total_statutory_deductions + details.get('kindergeld_received', 0.0))
    
    effective_tax_rate = (final_tax + soli + church_tax_amount) / gross_income if gross_income > 0 else 0.0
    marginal_tax_rate = max(0.0, (calc_tax(zve + 100.0, is_married) - calc_tax(zve, is_married)) / 100.0)

    return {
        "gross_income": round(gross_income, 2),
        "tax_amount": round(final_tax + soli + church_tax_amount, 2),
        "net_income": round(net_income, 2),
        "effective_tax_rate": round(effective_tax_rate, 4),
        "marginal_tax_rate": round(marginal_tax_rate, 4),
        "details": details,
        "calculation_basis": {
            "year": 2026,
            "tariff": "§ 32a EStG 2026 estimate",
            "limitations": [
                "This is an annual assessment estimate, not a payroll withholding calculation or tax return.",
                "Multiple income types, spouse income, loss carryforwards and individual special expenses require additional inputs.",
                "Riester eligibility, child birth years, the Soli child-allowance basis and exact allowance entitlement require document-level verification.",
            ],
        },
    }

def calculate_tax(gross_income: float, tax_class: int = 1, is_married: bool = False,
                  church_tax: bool = False, church_tax_rate: float = 0.09,
                  num_children: int = 0, additional_deductions: float = 0.0,
                  has_private_health: bool = False, private_health_cost: float = 0.0,
                  commute_km: int = 0, commute_days: int = 230, home_office_days: int = 0,
                  riester_contribution: float = 0.0, age: int = 30,
                  children_under_25: Optional[int] = None, is_saxony: bool = False,
                  joint_assessment: bool = True) -> Dict[str, Any]:
    """Adapter function maintaining exact backwards compatibility with earlier wrappers."""
    return calculate_german_tax(
        gross_income=gross_income,
        tax_class=tax_class,
        is_married=is_married,
        church_tax=church_tax,
        church_tax_rate=church_tax_rate,
        num_children=num_children,
        additional_deductions=additional_deductions,
        has_private_health=has_private_health,
        private_health_cost=private_health_cost,
        commute_km=commute_km,
        commute_days=commute_days,
        home_office_days=home_office_days,
        riester_contribution=riester_contribution,
        age=age,
        children_under_25=children_under_25,
        is_saxony=is_saxony,
        joint_assessment=joint_assessment,
    )
