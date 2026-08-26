import random
import math
from typing import Dict, List, Any, Tuple

ASSET_CLASSES: Dict[str, Dict[str, Any]] = {
    "global_equity": {
        "name": "Global Equities (MSCI World)",
        "expected_return": 0.075,  # 7.5% nominal
        "volatility": 0.155,       # 15.5% std dev
        "ter": 0.0018,             # 0.18% TER (Core ETF)
    },
    "eu_equity": {
        "name": "European Equities (STOXX 600)",
        "expected_return": 0.065,
        "volatility": 0.170,
        "ter": 0.0015,
    },
    "emerging_markets": {
        "name": "Emerging Markets Equity",
        "expected_return": 0.085,
        "volatility": 0.210,
        "ter": 0.0022,
    },
    "eu_bonds": {
        "name": "European Government Bonds",
        "expected_return": 0.028,
        "volatility": 0.045,
        "ter": 0.0010,
    },
    "corporate_bonds": {
        "name": "EUR Corporate Investment Grade",
        "expected_return": 0.042,
        "volatility": 0.065,
        "ter": 0.0015,
    },
    "real_estate": {
        "name": "Real Estate (European REITs)",
        "expected_return": 0.058,
        "volatility": 0.130,
        "ter": 0.0030,
    },
    "commodities": {
        "name": "Physical Gold & Commodities",
        "expected_return": 0.045,
        "volatility": 0.145,
        "ter": 0.0025,
    },
}

PORTFOLIO_MODELS: Dict[str, Dict[str, Any]] = {
    "low": {
        "label": "Conservative Wealth Preservation",
        "allocation": {
            "eu_bonds": 0.45,
            "corporate_bonds": 0.20,
            "global_equity": 0.15,
            "real_estate": 0.10,
            "commodities": 0.10,
        },
    },
    "medium": {
        "label": "Balanced Core-Satellite Growth",
        "allocation": {
            "global_equity": 0.40,
            "eu_equity": 0.10,
            "emerging_markets": 0.10,
            "eu_bonds": 0.15,
            "corporate_bonds": 0.10,
            "real_estate": 0.08,
            "commodities": 0.07,
        },
    },
    "high": {
        "label": "High-Alpha Aggressive Accumulator",
        "allocation": {
            "global_equity": 0.50,
            "eu_equity": 0.15,
            "emerging_markets": 0.15,
            "corporate_bonds": 0.05,
            "real_estate": 0.08,
            "commodities": 0.07,
        },
    },
}

ASSET_ORDER = ["global_equity", "eu_equity", "emerging_markets", "eu_bonds", "corporate_bonds", "real_estate", "commodities"]

CORRELATION_MATRIX = [
    #  glb    eu     em     bd     cb     re     cmd
    [ 1.00,  0.78,  0.65, -0.05,  0.22,  0.55,  0.15], # global_equity
    [ 0.78,  1.00,  0.62, -0.02,  0.28,  0.58,  0.12], # eu_equity
    [ 0.65,  0.62,  1.00, -0.08,  0.18,  0.48,  0.25], # emerging_markets
    [-0.05, -0.02, -0.08,  1.00,  0.65,  0.20,  0.10], # eu_bonds
    [ 0.22,  0.28,  0.18,  0.65,  1.00,  0.35,  0.08], # corporate_bonds
    [ 0.55,  0.58,  0.48,  0.20,  0.35,  1.00,  0.18], # real_estate
    [ 0.15,  0.12,  0.25,  0.10,  0.08,  0.18,  1.00], # commodities
]

def _cholesky_decompose(matrix: List[List[float]]) -> List[List[float]]:
    """Computes the lower-triangular Cholesky decomposition L of positive-definite matrix A."""
    n = len(matrix)
    L = [[0.0] * n for _ in range(n)]
    for i in range(n):
        for j in range(i + 1):
            s = sum(L[i][k] * L[j][k] for k in range(j))
            if i == j:
                val = matrix[i][i] - s
                L[i][j] = math.sqrt(max(val, 1e-10))
            else:
                if L[j][j] > 1e-10:
                    L[i][j] = (matrix[i][j] - s) / L[j][j]
                else:
                    L[i][j] = 0.0
    return L

def _apply_german_capital_gains_tax(gains: float, used_allowance: float = 0.0) -> Tuple[float, float]:
    """
    Applies German Abgeltungsteuer (25% + 5.5% Soli = 26.375%) with Sparerpauschbetrag (€1,000).
    Returns (tax_owed, new_total_allowance_used).
    """
    SPARERPAUSCHBETRAG = 1000.0
    TAX_RATE = 0.26375
    
    remaining_allowance = max(0.0, SPARERPAUSCHBETRAG - used_allowance)
    taxable_gains = max(0.0, gains - remaining_allowance)
    allowance_used = min(gains, remaining_allowance)
    
    tax = taxable_gains * TAX_RATE
    new_used = used_allowance + allowance_used
    return tax, new_used

