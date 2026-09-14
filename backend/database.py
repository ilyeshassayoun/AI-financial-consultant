from typing import AsyncGenerator
from sqlalchemy import text
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
        if not database_url:
            raise RuntimeError("DATABASE_URL is not configured")
        if database_url.startswith("postgresql://"):
            database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
        elif database_url.startswith("sqlite://") and not database_url.startswith("sqlite+"):
            database_url = database_url.replace("sqlite://", "sqlite+aiosqlite://", 1)
        
        is_sqlite = "sqlite" in database_url.lower()
        
        engine_kwargs = {
            "echo": settings.DEBUG,
            "pool_pre_ping": True,
        }
        
        if not is_sqlite:
            engine_kwargs["pool_size"] = 5
            engine_kwargs["max_overflow"] = 10
        else:
            if ":memory:" in database_url:
                from sqlalchemy.pool import StaticPool
                engine_kwargs["poolclass"] = StaticPool
            engine_kwargs["connect_args"] = {"check_same_thread": False}
        
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
    if not settings.DATABASE_URL:
        from fastapi import HTTPException
        raise HTTPException(status_code=503, detail="Database service is not configured")
    async with get_session_factory()() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def init_db() -> None:
    engine = get_engine()
    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))
