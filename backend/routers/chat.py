import typing
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from starlette.concurrency import run_in_threadpool
from analysis import run_full_analysis as _run_full_analysis
from llm_service import generate_financial_advice, generate_step_ai_consultation, stream_financial_advice
from schemas import ClientProfile, ChatRequest, ConsultantInsightRequest, ChatResponse
from core.security import verify_token
from config import settings
from rate_limit import limiter

router = APIRouter(prefix="/api", tags=["chat"])


def _has_valid_client_session(request: Request) -> bool:
    """Allow paid external-model access only for a valid signed-in session.

    The deterministic advisor remains available to guests.  This check deliberately
    avoids a database lookup: it only decides which response engine may be used and
    never grants access to stored client data.
    """
    authorization = request.headers.get("authorization", "")
    token = authorization[7:].strip() if authorization.lower().startswith("bearer ") else None
    token = token or request.cookies.get("access_token")
    payload = verify_token(token or "", expected_type="access")
    return bool(payload and payload.get("sub"))


def _chat_context(profile: ClientProfile, analysis: dict) -> str:
    inv = analysis["investment"]
    ret = analysis["retirement"]
    plan = analysis["advisory_plan"]
    tax = analysis["tax"]
    return "\n".join([
        f"Client: Age {profile.age}, Income €{profile.income:,}, Tax Class {profile.tax_class}, Married: {profile.is_married}, Children: {profile.num_children}.",
        f"Tax: Gross €{tax['gross_income']:,}, Net €{tax['net_income']:,.2f}, Effective Rate: {tax['effective_tax_rate']*100:.1f}%.",
        f"Investments: Portfolio {inv['portfolio_label']} (Nominal P50=€{inv['projected_p50']:,.0f}, Real P50=€{inv['real_p50']:,.0f}).",
        f"Retirement: State €{ret.get('state_pension_monthly', 0):,.0f}/mo, Pension Gap €{ret.get('pension_gap_monthly', 0):,.0f}/mo.",
        f"Financial resilience score: {plan['financial_resilience_score']}/100.",
    ])


@router.post("/consultant/insight")
@limiter.limit(settings.RATE_LIMIT_CHAT)
async def consultant_insight(request: Request, payload: ConsultantInsightRequest) -> typing.Any:
    analysis = await run_in_threadpool(_run_full_analysis, payload.profile)
    profile_dict = payload.profile.model_dump()
    insight = generate_step_ai_consultation(payload.step, profile_dict, analysis)
    return {"insight": insight, "analysis": analysis}


@router.post("/chat/stream")
@limiter.limit(settings.RATE_LIMIT_CHAT)
async def chat_stream_endpoint(request: Request, chat_request: ChatRequest) -> typing.Any:
    analysis = await run_in_threadpool(_run_full_analysis, chat_request.profile)
    context = _chat_context(chat_request.profile, analysis)

    return StreamingResponse(
        stream_financial_advice(
            chat_request.messages,
            context,
            profile=chat_request.profile,
            allow_external_llm=_has_valid_client_session(request),
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


@router.post("/chat", response_model=ChatResponse)
@limiter.limit(settings.RATE_LIMIT_CHAT)
async def chat_endpoint(request: Request, chat_request: ChatRequest) -> ChatResponse:
    analysis = await run_in_threadpool(_run_full_analysis, chat_request.profile)
    context = _chat_context(chat_request.profile, analysis)
    return ChatResponse(
        reply=await generate_financial_advice(
            chat_request.messages,
            context,
            allow_external_llm=_has_valid_client_session(request),
        )
    )
