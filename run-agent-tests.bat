@echo off
REM Quick Agent Test Runner
REM Run from project root: .\run-agent-tests.bat

echo.
echo ================================================================
echo    Advancia Pay Ledger - Agent Test Runner
echo ================================================================
echo.

cd backend

echo Step 1: Checking dependencies...
if not exist "node_modules\" (
    echo [!] node_modules not found. Installing...
    call npm install
    if errorlevel 1 (
        echo [X] npm install failed!
        pause
        exit /b 1
    )
)
echo [OK] Dependencies installed

echo.
echo Step 2: Generating Prisma client...
call npx prisma generate >nul 2>&1
if errorlevel 1 (
    echo [!] Prisma generate had warnings (this is usually OK)
) else (
    echo [OK] Prisma client generated
)

echo.
echo Step 3: Running agent tests...
echo ================================================================
echo.

call npm run agent:test

echo.
echo ================================================================
if errorlevel 1 (
    echo [X] Tests failed. Check output above for details.
    echo.
    echo Common fixes:
    echo   - Start PostgreSQL if not running
    echo   - Check DATABASE_URL in backend/.env
    echo   - Run: npx prisma migrate deploy
    echo.
) else (
    echo [OK] All tests passed!
    echo.
)

cd ..
pause
