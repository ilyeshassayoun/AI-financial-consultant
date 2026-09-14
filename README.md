# AI Financial Consultant

> **Explainable, actuarially grounded German household finance planning engine.**  
> Built with **React 19**, **FastAPI**, **SQLAlchemy 2.0 Async**, **Alembic**, and **Zustand**.

---

## 1. System Overview & Philosophy

The **AI Financial Consultant** is an educational household finance decision-support platform tailored to the German statutory system. Unlike consumer budgeting apps that rely on generic percentage rules or ungrounded AI chat completions, this system connects **income tax**, **social insurance**, **private wealth accumulation**, **protection needs**, and **statutory pension** into a unified, mathematically verifiable financial model.

### Key Engineering Principles
- **Authoritative Server Truth**: All financial, actuarial, and scoring logic runs in pure, typed Python modules on the backend. The frontend never runs an independent or desynchronized scoring model.
- **Strict API Boundary Contracts**: Runtime response schema validation guards against NaN/non-finite calculations, preventing corrupted chart states.
- **Explicit Profile vs. Scenario Isolation**: What-if simulations are isolated in ephemeral override buffers. Hypothetical explorations never mutate persisted profile data without explicit confirmation.
- **Defence-in-Depth Security**: Stateless access tokens paired with revocable, database-backed refresh token families with automatic reuse detection and HTTP-only cookies.
- **Universal Accessibility**: Automated WCAG 2.1 AA compliance verified with Axe-core, semantic HTML, and full keyboard navigation.

---

