@echo off
title SentimAI Studio - AI Sentiment Analyzer
echo =======================================================
echo          Starting SentimAI Studio NLP Server
echo =======================================================
echo.

:: Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH!
    echo Please install Python from https://www.python.org/
    pause
    exit /b
)

:: Install / verify dependencies
echo [*] Checking dependencies...
python -m pip install -r requirements.txt --quiet

:: Download NLTK lexicons
echo [*] Initializing AI models & NLP lexicons...
python -c "import nltk; nltk.download('vader_lexicon', quiet=True); nltk.download('punkt', quiet=True)"

echo.
echo [*] Launching SentimAI Studio at http://127.0.0.1:8000
echo [*] Press Ctrl+C in this terminal to stop the server.
echo.

:: Start server and open browser
start http://127.0.0.1:8000
python -m uvicorn backend.app:app --host 127.0.0.1 --port 8000 --reload
pause
