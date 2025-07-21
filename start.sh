#!/bin/bash

echo "🚀 Starting Metaverse Application..."

# Function to cleanup background processes on exit
cleanup() {
    echo "🛑 Shutting down servers..."
    pkill -f "vite" || true
    pkill -f "nodemon" || true
    pkill -f "ts-node" || true
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start frontend
echo "📱 Starting Frontend (Vite)..."
cd frontend && npm run dev &
FRONTEND_PID=$!

# Wait a moment for frontend to start
sleep 3

# Start backend
echo "🔧 Starting Backend (Socket.IO)..."
cd ../backend && npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

echo "✅ Both servers are starting..."
echo "🌐 Frontend: http://localhost:5173"
echo "🔌 Backend: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all servers"

# Keep script running
wait 