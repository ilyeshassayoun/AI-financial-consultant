# Repository Guidelines

## Project Structure & Module Organization

This repository contains a React/Vite frontend and a FastAPI backend.

- `frontend/src/`: application entry points, shared styles, and React code.
- `frontend/src/components/`: page steps, charts, drawers, and advisory UI. Keep component-specific CSS beside its component when practical.
- `frontend/src/services/apiService.js`: frontend-to-backend API boundary.
- `frontend/public/` and `frontend/src/assets/`: static icons and images.
- `backend/main.py`: API models, routes, and analysis orchestration.
- `backend/*_engine.py`, `tax_calculator.py`, and `retirement_planner.py`: domain calculations.
- `backend/tests/`: Pytest suites for financial engines and API behavior.

Do not commit generated `dist/`, `node_modules/`, `venv/`, `.env`, `__pycache__/`, or IDE files.

## Build, Test, and Development Commands

Run the two services in separate terminals:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload
```

```powershell
cd frontend
npm install
npm run dev       # Vite development server
npm run lint      # Oxlint checks
npm run build     # production bundle and compile check
npm run preview   # serve the production bundle locally
```

Run backend tests with `cd backend; python -m pytest tests -v`. The frontend expects `VITE_API_URL` (normally `http://localhost:8000`).

## Coding Style & Naming Conventions

Use four spaces in Python and two spaces in JSX/CSS. Follow PEP 8: `snake_case` functions/modules, `PascalCase` Pydantic models, and uppercase constants. React components and files use `PascalCase` (for example, `InvestmentLaboratory.jsx`); helpers and state variables use `camelCase`. Prefer small, pure financial functions, explicit units/rates, semantic HTML, and reusable Recharts components. Match the existing file's semicolon style and run Oxlint before submitting.

## Testing Guidelines

Pytest is the test framework. Name files `test_<module>.py` and tests `test_<behavior>()`. Financial changes must cover boundary conditions, deterministic simulations, ordered percentiles, tax assumptions, and invalid inputs. Add regression tests alongside every calculation fix. There is no configured coverage threshold; preserve or increase meaningful coverage.

## Commit & Pull Request Guidelines

No Git history is included in this checkout. Use concise imperative commits, optionally scoped, such as `feat(investment): add tax-aware projection` or `fix(api): validate retirement age`. Pull requests should explain the user impact, financial assumptions, validation performed, and related issue. Include screenshots or a short recording for UI changes and note any environment-variable or API-contract changes.

## Security & Financial Accuracy

Copy `.env.example`; never commit API keys or client financial data. Treat outputs as educational estimates, document jurisdiction and tax-year assumptions, and avoid presenting simulated returns as guarantees.
