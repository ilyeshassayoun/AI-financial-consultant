# Multi-stage production container: React Frontend + FastAPI Backend
# Stage 1: Build Frontend Assets
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Production Python Backend with bundled Frontend
FROM python:3.12-slim
WORKDIR /app
ENV APP_ENV=production COOKIE_SECURE=true

# Install system runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends gcc libpq-dev curl && rm -rf /var/lib/apt/lists/*

# Install backend Python dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copy backend application source
COPY backend/ ./backend/

# Copy built frontend distribution from builder stage
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Secure non-root runtime user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

WORKDIR /app/backend

# Run with dynamic PORT provided by Railway / cloud host
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 2 --log-level info"]
