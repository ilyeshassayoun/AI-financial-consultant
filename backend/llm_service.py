import os
import logging
import httpx
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Literal, AsyncGenerator

logger = logging.getLogger(__name__)

class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=8_000)

def generate_step_ai_consultation(step: str, profile: dict, analysis: dict) -> dict:
    """
    Generates rich, structured actuarial AI consulting insights for each specific step
    based on the German statutory calculation results.
    """
    tax = analysis.get("tax", {})
    tax_details = tax.get("details", {})
    inv = analysis.get("investment", {})
    investment_lab = analysis.get("investment_lab", {})
    ret = analysis.get("retirement", {})
    opt = analysis.get("optimization", {})
    summary = opt.get("summary", {})
    
    age = profile.get("age", 30)
    income = profile.get("income", 60000)
    tax_class = profile.get("tax_class", 1)
    monthly_inv = profile.get("monthly_investment", 500)
    ret_age = profile.get("retirement_age", 67)
    commute_km = profile.get("commute_km", 0)
    ho_days = profile.get("home_office_days", 0)
    
    if step == "profile":
        net_monthly = tax.get("net_income", income * 0.6) / 12.0
        tax_rate_pct = tax.get("effective_tax_rate", 0.3) * 100
        savings_ratio = (monthly_inv / net_monthly * 100) if net_monthly > 0 else 0
        human_capital = income * max(1, ret_age - age)
        
        diagnoses = [
            f"Financial planning diagnostic: Your current income profile generates €{round(net_monthly):,}/month in modeled net liquidity with an effective tax drag of {tax_rate_pct:.1f}%.",
            f"Your capitalized lifetime human capital is €{round(human_capital):,} over the next {ret_age - age} earning years.",
        ]
        if savings_ratio < 15:
            diagnoses.append(f"Your savings rate (€{monthly_inv}/mo = {savings_ratio:.1f}%) is below the 15-20% institutional benchmark required for early financial independence.")
        else:
            diagnoses.append(f"Excellent wealth accumulation rate of {savings_ratio:.1f}% of net take-home salary.")
            
        return {
            "title": "Ilyes AI Demographic & Cash Flow Masterplan",
            "verdict": " ".join(diagnoses),
            "urgency": "HIGH" if savings_ratio < 10 else "MEDIUM",
            "health_impact": f"+15 Pts Achievable",
            "key_metrics": [
                {"label": "Net Monthly Cash Flow", "value": f"€{round(net_monthly):,}"},
                {"label": "Effective Tax Drag", "value": f"{tax_rate_pct:.1f}%"},
                {"label": "Capitalized Human Asset", "value": f"€{round(human_capital):,}"}
            ],
            "recommended_actions": [
                {"id": "boost_savings", "label": f"Model 20% savings (€{round(net_monthly*0.20)}/mo)", "patch": {"monthly_investment": round(net_monthly*0.20)}}
            ]
        }
        
    elif step == "insurance":
        missing_mandatory = []
        covered_ids = [ins.lower() for ins in profile.get("existing_insurances", [])]
        if "privathaftpflicht" not in covered_ids and "liability" not in covered_ids:
            missing_mandatory.append("Privathaftpflicht (§ 823 BGB unlimited personal liability)")
        if "bu" not in covered_ids and "berufsunfaehigkeit" not in covered_ids:
            missing_mandatory.append(f"Occupational Disability BU (€{round((income * 0.6 / 12) * 0.8):,}/mo income protection)")
            
        pkv_eligible = income > 77400
        human_capital = income * max(1, ret_age - age)
        
        verdict = ""
        if missing_mandatory:
            verdict = f"Critical Risk Exposure Detected: You are currently missing {', '.join(missing_mandatory)}. An illness or accident could wipe out your entire €{round(human_capital):,} lifetime earning potential."
        else:
            verdict = f"Existential Risk Shield Verified: Core liability and disability shields are active, securing your €{round(human_capital):,} human capital asset."
            
        if pkv_eligible:
            verdict += f" Salary (€{income:,}) exceeds the 2026 general JAEG of €77,400. This permits a GKV/PKV suitability comparison; it does not establish that PKV is cheaper or more suitable."
            
        return {
            "title": "Ilyes AI Risk & Actuarial Protection Audit",
            "verdict": verdict,
            "urgency": "HIGH" if missing_mandatory else "OPTIMAL",
            "health_impact": f"{summary.get('financial_health_score', 75)}/100 Health Score",
            "key_metrics": [
                {"label": "Human Capital at Risk", "value": f"€{round(human_capital):,}"},
                {"label": "State Safety Net", "value": "Requires DRV record"},
                {"label": "JAEG Status", "value": "PKV Eligible" if pkv_eligible else "GKV Compulsory"}
            ],
            # Coverage may only be recorded from a policy document or explicit user
            # input. A model recommendation must never mark insurance as verified.
            "recommended_actions": []
        }
        
    elif step == "tax":
        eff_tax = tax.get("effective_tax_rate", 0.3) * 100
        gross_tax = tax.get("tax_amount", 0)
        soli = tax_details.get("solidarity_surcharge", 0)
        total_werbungskosten = tax_details.get("werbungskosten", 1230)
        est_savings = summary.get("total_potential_tax_savings", 850)
        
        verdict = f"EStG Progressive Analysis (§ 32a): On €{income:,} gross salary, your statutory tax drag is €{round(gross_tax):,} ({eff_tax:.1f}% effective). "
        if commute_km == 0 and ho_days == 0:
            verdict += "You have not logged commute distance or home office days; you are defaulting to the €1,230 Pauschbetrag and leaving significant refunds unclaimed."
        else:
            verdict += f"Your itemized deductions (€{round(total_werbungskosten):,}) exceed the statutory lump sum, generating an estimated €{round(est_savings):,} annual refund."
            
        tax_actions = []
        if profile.get("is_married") and tax_class != 3:
            tax_actions.append({
                "id": "compare_tax_class_3",
                "label": "Compare tax class 3 scenario",
                "patch": {"tax_class": 3},
            })

        return {
            "title": "Ilyes AI Fiscal Strategy & EStG Optimization",
            "verdict": verdict,
            "urgency": "HIGH" if (commute_km == 0 and ho_days == 0) else "OPTIMAL",
            "health_impact": f"€{round(est_savings):,}/yr Tax Refund Target",
            "key_metrics": [
                {"label": "Total Annual Tax Burden", "value": f"€{round(gross_tax):,}"},
                {"label": "Itemized Werbungskosten", "value": f"€{round(total_werbungskosten):,}"},
                {"label": "Potential Tax Refund", "value": f"€{round(est_savings):,}"}
            ],
            # Commute, home-office and marital status are facts, not optimizer
            # variables. Only offer a tax-class comparison when marriage is known.
            "recommended_actions": tax_actions
        }
        
    elif step == "invest":
        selected = investment_lab.get("selected", {})
        p50 = selected.get("p50", inv.get("projected_p50", 0))
        p10 = selected.get("p10", inv.get("projected_p10", 0))
        p90 = selected.get("p90", inv.get("projected_p90", 0))
        real_p50 = selected.get("real_p50", inv.get("real_p50", 0))
        simulations = investment_lab.get("methodology", {}).get("simulations_per_strategy", 250)
        cost_drag = inv.get("cost_drag_analysis", {})
        fee_saved = cost_drag.get("total_fee_wealth_lost", 65000)
        
        verdict = f"Monte Carlo analysis ({simulations} paths per strategy): Contributing €{monthly_inv}/mo yields a median nominal nest egg of €{round(p50):,} (real purchasing power: €{round(real_p50):,}). "
        verdict += f"The central 80% simulated range spans €{round(p10):,} (P10) to €{round(p90):,} (P90). The modelled fee comparison is a scenario, not a guaranteed saving; its assumptions are shown in the investment lab."
        
        return {
            "title": "Ilyes AI Asset Allocation Model",
            "verdict": verdict,
            "urgency": "MEDIUM",
            "health_impact": f"€{round(p50):,} Median Wealth Target",
            "key_metrics": [
                {"label": "P50 Median Projection", "value": f"€{round(p50):,}"},
                {"label": "P10 Bear Safety Floor", "value": f"€{round(p10):,}"},
                {"label": "Fee Drag Eliminated", "value": f"€{round(fee_saved):,}"}
            ],
            "recommended_actions": [
                {"id": "switch_growth", "label": "Compare a higher-risk allocation", "patch": {"risk_profile": "high"}},
                {"id": "boost_investment", "label": "Model €800 monthly funding", "patch": {"monthly_investment": 800}}
            ]
        }
        
    elif step == "pension":
        state_pen = ret.get("state_pension_monthly", 0)
        pen_gap = ret.get("pension_gap_monthly", 0)
        rep_ratio = ret.get("replacement_ratio", 0.6) * 100
        ep_total = ret.get("entgeltpunkte_total", 45.0)
        req_savings = ret.get("required_monthly_savings_to_close_gap", 200)
        
        verdict = f"Actuarial DRV Solvency Audit: At planned retirement age {ret_age}, statutory state pension (GRV) covers €{round(state_pen):,}/mo ({ep_total:.1f} Entgeltpunkte accumulated). "
        if pen_gap > 0:
            verdict += f"Your inflation-adjusted Rentenlücke is €{round(pen_gap):,}/mo (Replacement ratio: {rep_ratio:.0f}% vs 80% target). Adding €{round(req_savings):,}/mo into your private ETF portfolio bridges 100% of this deficit."
        else:
            verdict += f"Your private ETF and 3-pillar retirement streams fully close the Rentenlücke gap (Replacement ratio: {rep_ratio:.0f}%)."
            
        return {
            "title": "Ilyes AI DRV Rentenlücke & 3-Pillar Solvency Audit",
            "verdict": verdict,
            "urgency": "HIGH" if pen_gap > 500 else "OPTIMAL",
            "health_impact": f"{round(rep_ratio)}% Income Replaced",
            "key_metrics": [
                {"label": "DRV Statutory Monthly Pension", "value": f"€{round(state_pen):,}/mo"},
                {"label": "Net Rentenlücke Gap", "value": f"€{round(pen_gap):,}/mo" if pen_gap > 0 else "Fully Covered"},
                {"label": "Required Extra Savings", "value": f"+€{round(req_savings):,}/mo" if req_savings > 0 else "None"}
            ],
            "recommended_actions": [
                {"id": "increase_savings_gap", "label": f"Bridge 100% Gap (+€{round(req_savings)}/mo ETF)", "patch": {"monthly_investment": round(monthly_inv + req_savings)}},
                {"id": "delay_retirement", "label": "Simulate Retirement at Age 67", "patch": {"retirement_age": 67}}
            ]
        }
        
    return {
        "title": "Ilyes AI Financial Strategy Engine",
        "verdict": "Real-time actuarial analysis running under German statutory frameworks (§ 32a EStG, SGB VI, and § 20 InvStG).",
        "urgency": "OPTIMAL",
        "health_impact": f"{summary.get('financial_health_score', 80)}/100 Health Score",
        "key_metrics": [],
        "recommended_actions": []
    }

