@echo off
REM Windows batch script to start development environment

echo Cleaning up old containers...
docker stop flask-backend 2>NUL
docker rm flask-backend 2>NUL

REM Start Backend in Docker (backend only for faster builds)
echo Building and starting Flask backend on port 5000...
REM Use dev Dockerfile - backend only, no frontend build
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

REM Go back to repo root for frontend
cd ..

REM Start React Frontend
cd Frontend_Rework

REM Check if node_modules exists, if not install
if not exist "node_modules\" (
    echo Installing frontend dependencies...
    call npm install
)

echo Starting React frontend on port 3000...
start "React Frontend" cmd /k npm run dev

echo.
echo =========================================
echo Both servers are running!
echo =========================================
echo Backend (Flask):  http://localhost:5000
echo Frontend (React): http://localhost:3000
echo.
echo Press any key to stop both servers...
echo =========================================

pause >NUL

REM Cleanup
echo.
echo Stopping servers...
docker stop flask-backend
echo Stopped!
