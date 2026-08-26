import math
from typing import Dict, List, Any

def generate_optimization_suggestions(
    profile: Dict[str, Any], 
    tax_result: Dict[str, Any], 
    investment_result: Dict[str, Any], 
    retirement_result: Dict[str, Any], 
    insurance_list: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Institutional Wealth Optimization Engine for German High-Net-Worth & Professional Clients.
    Evaluates 5 Pillars:
    1. Fiscal & Tax Alpha (§ 32a, § 9, § 10, § 35a EStG)
    2. Existential Human Capital & Liability Defense (§ 823 BGB, SGB VI)
    3. Multi-Asset Portfolio Engineering & Fee Drag Elimination
    4. DRV Rentenlücke & 3-Pillar Retirement Solvency
    5. Monthly Cash Flow Liquidity & Savings Rate Efficiency
    """
    tax_optimizations: List[Dict[str, Any]] = []
    investment_suggestions: List[Dict[str, Any]] = []
    retirement_actions: List[Dict[str, Any]] = []
    insurance_actions: List[Dict[str, Any]] = []
    
    total_potential_tax_savings = 0.0
    priorities = []
    
    income = profile.get("income", 60000)
    age = profile.get("age", 30)
    ret_age = profile.get("retirement_age", 67)
    monthly_inv = profile.get("monthly_investment", 500)
    commute_km = profile.get("commute_km", 0)
    ho_days = profile.get("home_office_days", 0)
    is_married = profile.get("is_married", False)
    num_children = profile.get("num_children", 0)
    existing_ins = [str(i).lower() for i in profile.get("existing_insurances", [])]
    
    # 1. Tax Optimizations
    # 1.1 Commuting & Home Office (Werbungskosten)
    if commute_km > 0 or ho_days > 0:
        commute_days = max(230 - ho_days, 0)
        commute_ded = commute_km * 0.38 * commute_days
        ho_ded = min(ho_days * 6.0, 1260.0)
        total_itemized = commute_ded + ho_ded + 110.0 + 16.0
        if total_itemized > 1230.0:
            excess = total_itemized - 1230.0
            est_tax_save = excess * (0.42 if income > 69878 else 0.30)
            tax_optimizations.append({
                "id": "tax_werbungskosten_opt",
                "title": "Itemized Werbungskosten Deductions (§ 9 EStG)",
                "description": f"Your logged commute ({commute_km}km) and home office ({ho_days} days) exceed the statutory €1,230 Pauschbetrag by €{round(excess):,}, unlocking an annual cash refund.",
                "potential_savings": round(est_tax_save, 2),
                "priority": "high",
                "category": "Werbungskosten",
                "statute": "§ 9 Abs. 1 Nr. 4 EStG",
                "action": "Submit Anlage N with exact commute and home office day itemization."
            })
            total_potential_tax_savings += est_tax_save
            priorities.append(("tax_werbungskosten_opt", est_tax_save, "high"))
    else:
        tax_optimizations.append({
            "id": "tax_werbungskosten_missing",
            "title": "Unclaimed Werbungskosten Deductions",
            "description": "You are currently defaulting to the €1,230 flat lump-sum. Itemizing commute distance and work equipment typically unlocks €400 - €1,200 in tax refunds.",
            "potential_savings": 450.0,
            "priority": "high",
            "category": "Werbungskosten",
            "statute": "§ 9 EStG",
            "action": "Track and enter daily commute km and home office days."
        })
        total_potential_tax_savings += 450.0
        priorities.append(("tax_werbungskosten_missing", 450.0, "high"))
        
    # 1.2 Married Splitting (Ehegattensplitting)
    if is_married and profile.get("tax_class", 1) == 1:
        splitting_advantage = 1200.0 if income > 70000 else 600.0
        tax_optimizations.append({
            "id": "tax_splitting",
            "title": "Optimize Monthly Net Liquidity & Splitting (§ 32a Abs. 5 EStG)",
            "description": "Married couples can optimize monthly take-home cash flow by selecting Steuerklasse III/V or IV with Factor (annual assessed tax is reconciled on the joint return).",
            "potential_savings": splitting_advantage,
            "priority": "high",
            "category": "Splittingtarif",
            "statute": "§ 32a Abs. 5 EStG",
            "action": "Submit tax class change request to your local Finanzamt."
        })
        total_potential_tax_savings += splitting_advantage
        priorities.append(("tax_splitting", splitting_advantage, "high"))
        
    # 1.3 Sparerpauschbetrag & Freistellungsauftrag
    tax_optimizations.append({
        "id": "tax_freistellung",
        "title": "Maximize Sparerpauschbetrag (§ 20 Abs. 9 EStG)",
        "description": f"Ensure your €1,000 (€2,000 if married) tax-free capital gains allowance is distributed across your broker accounts.",
        "potential_savings": 263.75 * (2 if is_married else 1),
        "priority": "medium",
        "category": "Capital Gains",
        "statute": "§ 20 Abs. 9 EStG",
        "action": "Set up a Freistellungsauftrag with your ETF custodian broker."
    })
    total_potential_tax_savings += 263.75 * (2 if is_married else 1)

    # 2. Investment & Fee Optimization
    cost_drag = investment_result.get("cost_drag_analysis", {})
    fee_wealth_lost = cost_drag.get("total_fee_wealth_lost", 85000.0)
    investment_suggestions.append({
        "id": "inv_fee_drag",
        "title": "Eliminate Mutual Fund Fee Drag (TER 0.18% vs 1.85%)",
        "description": f"Over your {investment_result.get('years', 20)}-year horizon, shifting from active bank funds to low-cost passive ETFs recovers €{round(fee_wealth_lost):,} in net compounded wealth.",
        "potential_savings": round(fee_wealth_lost, 2),
        "priority": "high",
        "category": "Portfolio Engineering",
        "statute": "§ 20 InvStG (30% Teilfreistellung)",
        "action": "Consolidate long-term capital into broad-market physical ETFs (e.g. MSCI World)."
    })
    priorities.append(("inv_fee_drag", fee_wealth_lost, "high"))

    # 3. Existential Risk & Insurance
    if "liability" not in existing_ins and "privathaftpflicht" not in existing_ins:
        insurance_actions.append({
            "id": "ins_liability_essential",
            "title": "Immediate Privathaftpflicht Shield (§ 823 BGB)",
            "description": "Unlimited personal liability protection (€50M standard). Essential to prevent total personal bankruptcy from third-party claims.",
            "potential_savings": 0.0,
            "priority": "high",
            "category": "Existential Shield",
            "statute": "§ 823 Abs. 1 BGB",
            "action": "Activate institutional €50M private liability coverage immediately."
        })
        priorities.append(("ins_liability_essential", 1000000.0, "high"))
        
    if "bu" not in existing_ins and "berufsunfaehigkeit" not in existing_ins:
        human_capital = income * max(1, ret_age - age)
        insurance_actions.append({
            "id": "ins_bu_essential",
            "title": "Human Capital Protection (Berufsunfähigkeit - BU)",
            "description": f"Your remaining lifetime earning power is €{round(human_capital):,}. State disability pays under €550/mo. A private BU policy securing 80% net salary is critical.",
            "potential_savings": 0.0,
            "priority": "high",
            "category": "Income Defense",
            "statute": "SGB VI § 43",
            "action": "Underwrite an 80% net salary BU annuity with 0% abstract referral."
        })
        priorities.append(("ins_bu_essential", human_capital, "high"))

    # 4. Retirement & Rentenlücke Solvency
    pension_gap = retirement_result.get("pension_gap_monthly", 0.0)
    req_savings = retirement_result.get("required_monthly_savings_to_close_gap", 0.0)
    if pension_gap > 0:
        retirement_actions.append({
            "id": "ret_close_gap",
            "title": "Bridge Actuarial Rentenlücke Gap",
            "description": f"Your projected purchasing power shortfall is €{round(pension_gap):,}/mo. Increasing monthly ETF savings by €{round(req_savings):,}/mo achieves 100% replacement solvency.",
            "potential_savings": round(pension_gap * 12.0 * 20, 2),
            "priority": "high",
            "category": "3-Pillar Solvency",
            "statute": "SGB VI & § 22 EStG",
            "action": f"Increase monthly ETF contribution by €{round(req_savings):,}/mo."
        })
        priorities.append(("ret_close_gap", pension_gap * 12, "high"))

    # 5. Financial Health Scoring (5 Institutional Dimensions)
    # Score 0 to 100
    score_tax = 20 if (commute_km > 0 or ho_days > 0) else 10
    score_risk = (10 if ("liability" in existing_ins or "privathaftpflicht" in existing_ins) else 0) + \
                 (10 if ("bu" in existing_ins or "berufsunfaehigkeit" in existing_ins) else 0)
    score_invest = 20 if monthly_inv >= (income * 0.15 / 12) else 12 if monthly_inv > 0 else 0
    score_pension = 20 if pension_gap <= 0 else 15 if pension_gap < 500 else 8
    score_liquidity = 20 if profile.get("initial_amount", 0) >= (income * 0.25) else 12
    
    total_score = min(100, max(10, score_tax + score_risk + score_invest + score_pension + score_liquidity))

    # Top Priorities Mapping
    all_actions = tax_optimizations + investment_suggestions + retirement_actions + insurance_actions
    top_3_priorities = [act for act in all_actions if act.get("priority") == "high"][:3]
    if len(top_3_priorities) < 3:
        top_3_priorities = all_actions[:3]

    summary = {
        "total_potential_tax_savings": round(total_potential_tax_savings, 2),
        "financial_health_score": total_score,
        "score_breakdown": {
            "tax_efficiency": score_tax,
            "risk_defense": score_risk,
            "investment_growth": score_invest,
            "retirement_solvency": score_pension,
            "liquidity_reserve": score_liquidity
        },
        "top_3_priorities": top_3_priorities,
        "lifetime_human_capital_at_risk": round(income * max(1, ret_age - age), 2),
        "projected_30yr_wealth": round(investment_result.get("projected_p50", 0), 2)
    }

    return {
        "tax_optimizations": tax_optimizations,
        "investment_suggestions": investment_suggestions,
        "retirement_actions": retirement_actions,
        "insurance_actions": insurance_actions,
        "summary": summary
    }
