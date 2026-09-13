import typing
from fastapi import APIRouter
from tax_calculator import calculate_german_tax
from advanced_insurance_engine import build_insurance_lab
from schemas import ClientProfile, InsuranceLabResponse

router = APIRouter(prefix="/api", tags=["insurance"])


@router.post("/step/insurance")
def step_insurance(profile: ClientProfile) -> typing.Any:
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
    return build_insurance_lab(profile.model_dump(), tax_info)
