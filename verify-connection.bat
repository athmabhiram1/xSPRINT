@echo off
REM xSPRINT Connection Verification Script (Windows)
REM This script verifies that frontend and backend are properly linked

echo.
echo ================================================
echo xSPRINT Frontend-Backend Connection Verification
echo ================================================
echo.

REM Check 1: Frontend Environment
echo [1/4] Checking Frontend Environment...
if exist "frontend\.env.local" (
    findstr /M "NEXT_PUBLIC_API_BASE_URL" frontend\.env.local >nul
    if errorlevel 1 (
        echo [X] frontend\.env.local missing NEXT_PUBLIC_API_BASE_URL
    ) else (
        echo [OK] frontend\.env.local is configured
        for /f "tokens=2 delims==" %%i in (findstr "NEXT_PUBLIC_API_BASE_URL" frontend\.env.local) do echo     %%i
    )
) else (
    echo [X] frontend\.env.local file not found
    echo     Create it with: NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
)
echo.

REM Check 2: Backend Environment
echo [2/4] Checking Backend Environment...
if exist "backend\.env" (
    findstr /M "DATABASE_URL" backend\.env >nul
    if errorlevel 1 (
        echo [X] backend\.env missing DATABASE_URL
    ) else (
        echo [OK] backend\.env is configured
    )
    
    findstr /M "ALLOWED_ORIGINS" backend\.env >nul
    if errorlevel 1 (
        echo [X] backend\.env missing ALLOWED_ORIGINS
    ) else (
        findstr "localhost:3000" backend\.env >nul
        if errorlevel 1 (
            echo [X] backend\.env ALLOWED_ORIGINS missing localhost:3000
            echo     Add: ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000,http://localhost:3001
        ) else (
            echo [OK] backend\.env includes localhost:3000
        )
    )
) else (
    echo [X] backend\.env file not found
)
echo.

REM Check 3: API Client Configuration
echo [3/4] Checking API Client Configuration...
findstr "NEXT_PUBLIC_API_BASE_URL" frontend\lib\apiClient.ts >nul
if errorlevel 1 (
    echo [X] apiClient.ts not properly configured
) else (
    echo [OK] apiClient.ts is properly configured
)
echo.

REM Check 4: CORS Middleware
echo [4/4] Checking CORS Middleware...
findstr "credentials: true" backend\src\middleware\security.ts >nul
if errorlevel 1 (
    echo [X] CORS middleware missing credentials support
) else (
    echo [OK] CORS middleware has credentials support
)
echo.

echo ================================================
echo Verification Complete!
echo.
echo NEXT STEPS:
echo 1. Open Terminal 1: cd backend && npm run dev
echo 2. Open Terminal 2: cd frontend && npm run dev
echo 3. Open Browser: http://localhost:3000
echo.
echo TROUBLESHOOTING:
echo - If backend port 5000 is already in use, kill it:
echo   netstat -ano ^| findstr :5000
echo   taskkill /PID [PID] /F
echo.
echo - If you see CORS errors, ensure backend/.env has:
echo   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000,http://localhost:3001
echo.
echo ================================================
pause