def _generate_correlated_returns(L: List[List[float]], asset_params: List[Tuple[float, float]]) -> List[float]:
    """Generates one vector of correlated annual returns for all assets via Geometric Brownian Motion."""
    n = len(asset_params)
    z = [random.gauss(0.0, 1.0) for _ in range(n)]
    correlated_z = [sum(L[i][k] * z[k] for k in range(i + 1)) for i in range(n)]
    
    returns = []
    for i, (mu, sigma) in enumerate(asset_params):
        annual_ret = math.exp((mu - 0.5 * sigma * sigma) + sigma * correlated_z[i]) - 1.0
        returns.append(annual_ret)
    return returns

def simulate_investment_growth(
    initial_amount: float,
    monthly_contribution: float,
    years: int,
    risk_profile: str = "medium",
    inflation_rate: float = 0.02,
    management_fee: float = 0.0018,
    num_simulations: int = 1000,
    seed: int = 42,
    target_wealth: float = 0.0
) -> Dict[str, Any]:
    """
    Institutional Monte Carlo Multi-Asset Investment & Tax-Drag Engine.
    Simulates stochastic correlated market trajectories, percentile fan curves,
    Vorabpauschale (§ 18 InvStG), Teilfreistellung (§ 20 InvStG), and Active vs. Passive cost drag.
    """
    if seed is not None:
        random.seed(seed)

    initial_amount = max(0.0, float(initial_amount))
    monthly_contribution = max(0.0, float(monthly_contribution))
    years = max(1, int(years))
    
    if risk_profile not in PORTFOLIO_MODELS:
        risk_profile = "medium"
        
    model = PORTFOLIO_MODELS[risk_profile]
    allocation = model["allocation"]
    label = model["label"]
    
    weights = [allocation.get(k, 0.0) for k in ASSET_ORDER]
    asset_params = [(float(ASSET_CLASSES[k]["expected_return"]), float(ASSET_CLASSES[k]["volatility"])) for k in ASSET_ORDER]
    
    L = _cholesky_decompose(CORRELATION_MATRIX)
    
    annual_contribution = monthly_contribution * 12.0
    total_contributions = initial_amount + annual_contribution * years
    
    simulation_trajectories = [] # [sim_idx][year_idx]
    final_values = []
    real_final_values = []
    max_drawdowns = []
    
    # 2026 German statutory parameters (§ 18 InvStG)
    BASISZINS_2026 = 0.025
    equity_weight = sum(weights[i] for i, k in enumerate(ASSET_ORDER) if "equity" in k)
    teilfreistellung = 0.30 * equity_weight
    
    for _ in range(num_simulations):
        portfolio_val = initial_amount
        trajectory = [portfolio_val]
        peak_val = portfolio_val
        max_dd = 0.0
        
        for yr in range(1, years + 1):
            asset_returns = _generate_correlated_returns(L, asset_params)
            blended_gross_return = sum(weights[i] * asset_returns[i] for i in range(len(weights)))
            blended_net_return = blended_gross_return - management_fee
            
            # Statutory German Vorabpauschale (§ 18 InvStG)
            start_val = portfolio_val
            basisertrag = start_val * BASISZINS_2026 * 0.70
            actual_growth = max(0.0, start_val * max(0.0, blended_net_return))
            vorabpauschale = min(basisertrag, actual_growth)
            taxable_vorab = max(0.0, vorabpauschale * (1.0 - teilfreistellung))
            tax_drag = taxable_vorab * 0.26375
            
            realized_return = blended_net_return - (tax_drag / start_val if start_val > 0 else 0.0)
            
            portfolio_val = (portfolio_val + annual_contribution * 0.5) * (1.0 + realized_return) + annual_contribution * 0.5
            portfolio_val = max(0.0, portfolio_val)
            trajectory.append(portfolio_val)
            
            if portfolio_val > peak_val:
                peak_val = portfolio_val
            elif peak_val > 0:
                dd = (peak_val - portfolio_val) / peak_val
                if dd > max_dd:
                    max_dd = dd
                    
        simulation_trajectories.append(trajectory)
        final_values.append(portfolio_val)
        real_final_values.append(portfolio_val / ((1.0 + inflation_rate) ** years))
        max_drawdowns.append(max_dd)
        
    final_values.sort()
    real_final_values.sort()
    max_drawdowns.sort()
    
    def percentile(arr: List[float], pct: float) -> float:
        idx = int(len(arr) * pct)
        return arr[min(idx, len(arr) - 1)]
        
    p05 = percentile(final_values, 0.05)
    p10 = percentile(final_values, 0.10)
    p25 = percentile(final_values, 0.25)
    p50 = percentile(final_values, 0.50)
    p75 = percentile(final_values, 0.75)
    p90 = percentile(final_values, 0.90)
    p95 = percentile(final_values, 0.95)
    
    real_p10 = percentile(real_final_values, 0.10)
    real_p50 = percentile(real_final_values, 0.50)
    real_p90 = percentile(real_final_values, 0.90)
    
    median_max_dd = percentile(max_drawdowns, 0.50) * 100.0
    
    # Yearly data array (length = years + 1: year 0 to year N)
    yearly_data = []
    for yr in range(years + 1):
        yr_vals = sorted([simulation_trajectories[s][yr] for s in range(num_simulations)])
        contrib = initial_amount + annual_contribution * yr
        yearly_data.append({
            "year": yr,
            "contributions": round(contrib, 2),
            "projected_p10": round(percentile(yr_vals, 0.10), 2),
            "projected_p50": round(percentile(yr_vals, 0.50), 2),
            "projected_p90": round(percentile(yr_vals, 0.90), 2),
        })
        
    # Fan chart series
    fan_chart_series = []
    step_yr = max(1, years // 10) if years > 10 else 1
    sample_years = list(range(0, years + 1, step_yr))
    if sample_years[-1] != years:
        sample_years.append(years)
        
    for yr in sample_years:
        yr_vals = sorted([simulation_trajectories[s][yr] for s in range(num_simulations)])
        contrib = initial_amount + annual_contribution * yr
        fan_chart_series.append({
            "year": f"Year {yr}",
            "year_num": yr,
            "contributions": round(contrib),
            "p10_bear": round(percentile(yr_vals, 0.10)),
            "p25": round(percentile(yr_vals, 0.25)),
            "p50_median": round(percentile(yr_vals, 0.50)),
            "p75": round(percentile(yr_vals, 0.75)),
            "p90_bull": round(percentile(yr_vals, 0.90)),
        })
        
    # Active Bank Fund vs Passive ETF Cost Drag Simulation
    active_rate = 0.075 - 0.0185
    passive_rate = 0.075 - 0.0018
    
    active_terminal = (initial_amount * 0.95) * math.pow(1 + active_rate, years) + \
                      (annual_contribution * 0.95) * ((math.pow(1 + active_rate, years) - 1) / active_rate)
    passive_terminal = initial_amount * math.pow(1 + passive_rate, years) + \
                       annual_contribution * ((math.pow(1 + passive_rate, years) - 1) / passive_rate)
    fee_drag_loss = max(0.0, passive_terminal - active_terminal)
    
    monthly_swr_4pct = (p50 * 0.04) / 12.0
    monthly_swr_3_5pct = (p50 * 0.035) / 12.0

    return {
        "portfolio_label": label,
        "risk_profile": risk_profile,
        "years": years,
        "initial_amount": round(initial_amount, 2),
        "monthly_contribution": round(monthly_contribution, 2),
        "total_contributions": round(total_contributions, 2),
        "projected_p05": round(p05, 2),
        "projected_p10": round(p10, 2),
        "projected_p25": round(p25, 2),
        "projected_p50": round(p50, 2),
        "projected_p75": round(p75, 2),
        "projected_p90": round(p90, 2),
        "projected_p95": round(p95, 2),
        "real_p10": round(real_p10, 2),
        "real_p50": round(real_p50, 2),
        "real_p90": round(real_p90, 2),
        "max_drawdown_pct": round(median_max_dd, 2),
        "allocation": allocation,
        "yearly_data": yearly_data,
        "fan_chart_series": fan_chart_series,
        "cost_drag_analysis": {
            "passive_etf_terminal": round(passive_terminal, 2),
            "active_fund_terminal": round(active_terminal, 2),
            "total_fee_wealth_lost": round(fee_drag_loss, 2),
            "fee_savings_pct": round((fee_drag_loss / passive_terminal) * 100.0, 1) if passive_terminal > 0 else 0
        },
        "safe_withdrawal": {
            "rule_4_percent_monthly": round(monthly_swr_4pct, 2),
            "rule_3_5_percent_monthly": round(monthly_swr_3_5pct, 2)
        }
    }


# Backwards-compatible alias
simulate_investment = simulate_investment_growth