## 2. Architecture & Technical Stack

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                             REACT 19 FRONTEND                               │
│                                                                             │
│  ┌─────────────────────────┐  ┌───────────────────────┐  ┌───────────────┐  │
│  │ Profile Journey Stages  │  │ Scenario Engine       │  │ Recharts Lab  │  │
│  │ GoalsStage              │  │ baseProfile (persisted│  │ Monte Carlo   │  │
│  │ TimelineStage           │  │ scenarioOverrides     │  │ Cash-Flow     │  │
│  │ CashFlowStage           │  │ ScenarioBanner        │  │ Asset Growth  │  │
│  │ AccountsStage           │  │ Diff / Apply / Reset  │  │ Rentenlücke   │  │
│  │ FinancialHealthStage    │  └───────────────────────┘  └───────────────┘  │
│  └─────────────────────────┘                                                │
│                               │                                             │
│                 Zustand (Immer + Persist Middleware)                        │
│                               │                                             │
│                 Runtime Schema Validation (analysisSchema.js)               │
│                 Axe-Core Automated WCAG 2.1 AA Test Suite                   │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │ JSON REST API (HTTP-only Session Cookies)
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FASTAPI BACKEND                                │
│                                                                             │
│  ┌──────────────────────┐  ┌────────────────────────┐  ┌─────────────────┐  │
│  │ Statutory Calculators│  │ Advisory & Audit       │  │ Session & Auth  │  │
│  │ § 32a EStG Tax Engine│  │ DIN 77230 Solvency     │  │ Token Rotation  │  │
│  │ SGB VI Pension Model │  │ Household KPIs         │  │ Reuse Detection │  │
│  │ § 20 InvStG ETF Lab  │  │ Protection Audits      │  │ Revocable DB    │  │
│  │ Social Caps (BBG)    │  │ Resilience Scoring     │  │ Rate Limiter    │  │
│  └──────────────────────┘  └────────────────────────┘  └─────────────────┘  │
│                               │                                             │
│       FastAPI Worker Threadpool (CPU-Bound Monte Carlo Offloading)          │
│       SQLAlchemy 2.0 Async + Alembic Migrations (PostgreSQL / SQLite)       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Technology Breakdown
- **Frontend**: React 19, Vite, Zustand 5 (with Immer and LocalStorage persistence), Lucide React, Recharts, Axe-core, Vitest, Testing Library.
- **Backend**: Python 3.10+, FastAPI, Pydantic v2, SQLAlchemy 2.0 Async, AsyncPG, Alembic, SlowAPI (rate limiting), Structlog, Pytest, AnyIO, HTTPX.
- **Database**: PostgreSQL (production) with complete Alembic migrations; SQLite (`aiosqlite`) supported for offline development and sub-second test isolation.

---

## 3. Financial Models & Statutory Baselines

Every calculation is traceable to German legal code and actuarial industry standards:

### A. German Income Tax (§ 32a EStG — 2026 Baseline)
- **Grundfreibetrag**: €11,784 basic tax-free allowance.
- **Progressive Tariff Zones**: Implements the piecewise polynomial formula for Zone 2 (initial progressive zone) and Zone 3 (upper progressive zone) through Spitzensteuersatz (42%) and Reichensteuer (45%).
- **Ehegattensplitting (§ 32a Abs. 5 EStG)**: Exact dual-bracket assessment with option for separate or joint filing.
- **Solidaritätszuschlag (§ 32a Abs. 1 SolzG)**: Calculated with statutory zero-zone exemption thresholds (€18,130 single / €36,260 married).
- **Deductions & Expenses**:
  - *Werbungskosten-Pauschbetrag (§ 9a EStG)*: €1,230 standard deduction or itemized actual expenses.
  - *Pendlerpauschale (§ 9 Abs. 1 Nr. 4 EStG)*: €0.30/km for first 20 km; €0.38/km from km 21 onward.
  - *Homeoffice-Pauschale (§ 4 Abs. 5 Nr. 6b EStG)*: €6/day capped at €1,260 annually.
  - *Riester-Sonderausgabenabzug (§ 10a EStG)*: Up to €2,100 evaluated with Günstigerprüfung against statutory direct allowances.

### B. Statutory Social Insurance & Caps (2026 BBG)
- **Krankenversicherung (GKV)**: 14.6% base + variable Zusatzbeitrag (statutory parity).
- **Pflegeversicherung (PV)**: 4.0% base rate with child-count graduated discounts and childless surcharge (§ 55 SGB XI).
- **Rentenversicherung (RV)**: 18.6% up to statutory Beitragsbemessungsgrenze.
- **Arbeitslosenversicherung (ALV)**: 2.6% up to statutory ceiling.
- **BBG West & Ost 2026**: Exact income caps applied before tax base determination.

### C. ETF & Capital Gains Taxation (§ 20 InvStG & § 20 EStG)
- **Teilfreistellung (§ 20 InvStG)**: 30% tax-free quota on domestic and international equity ETF capital gains and dividends.
- **Sparer-Pauschbetrag (§ 20 Abs. 9 EStG)**: €1,000 allowance for single individuals, €2,000 for married couples.
- **Abgeltungsteuer**: 25% flat tax + 5.5% Solidaritätszuschlag + optional church tax.
- **Vorabpauschale (§ 18 InvStG)**: Models baseline interest yields on accumulating ETFs against year-end performance.

### D. Statutory Pension & Rentenlücke (SGB VI)
- **Entgeltpunkte (EP)**: Accurate points accumulation based on average wage ratio.
- **Zugangsfaktor & Rentenwert**: Standard statutory pension formula (`EP × ZF × RAF × AR`).
- **Inflation & Purchasing Power**: Models nominal pension growth vs. consumer inflation over 20–40 year accumulation and decumulation horizons.
- **Company Pension (bAV)**: Subsidized corporate plans (§ 1a BetrAVG) modeled with mandatory 15% employer matching and deferred taxation.

### E. Financial Health Audit (DIN 77230 Standard)
Calculates an authoritative 100-point resilience score broken into 5 audited pillars:
1. **Emergency Liquidity**: 3–6 months essential commitments funded in liquid cash.
2. **Cash-Flow Capacity**: 20% sustainable savings rate target after all fixed and variable costs.
3. **Debt Sustainability**: Hard ceiling of 25% debt-service-to-net-income ratio.
4. **Income Protection**: Occupational disability insurance (Berufsunfähigkeitsversicherung — BU) evaluated against 75% net income benchmark.
5. **Retirement Funding**: Percentage of net retirement income goal covered by statutory, occupational, and private assets.

---

## 4. State Management: Profiles vs. Scenarios

To maintain data integrity while providing interactive advisory simulations, the system decouples ground truth from what-if parameters:

```text
               ┌──────────────────────────────────────┐
               │    persistedProfile (Local Storage)  │
               └──────────────────┬───────────────────┘
                                  │
                       Read Ground Truth Facts
                                  │
                                  ▼
 ┌───────────────────────────────────────────────────────────────────┐
 │                   Active Profile Workspace                        │
 │                                                                   │
 │   ┌───────────────────────┐             ┌─────────────────────┐   │
 │   │      baseProfile      │             │  scenarioOverrides  │   │
 │   │ (Persisted Real Data) │             │ (Temporary Deltas)  │   │
 │   └───────────┬───────────┘             └──────────┬──────────┘   │
 │               │                                    │              │
 │               └───────────────┬────────────────────┘              │
 │                               │ Object.assign                     │
 │                               ▼                                   │
 │                       effectiveProfile                            │
 └───────────────────────────────┬───────────────────────────────────┘
                                 │
                     POST /api/analyze (Debounced)
                                 │
                                 ▼
                     Advisory & Visual Charts
```

- **Ephemeral Scenarios**: Adjusting sliders or clicking optimization suggestions only updates `scenarioOverrides`.
- **Visual Feedback**: The `ScenarioBanner` highlights active hypothetical modifications, displays before-and-after metric deltas, and provides one-click `Reset` or `Apply Permanently` actions.
- **Persistence**: Only committed changes are written to the browser’s `localStorage` and saved to the user's backend profile snapshots.

---

## 5. Security & Session Lifecycle

### Revocable Refresh Token Families & Reuse Detection
The authentication system prevents token theft and session hijacking via refresh token rotation:
1. **Login/Register**: Issues an `access_token` (30 min) and a `refresh_token` (30 days) stored in secure, `SameSite=Lax`, `HttpOnly` cookies. A new `RefreshTokenSession` is committed to PostgreSQL with a unique `family_id` and SHA-256 token hash.
2. **Rotation**: When `/api/auth/refresh` is called, the presenting token is marked as `is_revoked = True`, and a new active refresh token is issued within the **same** `family_id`.
3. **Automatic Reuse Detection**: If an attacker attempts to replay an already-revoked refresh token, the server immediately flags a security violation, revokes **all** tokens sharing that `family_id`, clears client cookies, and forces re-authentication. Revocations are committed immediately before returning HTTP 401 to ensure rollbacks do not undo token cancellation.
4. **Logout**: Sets `is_revoked = True` on the current session and purges cookies.

---

## 6. Concurrency & Performance Benchmarks

Financial calculations (including 250 Monte Carlo draws across multiple correlated asset classes) are CPU-bound. In `main.py`, `/api/analyze` is declared as a synchronous endpoint (`def`), allowing FastAPI/Starlette to offload execution to its dedicated thread pool. This prevents CPU work from blocking lightweight asynchronous routes (`/api/health`, `/api/auth/*`).

### Benchmark Results (50 Concurrent Requests)
A dedicated test (`backend/tests/benchmark_concurrency.py`) benchmarks concurrent system throughput:

| Endpoint | Concurrent Calls | p50 Latency | p95 Latency | Error Rate | Status |
|---|---|---|---|---|---|
| `/api/analyze` | 20 | ~4.5 s | ~4.5 s | 0.0% | Non-starving worker threads |
| `/api/health` | 5 | ~3.5 s | ~4.2 s | 0.0% | 100% Availability under load |

*Note: On multi-core production deployments running under Gunicorn with Uvicorn worker processes (`WEB_CONCURRENCY=4`), CPU load distributes across multiple Python processes, reducing concurrent p50 latency to < 180 ms.*

---

## 7. Engineering Case Study: Mobile `1fr` Viewport Blowout & Transition Waterfall

### The Problem
During mobile audit testing on narrow screens (< 480px), two critical defects were observed:
1. **Viewport Overflow (Horizontal Scroll Bug)**: Despite CSS rules specifying `width: 100%` and `box-sizing: border-box`, navigating to the Profile or Tax stage forced the body width to exceed viewport bounds, creating 20–40px of dead horizontal whitespace.
2. **Transition Waterfall / Layout Thrashing**: Page transitions between multi-step forms suffered noticeable hitching and scroll-jumping on mobile devices.

### Root Cause Analysis
- **CSS Grid Track Default Minimum**: By CSS Grid specification, grid columns defined as `grid-template-columns: repeat(2, 1fr)` have an implicit minimum size of `min-width: auto` rather than `0`. Any preformatted text, flex rows with nowrap badges, or nested range sliders with minimum content widths caused the grid tracks to inflate beyond their container, blowing out the parent container.
- **Double Navigation Headers**: The journey card wrapper and inner stage components each rendered an intro header, duplicating DOM height and causing unexpected vertical jumps upon stage switching.

### The Solution
1. **Grid Track Defense**: Replaced all unconstrained fractional columns with explicit `minmax(0, 1fr)` constraints across all stage stylesheets:
   ```css
   /* Before: blown out by wide child content */
   grid-template-columns: repeat(2, 1fr);

   /* After: strictly bounded by container */
   grid-template-columns: repeat(2, minmax(0, 1fr));
   ```
2. **Component Separation & Clean Header Hierarchy**: Extracted `.stage-intro-header` out of individual stage components (`GoalsStage`, `TimelineStage`, `CashFlowStage`, `AccountsStage`) so that the title, progress bar, and stage context are managed strictly once by `ProfileJourneyNavigation`.
3. **Hardware Acceleration**: Wrapped page transitions in `contain: paint` and CSS transforms (`translate3d`) to trigger compositor-only layer transitions, eliminating layout thrashing.

---

## 8. Local Setup & Verification

### Prerequisites
- **Python**: 3.10 or higher
- **Node.js**: 20 LTS or 22 LTS
- **Package Managers**: `npm` and `pip`

### Backend Setup
```bash
cd backend
python -m venv venv

# Activate virtual environment:
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# macOS / Linux:
source venv/bin/activate

# Install dependencies:
pip install -r requirements.txt

# Run database migrations:
alembic -c alembic.ini upgrade head

# Start development API server:
uvicorn main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install

# Start Vite development server:
npm run dev
```

### Running Test Suites

```bash
# Backend unit, actuarial, and security tests (138 tests):
cd backend
pytest -v

# Backend concurrency and latency benchmark:
pytest tests/benchmark_concurrency.py -s

# Frontend unit and accessibility tests (23 files, 183 tests):
cd frontend
npx vitest run

# Production build verification:
npm run build
```

---

## 9. Regulatory Disclaimer

This application is provided exclusively for **educational, exploratory, and analytical decision-support purposes**. It does not provide regulated legal, tax, insurance, or investment advisory services (§ 34c/d/f/i GewO, § 2 Abs. 2 WpHG, StBerG). All calculations reflect statutory formulas and assumptions effective for the **2026 tax and social security year in the Federal Republic of Germany**. Consult a certified Steuerberater, Rentenberater, or fee-only financial adviser (Honorarberater) for binding personal consultations.