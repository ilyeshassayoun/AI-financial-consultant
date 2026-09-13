# Setup and Deployment Guide

## Quick Start (Local Development)

### Prerequisites
- Python 3.12+
- Node.js 22+
- PostgreSQL 16 (or Docker)

### 1. Configure Environment
```bash
cp .env.example backend/.env
```

For Docker Compose, copy the template to the repository root as `.env` instead;
Compose reads its substitution variables there.

Edit `backend/.env` and set at minimum:
- `GROQ_API_KEY` -- get free at https://console.groq.com
- `JWT_SECRET_KEY` -- run: `python -c "import secrets; print(secrets.token_hex(32))"`

### 2. Start with Docker (easiest)
```bash
docker-compose up --build
```
App available at: http://localhost:8080

### 3. Start manually
```bash
# Terminal 1: Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
```
Frontend: http://localhost:5173 | API Docs: http://localhost:8000/docs

---

## Google OAuth Setup

1. Go to https://console.cloud.google.com
2. Create or select a project
3. Navigate to APIs and Services > Credentials
4. Click + Create Credentials > OAuth 2.0 Client ID
5. Application type: Web application
6. Add Authorized redirect URIs:
   - Local: `http://localhost:8000/api/auth/google/callback`
   - Production: `https://your-backend.railway.app/api/auth/google/callback`
7. Copy Client ID and Client Secret to your `.env`

---

## Railway Deployment

### Prerequisites
- Railway account at https://railway.com with an available deployment allowance
- GitHub repository with this code pushed

### Steps

1. Push code to GitHub

2. Go to https://railway.app/new and choose **Deploy from GitHub repo**. Select this
   repository. Railway uses the root `Dockerfile`, which builds the frontend and
   serves it from the FastAPI application as one web service. Do not set a root
   directory or override the start command.

3. Add PostgreSQL from **+ New > Database > PostgreSQL**.

4. In the web service's **Variables** tab, add:
     ```
     DATABASE_URL=${{Postgres.DATABASE_URL}}
     JWT_SECRET_KEY=<generated 64-char hex>
     APP_ENV=production
     COOKIE_SECURE=true
     ```
   Use Railway's reference-variable picker for `DATABASE_URL`; its service name
   may differ from `Postgres`. Generate the JWT secret with
   `python -c "import secrets; print(secrets.token_hex(32))"`. Never commit it.
   Add `GROQ_API_KEY` if you want Groq-backed AI responses. Enter production
   variables directly in Railway; the example `.env` contains local defaults.

5. Deploy, then open **Settings > Networking** for the web service and generate
   a public domain. Confirm `https://<your-domain>/health` returns `200`.

6. Add the public URL to the web service variables, then redeploy:
   ```
   FRONTEND_URL=https://<your-domain>
   CORS_ORIGINS=https://<your-domain>
   ```
   The frontend and API share this domain, so no `VITE_API_URL` is needed.

7. If Google sign-in is enabled, also add `GOOGLE_CLIENT_ID`,
   `GOOGLE_CLIENT_SECRET`, and
   `GOOGLE_REDIRECT_URI=https://<your-domain>/api/auth/google/callback`. Add the
   same callback URL in Google Cloud Console.

### Release verification

Before publishing, install `backend/requirements-dev.txt` and run the backend
tests, plus `npm run lint`, `npm run test`, and `npm run build` in `frontend`.
Review and commit the intended changes before deploying from GitHub; local
uncommitted changes are not included in GitHub deployments.

After deployment, check `/health`, refresh a nested frontend route, register a
test account, sign in, save and reload a profile, and request an analysis.
`/health` confirms the API process is running; it does not verify PostgreSQL.
Check deployment logs for database initialization errors if authentication or
profile persistence fails.

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | No | Enables the Groq-backed AI response; the app has a local fallback |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET_KEY` | Yes | Secret for JWT signing (min 32 chars) |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | No | OAuth callback URL |
| `FRONTEND_URL` | No | Frontend URL for OAuth redirects |
| `CORS_ORIGINS` | No | Comma-separated allowed origins |
| `APP_ENV` | No | Set to `production` outside Docker; the production Dockerfile already sets it |
| `COOKIE_SECURE` | No | Set to `true` outside Docker; the production Dockerfile already sets it |
