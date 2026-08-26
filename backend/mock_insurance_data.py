from typing import List, Dict, Any, Optional

def get_insurance_recommendation(
    age: int,
    has_dependents: bool,
    income: float,
    is_married: bool = False,
    has_property: bool = False,
    has_car: bool = False,
    existing_insurances: Optional[List[str]] = None
) -> List[Dict[str, Any]]:
    """
    Generates a personalized insurance needs analysis for German clients.
    
    Args:
        age (int): The client's age in years.
        has_dependents (bool): Whether the client has children or dependents.
        income (float): The client's annual gross income in EUR.
        is_married (bool): Whether the client is married.
        has_property (bool): Whether the client owns real estate.
        has_car (bool): Whether the client owns a car.
        existing_insurances (list): List of existing insurance IDs to exclude.
        
    Returns:
        List[Dict[str, Any]]: A prioritized list of recommended insurances.
    """
    if existing_insurances is None:
        existing_insurances = []
        
    recommendations = []

    # 1. Privathaftpflichtversicherung (Private Liability)
    if 'privathaftpflicht' not in existing_insurances:
        premium = 7.0 if (is_married or has_dependents) else 4.0
        recommendations.append({
            "id": "privathaftpflicht",
            "name": "Privathaftpflichtversicherung",
            "type": "Liability",
            "priority": "essential",
            "monthly_premium": round(premium, 2),
            "coverage_amount": 10000000.0,
            "description": "Covers damages you accidentally cause to third parties.",
            "reasoning": "This is the most critical insurance in Germany. Without it, you are liable with your entire current and future assets for any damages you cause.",
            "coverage_gap": "Unlimited personal liability for property damage, personal injury, and financial loss caused to others."
        })

    # 2. Berufsunfähigkeitsversicherung (BU)
    if 'berufsunfaehigkeit' not in existing_insurances and income > 0:
        net_income_monthly = (income * 0.6) / 12.0
        coverage = net_income_monthly * 0.8
        age_factor = max(1.0, 1.0 + (age - 20) * 0.04)
        premium = coverage * 0.03 * age_factor
        recommendations.append({
            "id": "berufsunfaehigkeit",
            "name": "Berufsunfähigkeitsversicherung",
            "type": "Disability",
            "priority": "essential",
            "monthly_premium": round(premium, 2),
            "coverage_amount": round(coverage, 2),
            "description": "Provides a monthly pension if you are unable to work due to illness or accident.",
            "reasoning": f"Your ability to earn an income is your biggest financial asset. At age {age}, losing this ability would mean severe financial hardship.",
            "coverage_gap": "Reliance on minimal statutory reduced earning capacity pension (Erwerbsminderungsrente), which is rarely enough to maintain living standards."
        })

    # 3. Risikolebensversicherung
    if 'risikoleben' not in existing_insurances and has_dependents:
        coverage = income * 4.0
        base_rate = 1.0 + max(0, age - 25) * 0.06
        premium = (coverage / 100000.0) * base_rate * 4.0
        recommendations.append({
            "id": "risikoleben",
            "name": "Risikolebensversicherung",
            "type": "Term Life",
            "priority": "essential",
            "monthly_premium": round(premium, 2),
            "coverage_amount": round(coverage, 2),
            "description": "Pays out a lump sum to your beneficiaries in the event of your death.",
            "reasoning": "Since you have dependents, it is crucial to financially secure their future and cover ongoing living costs if you were to pass away.",
            "coverage_gap": "Dependents could face immediate financial distress and inability to cover living expenses or debts."
        })

    # 4. Private Krankenversicherung (PKV)
    # JAEG 2026 = €77,400 (§ 6 Abs. 6 SGB V). Threshold updated from 2024 value (€69,300).
    if 'pkv' not in existing_insurances and income > 77400:
        premium = max(300.0, 150.0 + age * 12.0)
        recommendations.append({
            "id": "pkv",
            "name": "Private Krankenversicherung (PKV)",
            "type": "Health",
            "priority": "optional",
            "monthly_premium": round(premium, 2),
            "coverage_amount": 0.0,
            "description": "Private health insurance offering superior medical coverage compared to statutory insurance.",
            "reasoning": f"Your income of {income}€ exceeds the 2026 Versicherungspflichtgrenze (€77,400). Eligibility permits a GKV/PKV comparison, but suitability depends on health, family status, lifetime premiums and return-to-GKV constraints.",
            "coverage_gap": "Subject to standard statutory care (GKV) with longer wait times for specialists and limited coverage for advanced treatments."
        })

    # 5. Hausratversicherung
    if 'hausrat' not in existing_insurances:
        living_space = 80.0 if has_property else 60.0
        premium = living_space * 0.15
        coverage = living_space * 650.0
        recommendations.append({
            "id": "hausrat",
            "name": "Hausratversicherung",
            "type": "Property",
            "priority": "recommended",
            "monthly_premium": round(premium, 2),
            "coverage_amount": round(coverage, 2),
            "description": "Covers your household belongings against fire, burglary, water damage, and storms.",
            "reasoning": "Protects your personal belongings. Replacing all furniture, electronics, and clothing after a total loss (e.g., fire) is extremely expensive.",
            "coverage_gap": "Out-of-pocket replacement of all household items after burglary, fire, or severe water damage."
        })

    # 6. Wohngebäudeversicherung
    if 'wohngebaeude' not in existing_insurances and has_property:
        premium = 45.0
        recommendations.append({
            "id": "wohngebaeude",
            "name": "Wohngebäudeversicherung",
            "type": "Real Estate",
            "priority": "essential",
            "monthly_premium": round(premium, 2),
            "coverage_amount": 500000.0,
            "description": "Covers the physical structure of your house against fire, storm, hail, and tap water damage.",
            "reasoning": "As a property owner, your house is likely your biggest asset. A total loss would mean financial ruin without insurance.",
            "coverage_gap": "Bearing the total cost of rebuilding or repairing the property after major damage."
        })

    # 7. Rechtsschutzversicherung
    if 'rechtsschutz' not in existing_insurances:
        recommendations.append({
            "id": "rechtsschutz",
            "name": "Rechtsschutzversicherung",
            "type": "Legal",
            "priority": "optional",
            "monthly_premium": 28.50,
            "coverage_amount": 1000000.0,
            "description": "Covers legal fees, court costs, and lawyer expenses in case of disputes.",
            "reasoning": "Legal disputes (employment, traffic, private contracts) can be costly. This provides peace of mind to enforce your rights.",
            "coverage_gap": "Reluctance to pursue legitimate legal claims due to high upfront lawyer and court costs."
        })

    # 8. Kfz-Versicherung
    if 'kfz' not in existing_insurances and has_car:
        premium = 120.0 if age < 25 else 55.0
        recommendations.append({
            "id": "kfz",
            "name": "Kfz-Versicherung",
            "type": "Auto",
            "priority": "essential",
            "monthly_premium": round(premium, 2),
            "coverage_amount": 100000000.0,
            "description": "Mandatory auto liability insurance, potentially with partial or fully comprehensive coverage.",
            "reasoning": "It is legally required to have at least liability coverage to drive a car in Germany.",
            "coverage_gap": "Illegal to drive without it. Full personal liability for damages caused with the vehicle."
        })

    # 9. Zahnzusatzversicherung
    if 'zahnzusatz' not in existing_insurances:
        premium = max(10.0, age * 0.6)
        recommendations.append({
            "id": "zahnzusatz",
            "name": "Zahnzusatzversicherung",
            "type": "Health Supplementary",
            "priority": "optional",
            "monthly_premium": round(premium, 2),
            "coverage_amount": 0.0,
            "description": "Covers dental treatments like implants and professional cleaning not paid by statutory insurance.",
            "reasoning": "Statutory health insurance covers very little for high-quality dental prosthetics. Costs increase with age.",
            "coverage_gap": "High co-payments (often thousands of euros) for dental implants, crowns, and bridges."
        })

    # 10. Pflegezusatzversicherung
    if 'pflegezusatz' not in existing_insurances and age > 40:
        premium = (age - 30) * 1.5
        recommendations.append({
            "id": "pflegezusatz",
            "name": "Pflegezusatzversicherung",
            "type": "Care Supplementary",
            "priority": "recommended",
            "monthly_premium": round(premium, 2),
            "coverage_amount": 1500.0,
            "description": "Provides additional monthly funds in case you require long-term nursing care.",
            "reasoning": f"At age {age}, it is wise to secure affordable premiums. Statutory long-term care insurance does not cover the full costs of a nursing home.",
            "coverage_gap": "Depletion of personal savings and potential financial burden on children to pay for care home costs."
        })

    # Sorting based on priority
    priority_map = {"essential": 1, "recommended": 2, "optional": 3}
    recommendations.sort(key=lambda x: priority_map.get(str(x.get("priority", "")), 99))

    return recommendations
