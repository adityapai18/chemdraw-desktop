@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"

echo.
echo =========================================
echo   ChemDraw Processor - Release Build
echo =========================================
echo.

REM 1) Tooling checks
where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js not found in PATH.
  pause
  exit /b 1
)

where python >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Python not found in PATH.
  pause
  exit /b 1
)

REM 2) Ensure Node dependencies
if not exist "node_modules" (
  echo [1/7] Installing Node.js dependencies...
  call npm install
  if errorlevel 1 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
  )
) else (
  echo [1/7] Node.js dependencies already installed.
)

REM 3) Ensure Python venv
if not exist "python\venv\Scripts\python.exe" (
  echo [2/7] Creating Python virtual environment...
  python -m venv python\venv
  if errorlevel 1 (
    echo [ERROR] Failed to create python\venv.
    pause
    exit /b 1
  )
) else (
  echo [2/7] Python virtual environment already exists.
)

set "PY_EXE=%~dp0python\venv\Scripts\python.exe"

REM 4) Install Python dependencies
echo [3/7] Installing Python dependencies...
"%PY_EXE%" -m pip install --upgrade pip --disable-pip-version-check >nul
"%PY_EXE%" -m pip install -r python\requirements.txt
if errorlevel 1 (
  echo [ERROR] Failed to install python requirements.
  pause
  exit /b 1
)

REM 5) Install PyInstaller
echo [4/7] Installing PyInstaller...
"%PY_EXE%" -m pip install pyinstaller
if errorlevel 1 (
  echo [ERROR] Failed to install PyInstaller.
  pause
  exit /b 1
)

REM 6) Build Python backend and stage under python-dist
echo [5/7] Building Python backend with PyInstaller...
if exist "python\build" rmdir /s /q "python\build"
if exist "python\dist" rmdir /s /q "python\dist"
"%PY_EXE%" -m PyInstaller "python\backend.spec" --clean --noconfirm
if errorlevel 1 (
  echo [ERROR] PyInstaller build failed.
  pause
  exit /b 1
)

if not exist "python\dist\backend\backend.exe" (
  echo [ERROR] Expected output missing: python\dist\backend\backend.exe
  pause
  exit /b 1
)

if exist "python-dist" rmdir /s /q "python-dist"
mkdir "python-dist"
xcopy /E /I /Y "python\dist\backend" "python-dist\backend" >nul
if errorlevel 1 (
  echo [ERROR] Failed to copy backend bundle to python-dist.
  pause
  exit /b 1
)

REM 7) Build + package Electron app
echo [6/7] Building Electron app...
call npm run build
if errorlevel 1 (
  echo [ERROR] npm run build failed.
  pause
  exit /b 1
)

echo [7/7] Packaging Windows installer...
call npm run package
if errorlevel 1 (
  echo [ERROR] npm run package failed.
  pause
  exit /b 1
)

echo.
echo [SUCCESS] Release build complete.
echo Installer output directory: dist-electron
echo.
pause
exit /b 0
