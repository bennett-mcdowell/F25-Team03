#!/bin/bash

# Stop any existing containers
echo "Cleaning up old containers..."
docker stop flask-backend 2>/dev/null || true
docker rm flask-backend 2>/dev/null || true

# Start Backend in Docker (backend only for faster builds)
echo "Building and starting Flask backend on port 5000..."
# Build from repo root with -f flag pointing to Dockerfile.dev
docker build -f src/Dockerfile.dev -t myapp .

if [ $? -ne 0 ]; then
  echo "Failed to build backend Docker image"
  exit 1
fi

if ! docker run -d -p 5000:5000 --name flask-backend myapp; then
  echo "Failed to start backend"
  exit 1
fi

echo "Backend running at http://localhost:5000"

# Check if node_modules exists, if not install
cd Frontend_Rework
if [ ! -d "node_modules" ]; then
  echo "Installing frontend dependencies..."
  npm install
fi

# Start React Frontend
echo "Starting React frontend on port 3000..."
npm run dev &

echo ""
echo "========================================="
echo "Both servers are running!"
echo "========================================="
echo "Backend (Flask):  http://localhost:5000"
echo "Frontend (React): http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"
echo "========================================="

# Wait for Ctrl+C
wait

# Cleanup
echo ""
echo "Stopping servers..."
docker stop flask-backend
echo "Stopped!"
