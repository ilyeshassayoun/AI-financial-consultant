@echo off
title AI Financial Consultant Setup
cd /d "%~dp0"
echo ==============================================
echo 🏦 AI Financial Consultant - Setup Script
echo ==============================================
echo.

echo [1/2] Setting up Backend (Python)...
cd /d "%~dp0backend"
if not exist "venv\" (
    echo Creating virtual environment...
    python -m venv venv
)
call venv\Scripts\activate
echo Installing Python dependencies...
pip install -r requirements.txt
cd ..

echo.
echo [2/2] Setting up Frontend (Node.js)...
cd /d "%~dp0frontend"
echo Installing npm packages...
call npm install
cd /d "%~dp0"

echo.
echo ==============================================
echo ✅ Setup Complete! Run start.bat to launch.
echo ==============================================
pause
