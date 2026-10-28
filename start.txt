@echo off
setlocal enabledelayedexpansion
title Gas Pasal - Application Starter

:: Colors for better visibility
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "BLUE=[94m"
set "RESET=[0m"

echo.
echo %BLUE%╔══════════════════════════════════════════════════════════╗%RESET%
echo %BLUE%║                                                          ║%RESET%
echo %BLUE%║       🚀  GAS PASAL - Application Launcher             ║%RESET%
echo %BLUE%║                                                          ║%RESET%
echo %BLUE%╚══════════════════════════════════════════════════════════╝%RESET%
echo.

:: Check Node.js
echo %YELLOW%[1/5] Checking Node.js...%RESET%
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo %RED%❌ Node.js not found!%RESET%
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)
echo %GREEN%✅ Node.js found%RESET%

:: Check npm
echo %YELLOW%[2/5] Checking npm...%RESET%
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo %RED%❌ npm not found!%RESET%
    pause
    exit /b 1
)
echo %GREEN%✅ npm found%RESET%

:: Check .env files
echo %YELLOW%[3/5] Checking environment files...%RESET%
if not exist "backend\.env" (
    echo %YELLOW%⚠️  backend\.env not found, creating...%RESET%
    (
        echo PORT=5000
        echo DATABASE_URL=postgresql://user:password@localhost:5432/gaspasal
        echo JWT_SECRET=your_secret_key_here
        echo NODE_ENV=development
    ) > "backend\.env"
)

if not exist "frontend\.env" (
    echo %YELLOW%⚠️  frontend\.env not found, creating...%RESET%
    (
        echo VITE_API_URL=http://localhost:5000
    ) > "frontend\.env"
)
echo %GREEN%✅ Environment files ready%RESET%

:: Install backend dependencies
echo %YELLOW%[4/5] Setting up backend...%RESET%
cd backend
if not exist "node_modules" (
    echo Installing backend dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo %RED%❌ Failed to install backend dependencies!%RESET%
        cd ..
        pause
        exit /b 1
    )
) else (
    echo %GREEN%✅ Backend dependencies already installed%RESET%
)

:: Install frontend dependencies
echo %YELLOW%[5/5] Setting up frontend...%RESET%
cd ../frontend
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo %RED%❌ Failed to install frontend dependencies!%RESET%
        cd ..
        pause
        exit /b 1
    )
) else (
    echo %GREEN%✅ Frontend dependencies already installed%RESET%
)

echo.
echo %GREEN%✅ All setup complete! Starting servers...%RESET%
echo.

:: Start both servers in the SAME window using concurrent command
cd ..

:: Create a temporary script to run both servers
echo @echo off > temp_start.cmd
echo echo Starting Backend Server... >> temp_start.cmd
echo cd backend >> temp_start.cmd
echo start /B npm run dev >> temp_start.cmd
echo cd .. >> temp_start.cmd
echo echo. >> temp_start.cmd
echo echo Starting Frontend Server... >> temp_start.cmd
echo cd frontend >> temp_start.cmd
echo start /B npm run dev >> temp_start.cmd
echo cd .. >> temp_start.cmd
echo echo. >> temp_start.cmd
echo echo ✅ Both servers are running! >> temp_start.cmd
echo echo 📱 Frontend: http://localhost:5173 >> temp_start.cmd
echo echo 🔧 Backend:  http://localhost:5000 >> temp_start.cmd
echo echo. >> temp_start.cmd
echo echo Press any key to stop both servers... >> temp_start.cmd
echo pause >nul >> temp_start.cmd
echo taskkill /F /IM node.exe >nul 2>nul >> temp_start.cmd
echo echo ✅ Servers stopped! >> temp_start.cmd

:: Run the temp script in this window
call temp_start.cmd

:: Clean up
del temp_start.cmd

pause