from knowledge_base import retrieve_statutory_context


_OFFICIAL_STATUTE_URLS = {
    "estg_32a": "https://www.gesetze-im-internet.de/estg/__32a.html",
    "estg_9": "https://www.gesetze-im-internet.de/estg/__9.html",
    "estg_10": "https://www.gesetze-im-internet.de/estg/__10.html",
    "invstg_20": "https://www.gesetze-im-internet.de/invstg_2018/__20.html",
    "invstg_18": "https://www.gesetze-im-internet.de/invstg_2018/__18.html",
    "sgb_vi": "https://www.gesetze-im-internet.de/sgb_6/",
    "bgb_823": "https://www.gesetze-im-internet.de/bgb/__823.html",
    "betravg_1a": "https://www.gesetze-im-internet.de/betravg/__1a.html",
    "sgb_v_jaeg": "https://www.gesetze-im-internet.de/sgb_5/__6.html",
}


def _official_statute_url(provision: dict[str, Any]) -> str:
    return _OFFICIAL_STATUTE_URLS.get(
        str(provision.get("id", "")),
        "https://www.gesetze-im-internet.de/",
    )


def _deterministic_advisory_reply(question: str, context: str, statutory_notes: str) -> str:
    """Build a grounded explanation without inventing figures or recommendations."""
    topic = question.casefold()
    context_lines = [line.strip() for line in context.splitlines() if line.strip()]
    topic_prefixes: list[str] = []

    if any(term in topic for term in ("tax", "estg", "deduct", "commute", "home office")):
        topic_prefixes.append("Tax:")
    if any(term in topic for term in ("invest", "etf", "portfolio", "return", "fee", "wealth")):
        topic_prefixes.append("Investments:")
    if any(term in topic for term in ("pension", "retire", "renten", "drv", "withdraw")):
        topic_prefixes.append("Retirement:")
    if any(term in topic for term in ("income", "salary", "family", "profile")):
        topic_prefixes.append("Client:")

    selected_lines = [
        line for line in context_lines
        if any(line.startswith(prefix) for prefix in topic_prefixes)
    ]
    if not selected_lines:
        selected_lines = context_lines[1:5] or context_lines

    modeled_facts = "\n".join(f"- {line}" for line in selected_lines)
    return (
        "### Model-grounded explanation\n\n"
        f"You asked: *\"{question}\"*\n\n"
        "The current plan contains these relevant modeled results:\n"
        f"{modeled_facts}\n\n"
        "These are planning estimates based on the profile inputs, not guaranteed outcomes. "
        "Use the relevant specialist page to compare assumptions before changing the plan.\n\n"
        f"**Relevant statutory context**\n{statutory_notes}\n\n"
        "For an individual tax, insurance, or investment recommendation, verify the inputs "
        "with an appropriately regulated professional."
    )


