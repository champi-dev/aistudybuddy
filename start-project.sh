#!/bin/bash

# AI Study Buddy - Project Startup Script
# This script kills all existing dev servers and starts fresh instances

echo "🔄 Starting AI Study Buddy project..."

# Kill all existing Node.js processes and dev servers
echo "🚫 Killing existing processes..."
pkill -f "npm run dev" 2>/dev/null
pkill -f "node" 2>/dev/null

# Free up ports 3000 and 8000
echo "🔓 Freeing up ports..."
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9 2>/dev/null
lsof -i :8000 | grep LISTEN | awk '{print $2}' | xargs kill -9 2>/dev/null

# Wait a moment for cleanup
sleep 2

# Start backend server
echo "🚀 Starting backend server on port 8000..."
cd backend && npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend server
echo "🌐 Starting frontend server on port 3000..."
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Project started successfully!"
echo "📊 Backend running on: http://localhost:8000"
echo "🎯 Frontend running on: http://localhost:3000"
echo ""
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "To stop the project, run:"
echo "  pkill -f 'npm run dev'"
echo ""
echo "Press Ctrl+C to stop this script (servers will continue running)"

# Keep script running to show logs
wait