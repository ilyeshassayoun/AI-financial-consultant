import os
import sys
import pytest
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from database import Base
from config import settings


@pytest.fixture(scope="session")
async def setup_test_db():
    """Create test database schema before running tests."""
    database_url = settings.DATABASE_URL
    
    # Ensure we're using SQLite in tests
    if not database_url.startswith("sqlite://"):
        pytest.skip("Tests require SQLite database")
    
    engine_kwargs = {
        "echo": settings.DEBUG,
        "pool_pre_ping": True,
    }
    
    # SQLite doesn't need pool_size or max_overflow
    engine = create_async_engine(database_url, **engine_kwargs)
    
    async with engine.begin() as conn:
        from models import user as _u, profile_snapshot as _ps  # noqa: F401
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await engine.dispose()