async def generate_financial_advice(
    messages: List[ChatMessage],
    context: str,
    allow_external_llm: bool = True,
) -> str:
    """
    Generates intelligent financial advice using an LLM if API key is provided,
    augmented with statutory German legal knowledge (RAG),
    or falls back to an expert, multi-paragraph actuarial consulting synthesis.
    Uses async httpx to avoid blocking the FastAPI event loop.
    """
    api_key = os.environ.get("GROQ_API_KEY", "") if allow_external_llm else ""
    last_user_msg = messages[-1].content if messages else "Overall financial strategy"
    
    # RAG: Retrieve matching statutory provisions
    statutory_provisions = retrieve_statutory_context(last_user_msg, top_k=2)
    statutory_notes = "\n".join([f"• [{item['statute']} - {item['title']}]: {item['content']}" for item in statutory_provisions]) if statutory_provisions else "Standard German statutory framework applies."
    
    if not api_key:
        return _deterministic_advisory_reply(last_user_msg, context, statutory_notes)
        
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    system_message = {
        "role": "system",
        "content": (
            "You explain an educational German household-finance model with statutory legal accuracy. "
            "The deterministic context is authoritative; you must not recalculate statutory results, invent numbers, imply certification, or promise outcomes. "
            "Use only figures and source links present in the context. Clearly distinguish estimates from verified facts, cite relevant statutory provisions (§ 32a EStG, SGB VI, § 20 InvStG, § 823 BGB), "
            "and recommend a qualified tax adviser (Steuerberater) or regulated financial adviser when individual advice is required.\n\n"
            f"Financial Audit Context:\n{context}\n\n"
            f"Statutory German Legal Corpus (RAG Grounding):\n{statutory_notes}"
        )
    }
    
    formatted_messages = [system_message] + [{"role": m.role, "content": m.content} for m in messages]
    
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": formatted_messages,
        "temperature": 0.4
    }
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
        data = response.json()
        return str(data["choices"][0]["message"]["content"])
    except Exception as exc:
        logger.warning("LLM provider unavailable (%s)", type(exc).__name__)
        return _deterministic_advisory_reply(last_user_msg, context, statutory_notes)


