#!/bin/sh
set -e

# Generate ephemeral JWT_SECRET_KEY if not provided or set to default insecure value
if [ -z "$JWT_SECRET_KEY" ] || [ "$JWT_SECRET_KEY" = "change-me-in-production-use-a-long-random-string" ] || [ "$JWT_SECRET_KEY" = "change-me-in-production" ]; then
    export JWT_SECRET_KEY=$(python -c "import secrets; print(secrets.token_urlsafe(48))")
    echo "Notice: Ephemeral JWT_SECRET_KEY generated for container instance."
fi

# Run database migrations if DATABASE_URL is configured and not default local
if [ -n "$DATABASE_URL" ] && [ "$DATABASE_URL" != "postgresql+asyncpg://postgres:postgres@localhost:5432/financial_consultant" ]; then
    echo "Attempting database migrations..."
    alembic -c alembic.ini upgrade head || echo "Database migration failed or skipped; continuing startup..."
else
    echo "DATABASE_URL not configured for remote database; skipping startup migrations."
fi

# Dynamic PORT provided by Railway / cloud container environment
PORT="${PORT:-8000}"
echo "Starting Uvicorn web server on port $PORT..."
exec uvicorn main:app --host 0.0.0.0 --port "$PORT" --workers 2 --log-level info