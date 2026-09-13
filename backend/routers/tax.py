import typing
from fastapi import APIRouter
from tax_calculator import calculate_german_tax
from advanced_tax_engine import build_tax_lab
from schemas import ClientProfile, TaxStepResponse

router = APIRouter(prefix="/api", tags=["tax"])


@router.post("/step/tax")
def step_tax(profile: ClientProfile) -> typing.Any:
    tax_info = calculate_german_tax(
        gross_income=profile.income,
        spouse_income=profile.spouse_income,
        tax_class=profile.tax_class,
        is_married=profile.is_married,
        church_tax=profile.church_tax,
        num_children=profile.num_children,
        additional_deductions=profile.additional_deductions,
        commute_km=profile.commute_km,
        commute_days=230,
        home_office_days=profile.home_office_days,
        riester_contribution=profile.riester_contribution,
        has_private_health=profile.has_private_health,
        private_health_cost=profile.private_health_cost,
        age=profile.age,
        children_under_25=profile.children_under_25 if profile.children_under_25 is not None else profile.num_children,
        is_saxony=profile.is_saxony,
        joint_assessment=profile.joint_assessment,
    )
    tax_result = {
        "gross_income": tax_info.get("gross_income", profile.income),
        "tax_amount": tax_info.get("tax_amount", 0),
        "net_income": tax_info.get("net_income", profile.income),
        "effective_tax_rate": tax_info.get("effective_tax_rate", 0),
        "marginal_tax_rate": tax_info.get("marginal_tax_rate", 0),
        "details": tax_info.get("details", tax_info),
        "calculation_basis": tax_info.get("calculation_basis", {}),
    }
    return {**tax_result, "lab": build_tax_lab(profile.model_dump(), tax_result)}
