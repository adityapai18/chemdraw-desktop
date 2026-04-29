@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"

echo.
echo  =========================================
echo   ChemDraw Processor - Starting up...
echo  =========================================
echo.

REM 1) Node.js check
where node >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Node.js is not installed.
    echo          Download it from: https://nodejs.org
    echo.
    pause
    exit /b 1
)

REM 2) Python check
where python >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Python is not installed.
    echo          Download it from: https://python.org
    echo.
    pause
    exit /b 1
)

REM 3) npm dependencies
if not exist "node_modules" (
    echo  [1/3] Installing Node.js dependencies ^(first run only^)...
    call npm install --silent
    if errorlevel 1 (
        echo  [ERROR] npm install failed.
        pause
        exit /b 1
    )
    echo        Done.
) else (
    echo  [1/3] Node.js dependencies already installed.
)

REM 4) Python virtual environment
if not exist "python\venv" (
    echo  [2/3] Creating Python virtual environment ^(first run only^)...
    python -m venv python\venv
    if errorlevel 1 (
        echo  [ERROR] Failed to create Python virtual environment.
        pause
        exit /b 1
    )
    echo        Done.
) else (
    echo  [2/3] Python virtual environment already exists.
)

REM 5) Python dependencies
echo  [3/3] Syncing Python dependencies...
python\venv\Scripts\pip install -r python\requirements.txt -q --disable-pip-version-check
if errorlevel 1 (
    echo  [ERROR] pip install failed. Check python\requirements.txt.
    pause
    exit /b 1
)
echo        Done.

REM 6) Put venv on PATH so Electron can find Python when spawning it
set "PATH=%~dp0python\venv\Scripts;%PATH%"

echo.
echo  Launching app...
echo.

REM 7) Start
call npm run dev
