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

## Railway Deployment (Free Tier)

### Prerequisites
- Railway account at https://railway.app (free)
- GitHub repository with this code pushed

### Steps

1. Push code to GitHub

2. Go to https://railway.app/new and click Deploy from GitHub repo

3. Add PostgreSQL:
   - In your project, click + Add Service > PostgreSQL
   - Railway auto-generates DATABASE_URL

4. Configure Backend service:
   - Root Directory: `backend`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Environment variables:
     ```
     DATABASE_URL=<from Railway PostgreSQL>
     GROQ_API_KEY=<your key>
     JWT_SECRET_KEY=<generated 64-char hex>
     GOOGLE_CLIENT_ID=<your id>
     GOOGLE_CLIENT_SECRET=<your secret>
     GOOGLE_REDIRECT_URI=https://<backend-domain>/api/auth/google/callback
     FRONTEND_URL=https://<frontend-domain>
     CORS_ORIGINS=https://<frontend-domain>
     ```

5. Configure Frontend service:
   - Root Directory: `frontend`
   - Build Command: `npm ci && npm run build`
   - Start Command: `npx serve -s dist -l $PORT`
   - Environment variable: `VITE_API_URL=https://<backend-domain>`

6. Generate domains for each service via Railway''s Settings tab

7. Update Google OAuth redirect URI to use your Railway backend domain

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | Yes | Groq API key for LLM chat |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET_KEY` | Yes | Secret for JWT signing (min 32 chars) |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | No | OAuth callback URL |
| `FRONTEND_URL` | No | Frontend URL for OAuth redirects |
| `CORS_ORIGINS` | No | Comma-separated allowed origins |
| `LLM_ACCESS_KEY` | No | Optional API key gate for LLM routes |