async def stream_financial_advice(
    messages: List[ChatMessage],
    context: str,
    profile: Optional[Any] = None,
    allow_external_llm: bool = True,
) -> AsyncGenerator[str, None]:
    """
    Server-Sent Events (SSE) streaming generator for real-time typewriter LLM delivery
    interleaved with structured UI function events (highlight_metric, delta_badge, patch_proposal).
    """
    import json
    import time
    start_time = time.monotonic()
    api_key = os.environ.get("GROQ_API_KEY", "") if allow_external_llm else ""
    last_user_msg = messages[-1].content if messages else "Overall financial strategy"
    statutory_provisions = retrieve_statutory_context(last_user_msg, top_k=2)
    statutory_notes = "\n".join([f"• [{item['statute']} - {item['title']}]: {item['content']}" for item in statutory_provisions]) if statutory_provisions else "Standard German statutory framework applies."

    def _format_event(event_name: str, payload: dict) -> str:
        # Dual-compliant SSE format: works with standard event listeners and raw data JSON parsers
        data_body = {"event": event_name, "data": payload, **payload}
        return f"event: {event_name}\ndata: {json.dumps(data_body)}\n\n"

    # Pre-emit the source relevant to the user's question.
    if statutory_provisions:
        first_statute = statutory_provisions[0]
        yield _format_event("statutory_citation", {
            "statute": first_statute.get("statute", "§ 32a EStG"),
            "clause": "Abs. 1",
            "title": first_statute.get("title", "Einkommensteuertarif"),
            "official_url": _official_statute_url(first_statute),
        })
    else:
        yield _format_event("statutory_citation", {
            "statute": "§ 32a EStG",
            "clause": "Abs. 1",
            "title": "Einkommensteuertarif",
            "official_url": "https://www.gesetze-im-internet.de/estg/__32a.html",
        })

    token_count = 0

    if not api_key:
        fallback_text = _deterministic_advisory_reply(last_user_msg, context, statutory_notes)
        words = fallback_text.split(" ")
        for word in words:
            token_count += 1
            yield f"event: token\ndata: {json.dumps({'token': word + ' '})}\n\n"

        elapsed_ms = int((time.monotonic() - start_time) * 1000)
        yield _format_event("done", {
            "tokens": token_count,
            "citations_count": 1,
            "patches_proposed": 0,
            "execution_time_ms": elapsed_ms,
        })
        yield "data: [DONE]\n\n"
        return

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    system_message = {
        "role": "system",
        "content": (
            "You explain an educational German household-finance model. The deterministic context is authoritative: "
            "do not recalculate its figures, invent numbers, imply certification, or promise outcomes. Distinguish "
            "estimates from verified facts and recommend a qualified professional for individual advice.\n\n"
            f"Context:\n{context}\n\nStatutory Law References:\n{statutory_notes}"
        ),
    }
    formatted_messages = [system_message] + [{"role": m.role, "content": m.content} for m in messages]
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": formatted_messages,
        "temperature": 0.4,
        "stream": True,
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            async with client.stream("POST", url, headers=headers, json=payload) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:].strip()
                        if data_str == "[DONE]":
                            break
                        try:
                            parsed = json.loads(data_str)
                            delta = parsed.get("choices", [{}])[0].get("delta", {}).get("content", "")
                            if delta:
                                token_count += 1
                                yield f"event: token\ndata: {json.dumps({'token': delta})}\n\n"
                        except Exception:
                            continue

        elapsed_ms = int((time.monotonic() - start_time) * 1000)
        yield _format_event("done", {
            "tokens": token_count,
            "citations_count": 1,
            "patches_proposed": 0,
            "execution_time_ms": elapsed_ms,
        })
        yield "data: [DONE]\n\n"
    except Exception as exc:
        logger.warning("Stream error: %s", exc)
        yield f"event: token\ndata: {json.dumps({'token': 'Advisory service temporarily unavailable. Please retry.'})}\n\n"
        yield "data: [DONE]\n\n"
