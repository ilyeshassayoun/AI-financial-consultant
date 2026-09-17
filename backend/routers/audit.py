"""Calculation snapshot and tamper-evident integrity fingerprint router."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, Query, Response
from pydantic import BaseModel
from schemas import ClientProfile
from analysis import run_full_analysis
from canonical_hasher import canonical_sha256

router = APIRouter(prefix="/api/audit", tags=["audit"])

STATUTORY_CITATIONS = [
    {"statute": "§ 32a EStG", "title": "Einkommensteuertarif", "url": "https://www.gesetze-im-internet.de/estg/__32a.html"},
    {"statute": "SGB VI", "title": "Gesetzliche Rentenversicherung", "url": "https://www.gesetze-im-internet.de/sgb_6/"},
    {"statute": "DIN 77230", "title": "Basis-Finanzanalyse für Privathaushalte", "url": "https://www.din.de/de/mitwirken/normenausschuesse/nadg/normen/cdc-1:din-spec:301389813"},
    {"statute": "§ 20 InvStG", "title": "Investmentsteuergesetz Teilfreistellung", "url": "https://www.gesetze-im-internet.de/invstg_2018/__20.html"},
]


def _build_dossier(
    profile: ClientProfile,
    analysis_override: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Build a checksum-protected summary from the canonical analysis result.

    ``analysis_override`` supports consistency tests without executing the
    relatively expensive simulation pipeline twice.
    """
    analysis = analysis_override if analysis_override is not None else run_full_analysis(profile)
    investment_metadata = analysis["investment"].get("model_metadata", {})
    tax_details = analysis["tax"].get("details", {})

    inv_summary = {
        "portfolio_label": analysis["investment"].get("portfolio_label"),
        "expected_return": analysis["investment"].get("expected_return"),
        "projected_p50": round(float(analysis["investment"].get("projected_p50", 0)), 2),
        "real_p50": round(float(analysis["investment"].get("real_p50", 0)), 2),
        "model_id": investment_metadata.get("model_id"),
        "assumption_version": investment_metadata.get("assumption_version"),
        "value_basis": investment_metadata.get("value_basis"),
    }

    tax_summary = {
        "gross_income": round(float(analysis["tax"].get("gross_income", 0)), 2),
        "net_income": round(float(analysis["tax"].get("net_income", 0)), 2),
        "income_tax": round(float(tax_details.get("income_tax", 0)), 2),
        "solidarity_surcharge": round(float(tax_details.get("solidarity_surcharge", 0)), 2),
        "effective_tax_rate": round(float(analysis["tax"].get("effective_tax_rate", 0)), 4),
        "parameter_version": analysis["tax"].get("calculation_basis", {}).get("parameter_version"),
    }

    ret_summary = {
        "state_pension_monthly": round(float(analysis["retirement"].get("state_pension_monthly", 0)), 2),
        "pension_gap_monthly": round(float(analysis["retirement"].get("pension_gap_monthly", 0)), 2),
        "replacement_ratio": round(float(analysis["retirement"].get("replacement_ratio", 0)), 4),
    }

    plan_summary = {
        "financial_resilience_score": analysis["advisory_plan"].get("financial_resilience_score"),
        "emergency_fund_target": round(float(analysis["advisory_plan"].get("household_kpis", {}).get("emergency_fund_target", 0)), 2),
    }

    dossier_body = {
        "specification_version": "2026.2",
        "inputs": profile.model_dump(),
        "statutory_outputs": {
            "tax": tax_summary,
            "retirement": ret_summary,
            "investment": inv_summary,
            "advisory_plan": plan_summary,
        },
        "statutory_citations": STATUTORY_CITATIONS,
    }

    checksum, _ = canonical_sha256(dossier_body)

    return {
        "checksum": checksum,
        "algorithm": "SHA-256 (RFC 8785)",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "integrity_fingerprint": f"SHA256-{checksum[:16].upper()}",
        "assurance": "Integrity check only; not an independent audit, certification, or regulated recommendation.",
        "review_status": {
            "profile_inputs": "self-reported",
            "calculation_outputs": "model-generated",
            "independently_reviewed": False,
        },
        "statutory_citations": STATUTORY_CITATIONS,
        "dossier": dossier_body,
    }


@router.post("/dossier")
def generate_audit_dossier_post(profile: ClientProfile, response: Response) -> Dict[str, Any]:
    """Generate a calculation snapshot stamped with an RFC 8785 SHA-256 fingerprint."""
    dossier = _build_dossier(profile)
    short_hash = dossier["checksum"][:8]
    response.headers["Content-Disposition"] = f'attachment; filename="calculation_snapshot_{short_hash}.json"'
    return dossier


@router.get("/dossier")
def generate_audit_dossier_get(
    response: Response,
    income: float = Query(default=60000.0, ge=0),
    age: int = Query(default=35, ge=18, le=90),
    current_savings: float = Query(default=20000.0, ge=0),
    monthly_investment: float = Query(default=500.0, ge=0),
) -> Dict[str, Any]:
    """GET endpoint generating a calculation snapshot and integrity fingerprint."""
    profile = ClientProfile(
        income=income,
        age=age,
        current_savings=current_savings,
        monthly_investment=monthly_investment,
    )
    dossier = _build_dossier(profile)
    short_hash = dossier["checksum"][:8]
    response.headers["Content-Disposition"] = f'attachment; filename="calculation_snapshot_{short_hash}.json"'
    return dossier
