import os
import sys

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from config import Settings
from main import app
from tax_calculator import calculate_german_tax


def test_production_rejects_default_jwt_secret():
    settings = Settings(
        APP_ENV="production",
        JWT_SECRET_KEY="change-me-in-production-use-a-long-random-string",
        COOKIE_SECURE=True,
    )
    with pytest.raises(RuntimeError, match="JWT_SECRET_KEY"):
        settings.validate_deployment()


def test_production_requires_secure_session_cookies():
    settings = Settings(
        APP_ENV="production",
        JWT_SECRET_KEY="a" * 32,
        COOKIE_SECURE=False,
    )
    with pytest.raises(RuntimeError, match="COOKIE_SECURE"):
        settings.validate_deployment()


def test_production_rejects_wildcard_cors():
    settings = Settings(
        APP_ENV="production",
        JWT_SECRET_KEY="a" * 32,
        COOKIE_SECURE=True,
        CORS_ORIGINS="*",
    )
    with pytest.raises(RuntimeError, match="CORS_ORIGINS"):
        settings.validate_deployment()


def test_production_accepts_explicit_https_origin():
    settings = Settings(
        APP_ENV="production",
        JWT_SECRET_KEY="a" * 32,
        COOKIE_SECURE=True,
        CORS_ORIGINS="https://finance.example",
    )
    settings.validate_deployment()


def test_joint_tax_includes_spouse_income_and_separate_contribution_ceilings():
    sole_earner = calculate_german_tax(
        gross_income=60_000,
        is_married=True,
        joint_assessment=True,
    )
    dual_earner = calculate_german_tax(
        gross_income=60_000,
        spouse_income=40_000,
        is_married=True,
        joint_assessment=True,
    )

    assert dual_earner["gross_income"] == 100_000
    assert dual_earner["details"]["assessment_basis"]["spouse_income_included"] == 40_000
    assert dual_earner["details"]["social_security"]["household_estimate"] is True
    assert dual_earner["tax_amount"] > sole_earner["tax_amount"]
    assert dual_earner["details"]["social_security"]["total"] > sole_earner["details"]["social_security"]["total"]


def test_chat_routes_require_an_authenticated_session():
    client = TestClient(app)
    response = client.post("/api/chat", json={"profile": {}, "messages": []})
    assert response.status_code == 401
