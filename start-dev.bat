@echo off
setlocal

REM Always run from the folder where this script is located (repo root)
cd /d "%~dp0"

echo Cleaning up old containers...
docker stop flask-backend 2>NUL
docker rm flask-backend 2>NUL

REM Start Backend in Docker (backend only for faster builds)
echo Building and starting Flask backend on port 5000...
docker build -f src\Dockerfile.dev -t myapp .

if %ERRORLEVEL% NEQ 0 (
    echo Failed to build backend
    exit /b 1
)

docker run -d -p 5000:5000 --name flask-backend myapp

if %ERRORLEVEL% NEQ 0 (
    echo Failed to start backend
    exit /b 1
)

echo Backend running at http://localhost:5000

REM Go to React Frontend folder (where package.json lives)
cd Frontend_Rework

REM Safety check for package.json
if not exist "package.json" (
    echo ERROR: package.json not found in %CD%
    echo Expected location: F25-TEAM03\Frontend_Rework
    goto cleanup
)

REM Check if node_modules exists, if not install
if not exist "node_modules\" (
    echo Installing frontend dependencies...
    call npm install
)

echo Starting React frontend on port 3000...
REM Start a new terminal window for React, staying in this folder
start "React Frontend" cmd /k npm run dev

echo.
echo =========================================
echo Both servers are running!
echo =========================================
echo Backend (Flask):  http://localhost:5000
echo Frontend (React): http://localhost:3000
echo.
echo Press any key here to stop the backend container...
echo (Close the React window separately when you're done.)
echo =========================================

pause >NUL

:cleanup
echo.
echo Stopping backend container...
docker stop flask-backend 2>NUL
echo Done!

endlocal
