#!/bin/bash

# Start Backend in Docker
echo "🐳 Starting Flask backend in Docker on port 5000..."
cd src
docker run -d --rm --name flask-backend -p 5000:5000 \
  -e DB_HOST="${DB_HOST}" \
  -e DB_USER="${DB_USER}" \
  -e DB_PASSWORD="${DB_PASSWORD}" \
  -e DB_NAME="${DB_NAME}" \
  -e PORT=5000 \
  myapp

echo "✅ Backend running at http://localhost:5000"

# Start React Frontend
echo "⚛️  Starting React frontend on port 3000..."
cd ../Frontend_Rework
npm run dev &

echo ""
echo "========================================="
echo "🚀 Both servers are running!"
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
echo "✅ Stopped!"
