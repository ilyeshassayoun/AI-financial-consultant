# 🏦 AI Financial Consultant

An AI-powered German financial consulting application that automates client assessments, tax optimization, insurance selection, investment strategies, and retirement planning.

Built with **React 19** (Vite) + **Python** (FastAPI) + **Groq**.

---

## ✨ Features

### 📊 Financial Dashboard
- **Tax breakdown** with progressive German tax formula (§ 32a EStG 2026)
- **Investment projection** with percentile fan chart (Monte Carlo simulation)
- **Portfolio allocation** donut chart with 7 asset classes
- **Offline PWA Support**: Instantly installable on mobile devices with static asset caching.
- **Component Lazy Loading**: Heavy charting components are dynamically loaded for instant initial render.

### 🧮 Expert German Tax Engine
- All 6 **Steuerklassen** (Tax Classes I–VI)
- **Kinderfreibetrag vs Kindergeld** automatic Günstigerprüfung
- **Pendlerpauschale** (commuter allowance) with split rates
- **Home Office Pauschale** (6€/day, max 1,260€)
- **Riester-Rente** tax benefits with Zulagen comparison
- **Solidaritätszuschlag** with Milderungszone sliding scale
- **Church Tax** (configurable 8–9%)
- **Private Health Insurance** (PKV) support

### 📈 Investment Simulator
- **Monte Carlo simulation** (500 runs) with Geometric Brownian Motion
- **Correlated asset returns** via Cholesky decomposition
- **7 asset classes**: Global Equities, EU Equities, Emerging Markets, EU Bonds, Corporate Bonds, Real Estate, Commodities
- **German Abgeltungsteuer** (26.375%) on rebalancing gains
- **Sparerpauschbetrag** (1,000€ tax-free allowance)
- **Max drawdown** risk metric

### 🏖️ Retirement Planner
- **Gesetzliche Rente** (state pension) with Entgeltpunkte & Zugangsfaktor
- **Rentenlücke** (pension gap) calculation
- **Riester-Rente** projection with Grundzulage & Kinderzulage
- **Private pension** with Abgeltungsteuer at withdrawal
- Inflation-adjusted real values

### 💡 Financial Optimizer
- **9 tax optimization checks** (Pendlerpauschale, Home Office, Riester, Church Tax, Splitting, etc.)
- **Financial Health Score** (0–100)
- Personalized investment, retirement, and insurance action items

### 🤖 AI Chat Consultant
- Conversational AI powered by free-tier LLM (Groq Llama 3)
- Full financial context injection for accurate advice
- Markdown-rendered responses
- Suggested prompt chips for quick questions

---

## 🏗️ Architecture

```
┌─────────────────┐         ┌──────────────────────────────────┐
│   React (Vite)  │◄───────►│         FastAPI (Python)          │
│   PWA Ready     │  REST   │    MyPy Strict Typed Backend    │
│  ┌───────────┐  │         │  ┌─────────────────────────────┐ │
│  │ Dashboard │  │         │  │  tax_calculator.py           │ │
│  │ Retirement│  │         │  │  investment_engine.py        │ │
│  │ Optimizer │  │         │  │  mock_insurance_data.py      │ │
│  │ AI Chat   │  │         │  │  retirement_planner.py       │ │
│  └───────────┘  │         │  │  financial_optimizer.py      │ │
│                 │         │  │  llm_service.py ──► Groq API │ │
└─────────────────┘         │  └─────────────────────────────┘ │
                            └──────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+

### Automated Setup (Windows)
We have provided automated batch scripts to make setup and launching effortless.

1. Double-click `setup.bat` to install all Python and Node.js dependencies.
2. Double-click `start.bat` to launch both the backend and frontend servers simultaneously.

Open `http://localhost:5173` in your browser.

### Manual Setup (Mac/Linux)
```bash
# Terminal 1 - Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

---

## 🧪 Code Quality & Tests

This codebase adheres to the highest software engineering standards.

```bash
# Run Backend Tests (95/95 Pytest suite)
cd backend
python -m pytest tests/ -v

# Run Backend Type Checking (100% strict)
python -m mypy .

# Run Frontend Linter (0 warnings)
cd frontend
npx oxlint --deny-warnings
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Recharts, Lucide Icons, vite-plugin-pwa |
| Backend | Python, FastAPI, Pydantic V2, MyPy |
| AI | Groq API (Llama 3.3 70B) |
| Styling | Vanilla CSS (Glassmorphism dark mode) |

---

## 📄 License

This project is for educational and portfolio demonstration purposes. It does not contain proprietary financial data or company-specific logic.
