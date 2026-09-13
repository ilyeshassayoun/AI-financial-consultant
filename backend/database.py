from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from config import settings


class Base(DeclarativeBase):
    pass


_engine = None
_session_factory = None


def get_engine():
    global _engine
    if _engine is None:
        database_url = settings.DATABASE_URL
        if database_url.startswith("postgresql://"):
            database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
        
        # max_overflow is only supported by QueuePool (PostgreSQL, MySQL, etc.)
        # SQLite uses NullPool and doesn't support this parameter
        is_sqlite = "sqlite" in database_url.lower()
        
        engine_kwargs = {
            "echo": settings.DEBUG,
            "pool_pre_ping": True,
        }
        
        if not is_sqlite:
            engine_kwargs["pool_size"] = 5
            engine_kwargs["max_overflow"] = 10
        
        _engine = create_async_engine(database_url, **engine_kwargs)
    return _engine


def get_session_factory():
    global _session_factory
    if _session_factory is None:
        _session_factory = async_sessionmaker(
            bind=get_engine(),
            expire_on_commit=False,
            class_=AsyncSession,
        )
    return _session_factory


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with get_session_factory()() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def init_db() -> None:
    engine = get_engine()
    async with engine.begin() as conn:
        from models import user as _u, profile_snapshot as _ps  # noqa: F401
        await conn.run_sync(Base.metadata.create_all)
