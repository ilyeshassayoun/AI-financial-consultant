import os
import sys
import pytest
from pathlib import Path
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from main import app
from database import Base, get_db
from models.user import User
from models.refresh_session import RefreshTokenSession
from core.security import hash_token


@pytest.fixture
def auth_client_and_db(tmp_path):
    db_file = tmp_path / "test_auth.db"
    db_url = f"sqlite+aiosqlite:///{db_file.as_posix()}"
    engine = create_async_engine(db_url, connect_args={"check_same_thread": False})
    session_factory = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)

    # Synchronously setup tables via a runner
    import asyncio
    async def init_tables():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    asyncio.run(init_tables())

    async def override_get_db():
        async with session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    app.dependency_overrides[get_db] = override_get_db

    client = TestClient(app)
    yield client, session_factory

    app.dependency_overrides.pop(get_db, None)
    asyncio.run(engine.dispose())


def test_session_lifecycle_and_rotation(auth_client_and_db):
    client, session_factory = auth_client_and_db
    import asyncio

    # 1. Register
    reg_resp = client.post(
        "/api/auth/register",
        json={"email": "advisory_user@example.com", "password": "SecurePassword2026!"},
    )
    assert reg_resp.status_code == 201
    assert "access_token" in reg_resp.cookies
    assert "refresh_token" in reg_resp.cookies
    token_1 = reg_resp.cookies["refresh_token"]

    async def check_initial_session():
        async with session_factory() as session:
            result = await session.execute(
                select(RefreshTokenSession).where(RefreshTokenSession.token_hash == hash_token(token_1))
            )
            s = result.scalar_one_or_none()
            assert s is not None
            assert not s.is_revoked
            return s.family_id

    family_id = asyncio.run(check_initial_session())
    assert family_id is not None

    # 2. Token Refresh (Rotation)
    refresh_resp = client.post("/api/auth/refresh", json={})
    assert refresh_resp.status_code == 200
    token_2 = refresh_resp.cookies["refresh_token"]
    assert token_2 != token_1

    async def check_rotated_session():
        async with session_factory() as session:
            # Token 1 should now be revoked
            res1 = await session.execute(
                select(RefreshTokenSession).where(RefreshTokenSession.token_hash == hash_token(token_1))
            )
            s1 = res1.scalar_one_or_none()
            assert s1 is not None
            assert s1.is_revoked is True
            assert s1.revoked_at is not None

            # Token 2 should be active in the same family
            res2 = await session.execute(
                select(RefreshTokenSession).where(RefreshTokenSession.token_hash == hash_token(token_2))
            )
            s2 = res2.scalar_one_or_none()
            assert s2 is not None
            assert s2.is_revoked is False
            assert s2.family_id == family_id

    asyncio.run(check_rotated_session())

    # 3. Reuse Detection (Attacker attempts to use revoked token_1)
    # Send token_1 in request body or cookie
    client.cookies.set("refresh_token", token_1)
    attack_resp = client.post("/api/auth/refresh", json={"refresh_token": token_1})
    assert attack_resp.status_code == 401
    assert "reuse detected" in attack_resp.json()["detail"].lower()

    # Verify that the ENTIRE token family (including token_2) is now revoked!
    async def check_family_revocation():
        async with session_factory() as session:
            res2 = await session.execute(
                select(RefreshTokenSession).where(RefreshTokenSession.token_hash == hash_token(token_2))
            )
            s2 = res2.scalar_one_or_none()
            assert s2 is not None
            assert s2.is_revoked is True

    asyncio.run(check_family_revocation())

    # 4. Legitimate user trying token_2 now fails because the family was compromised and revoked
    client.cookies.set("refresh_token", token_2)
    subsequent_resp = client.post("/api/auth/refresh", json={"refresh_token": token_2})
    assert subsequent_resp.status_code == 401


def test_logout_revokes_active_session(auth_client_and_db):
    client, session_factory = auth_client_and_db
    import asyncio

    # Login
    login_resp = client.post(
        "/api/auth/register",
        json={"email": "logout_test@example.com", "password": "SecurePassword2026!"},
    )
    assert login_resp.status_code == 201
    refresh_tok = login_resp.cookies["refresh_token"]

    # Logout
    logout_resp = client.post("/api/auth/logout")
    assert logout_resp.status_code == 204

    # Verify session is marked revoked in DB
    async def check_revoked():
        async with session_factory() as session:
            res = await session.execute(
                select(RefreshTokenSession).where(RefreshTokenSession.token_hash == hash_token(refresh_tok))
            )
            s = res.scalar_one_or_none()
            assert s is not None
            assert s.is_revoked is True

    asyncio.run(check_revoked())

    # Subsequent refresh with that token fails
    client.cookies.set("refresh_token", refresh_tok)
    fail_refresh = client.post("/api/auth/refresh", json={"refresh_token": refresh_tok})
    assert fail_refresh.status_code == 401