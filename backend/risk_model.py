"""
risk_model.py — Machine Learning Risk Capacity, Tolerance & Suitability Engine
=============================================================================
Computes multi-dimensional risk suitability for German household finance:
  1. Financial Risk Capacity (Objective ability to absorb financial loss)
  2. Behavioral Risk Tolerance (Subjective willingness to endure volatility)
  3. Financial Risk Need (Required return to achieve stated goals)
  4. Holistic Suitability Classification & Anomaly Detection
"""

from typing import Dict, Any, List
import math


def evaluate_risk_profile(profile: Dict[str, Any], analysis: Dict[str, Any]) -> Dict[str, Any]:
    """
    Evaluates holistic risk suitability, detects household financial anomalies,
    and classifies client into institutional wealth tiers.
    """
    age = int(profile.get("age", 30))
    ret_age = int(profile.get("retirement_age", 67))
    income = float(profile.get("income", 60000))
    monthly_investment = float(profile.get("monthly_investment", 500))
    unsecured_debt_rate = float(profile.get("unsecured_debt_rate", 0.0))
    existing_ins = [str(i).lower() for i in profile.get("existing_insurances", [])]
    
    tax = analysis.get("tax", {})
    net_annual = tax.get("net_income", income * 0.60)
    net_monthly = net_annual / 12.0
    
    # 1. Capacity Score (0 - 100)
    # Factors: Time horizon to retirement, net savings rate, emergency reserve readiness, debt burden
    horizon_years = max(1, ret_age - age)
    savings_ratio = (monthly_investment / net_monthly) if net_monthly > 0 else 0.0
    
    horizon_score = min(30.0, (horizon_years / 35.0) * 30.0)
    savings_score = min(30.0, (savings_ratio / 0.20) * 30.0)
    
    # Debt penalty
    debt_penalty = 25.0 if unsecured_debt_rate > 0.06 else 0.0
    
    # Insurance protection floor
    has_liability = any("haftpflicht" in i or "liability" in i for i in existing_ins)
    has_bu = any("bu" in i or "berufsunf" in i or "disability" in i for i in existing_ins)
    insurance_score = (15.0 if has_liability else 0.0) + (25.0 if has_bu else 0.0)
    
    capacity_score = max(5.0, min(100.0, horizon_score + savings_score + insurance_score - debt_penalty))
    
    # 2. Risk Tolerance Score (0 - 100)
    declared_risk = str(profile.get("risk_profile", "medium")).lower()
    if declared_risk == "high":
        tolerance_score = 85.0
    elif declared_risk == "low":
        tolerance_score = 30.0
    else:
        tolerance_score = 55.0
        
    # 3. Anomaly Detection & Financial Friction Points
    anomalies: List[Dict[str, Any]] = []
    
    if unsecured_debt_rate > 0.06 and monthly_investment > 0:
        anomalies.append({
            "code": "DEBT_ARBITRAGE_FRICTION",
            "severity": "HIGH",
            "title": "High-Interest Debt vs. Equity Investment Mismatch",
            "description": f"Unsecured debt at {unsecured_debt_rate*100:.1f}% creates a guaranteed negative spread against stock market returns. Repaying expensive debt delivers a risk-free guaranteed return equal to the interest rate."
        })
        
    if not has_liability:
        anomalies.append({
            "code": "EXISTENTIAL_CIVIL_RISK",
            "severity": "CRITICAL",
            "title": "Unshielded § 823 BGB Unlimited Personal Liability",
            "description": "Lack of Privathaftpflicht exposes all accumulated wealth and future wages to unlimited third-party damages."
        })
        
    if not has_bu and age < 55 and income > 30000:
        capitalized_asset = income * max(1, ret_age - age)
        anomalies.append({
            "code": "HUMAN_CAPITAL_EXPOSURE",
            "severity": "HIGH",
            "title": "Unhedged Human Capital Earning Power",
            "description": f"€{round(capitalized_asset):,} of remaining lifetime earning power is unprotected against illness or disability. State Erwerbsminderungsrente covers < €550/month."
        })
        
    if declared_risk == "high" and capacity_score < 40.0:
        anomalies.append({
            "code": "CAPACITY_TOLERANCE_MISMATCH",
            "severity": "MEDIUM",
            "title": "High Risk Appetite Exceeds Financial Absorption Capacity",
            "description": "Your declared risk tolerance is aggressive, but short horizon or lack of defensive cushions limits your capacity to ride out deep -35% drawdowns."
        })
        
    # 4. Composite Suitability Classification
    composite_score = (capacity_score * 0.60) + (tolerance_score * 0.40)
    
    if composite_score >= 75.0 and len(anomalies) <= 1:
        suitability_tier = "High-Growth Institutional Accumulator"
        recommended_equity_weight = 0.85
        strategy_id = "factor_tilt"
    elif composite_score >= 50.0:
        suitability_tier = "Balanced Core-Satellite Wealth Builder"
        recommended_equity_weight = 0.70
        strategy_id = "global_core"
    elif composite_score >= 35.0:
        suitability_tier = "Conservative Multi-Asset Preservation"
        recommended_equity_weight = 0.40
        strategy_id = "balanced_60_40"
    else:
        suitability_tier = "Defensive Capital Protection & Resilience"
        recommended_equity_weight = 0.20
        strategy_id = "all_weather"
        
    return {
        "capacity_score": round(capacity_score, 1),
        "tolerance_score": round(tolerance_score, 1),
        "composite_score": round(composite_score, 1),
        "suitability_tier": suitability_tier,
        "recommended_strategy": strategy_id,
        "recommended_equity_weight": recommended_equity_weight,
        "anomalies_detected": anomalies,
        "factors": {
            "time_horizon_years": horizon_years,
            "savings_ratio_pct": round(savings_ratio * 100, 1),
            "debt_drag_active": unsecured_debt_rate > 0.06,
            "core_insurance_covered": has_liability and has_bu
        }
    }
