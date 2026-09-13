"""Exercise the password backend used by fresh production installations."""

import os
import sys

import pytest
from pydantic import ValidationError

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from core.security import get_password_hash, verify_password
from routers.auth import LoginRequest, RegisterRequest


@pytest.mark.parametrize("password", ["deployment-test-password", "a" * 72, "é" * 36])
def test_bcrypt_hash_round_trip(password):
    password_hash = get_password_hash(password)
    assert password_hash.startswith("$2b$12$")
    assert verify_password(password, password_hash)
    assert not verify_password("incorrect-password", password_hash)


def test_existing_bcrypt_2a_hash_remains_verifiable():
    password_hash = get_password_hash("existing-password")
    assert verify_password("existing-password", "$2a$" + password_hash[4:])


def test_malformed_stored_hash_is_rejected():
    assert not verify_password("deployment-test-password", "invalid-hash")


@pytest.mark.parametrize("request_model", [LoginRequest, RegisterRequest])
def test_password_schema_rejects_utf8_over_bcrypt_limit(request_model):
    with pytest.raises(ValidationError, match="72 UTF-8 bytes"):
        request_model(email="test@example.com", password="é" * 37)
