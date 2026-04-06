@echo off
REM DuoLingual Setup Script for Windows
REM Complete setup for local development

echo 🚀 DuoLingual Setup
echo ===================

REM Check prerequisites
echo.
echo Checking prerequisites...

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+
    exit /b 1
)

where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm is not installed.
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✓ Node.js %NODE_VERSION%

for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo ✓ npm %NPM_VERSION%

REM Setup Backend
echo.
echo Setting up Backend...
cd backend

if not exist .env (
    echo Creating .env from .env.example...
    copy .env.example .env
    echo ⚠️  Please edit backend\.env with your database credentials and API keys
)

echo Installing backend dependencies...
call npm install

REM Setup Frontend
echo.
echo Setting up Frontend...
cd ..\frontend

if not exist .env.local (
    echo Creating .env.local...
    (
        echo NEXT_PUBLIC_API_URL=http://localhost:5000
    ) > .env.local
)

echo Installing frontend dependencies...
call npm install

echo.
echo ✓ Setup complete!
echo.
echo Next steps:
echo 1. Configure backend\.env with database credentials and API keys
echo 2. In one terminal: cd backend ^&^& npm run db:init ^&^& npm run db:seed ^&^& npm run dev
echo 3. In another terminal: cd frontend ^&^& npm run dev
echo 4. Open http://localhost:3000
