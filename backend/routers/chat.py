import typing
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from analysis import run_full_analysis as _run_full_analysis
from llm_service import generate_financial_advice, generate_step_ai_consultation, stream_financial_advice
from schemas import ClientProfile, ChatRequest, ConsultantInsightRequest, ConsultantInsightResponse, ChatResponse
from dependencies import require_llm_access

router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/consultant/insight", dependencies=[Depends(require_llm_access)])
async def consultant_insight(request: ConsultantInsightRequest) -> typing.Any:
    analysis = _run_full_analysis(request.profile)
    profile_dict = request.profile.model_dump()
    insight = generate_step_ai_consultation(request.step, profile_dict, analysis)
    return {"insight": insight, "analysis": analysis}


@router.post("/chat/stream", dependencies=[Depends(require_llm_access)])
async def chat_stream_endpoint(chat_request: ChatRequest) -> typing.Any:
    analysis = _run_full_analysis(chat_request.profile)
    inv = analysis["investment"]
    ret = analysis["retirement"]
    opt = analysis["optimization"]
    tax = analysis["tax"]

    context_parts = [
        f"Client: Age {chat_request.profile.age}, Income €{chat_request.profile.income:,}, "
        f"Tax Class {chat_request.profile.tax_class}, Married: {chat_request.profile.is_married}, "
        f"Children: {chat_request.profile.num_children}.",
        f"Tax: Gross €{tax['gross_income']:,}, Net €{tax['net_income']:,.2f}, Effective Rate: {tax['effective_tax_rate']*100:.1f}%.",
        f"Investments: Portfolio {inv['portfolio_label']} (Nominal P50=€{inv['projected_p50']:,.0f}, Real P50=€{inv['real_p50']:,.0f}).",
        f"Retirement: State €{ret.get('state_pension_monthly', 0):,.0f}/mo, Pension Gap €{ret.get('pension_gap_monthly', 0):,.0f}/mo.",
        f"Health Score: {opt['summary']['financial_health_score']}/100."
    ]
    context = "\n".join(context_parts)

    return StreamingResponse(
        stream_financial_advice(chat_request.messages, context),
        media_type="text/event-stream"
    )