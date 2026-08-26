@echo off
title AI Financial Consultant Launcher
cd /d "%~dp0"
echo ========================================================
echo 🏦  Launching AI Financial Consultant
echo ========================================================
echo.

echo [1/2] Starting FastAPI Backend on port 8000...
start "AI Consultant Backend Server" cmd /k "cd /d "%~dp0backend" && call "%~dp0venv\Scripts\activate" && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

echo [2/2] Starting Vite Frontend on port 5173...
start "AI Consultant Frontend Server" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo Waiting 3 seconds for local servers to initialize...
timeout /t 3 /nobreak >nul

echo Opening browser at http://localhost:5173...
start http://localhost:5173

echo.
echo ========================================================
echo ✅ Application is running!
echo • Frontend UI: http://localhost:5173
echo • Backend API: http://localhost:8000/docs
echo.
echo (Keep the two backend/frontend terminal windows open while using the app)
echo ========================================================
pause

