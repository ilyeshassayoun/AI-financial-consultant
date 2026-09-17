#!/bin/sh
set -e

# Production must use a stable secret so sessions survive restarts and tokens
# cannot be signed with an accidental default. Development remains convenient.
if [ -z "$JWT_SECRET_KEY" ] || [ "$JWT_SECRET_KEY" = "change-me-in-production-use-a-long-random-string" ] || [ "$JWT_SECRET_KEY" = "change-me-in-production" ]; then
    case "${APP_ENV:-development}" in
        production|prod)
            echo "ERROR: Configure a stable JWT_SECRET_KEY of at least 32 characters before production startup." >&2
            exit 1
            ;;
        *)
            export JWT_SECRET_KEY=$(python -c "import secrets; print(secrets.token_urlsafe(48))")
            echo "Notice: Ephemeral JWT_SECRET_KEY generated for development."
            ;;
    esac
fi

# Run database migrations if DATABASE_URL is configured and not default local
if [ -n "$DATABASE_URL" ] && [ "$DATABASE_URL" != "postgresql+asyncpg://postgres:postgres@localhost:5432/financial_consultant" ]; then
    echo "Attempting database migrations..."
    if ! alembic -c alembic.ini upgrade head; then
        case "${APP_ENV:-development}" in
            production|prod)
                echo "ERROR: Database migration failed; refusing production startup." >&2
                exit 1
                ;;
            *) echo "Warning: Database migration failed in development; continuing without persistence." ;;
        esac
    fi
else
    echo "DATABASE_URL not configured for remote database; skipping startup migrations."
fi

# Dynamic PORT provided by Railway / cloud container environment
PORT="${PORT:-8000}"
echo "Starting Uvicorn web server on port $PORT..."
# Rate limiting and lightweight metrics are process-local today. Default to a
# single worker until they are backed by a shared store.
exec uvicorn main:app --host 0.0.0.0 --port "$PORT" --workers "${WEB_CONCURRENCY:-1}" --log-level info
