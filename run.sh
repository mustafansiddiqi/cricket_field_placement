#!/usr/bin/env bash
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "=== Cricket Field Placement AI ==="
echo ""

# Backend
echo "→ Starting FastAPI backend on http://localhost:8000 ..."
cd "$ROOT/backend"
uvicorn api:app --reload --port 8000 &
BACKEND_PID=$!
echo "  PID: $BACKEND_PID"

# Wait for backend to come up
sleep 2

# Frontend
echo "→ Starting React frontend on http://localhost:3000 ..."
cd "$ROOT/frontend"
npm run dev &
FRONTEND_PID=$!
echo "  PID: $FRONTEND_PID"

echo ""
echo "  App:     http://localhost:3000"
echo "  API:     http://localhost:8000"
echo "  API docs:http://localhost:8000/docs"
echo ""
echo "  Press Ctrl+C to stop"

# Cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Stopped.'" INT TERM
wait
