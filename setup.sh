#!/usr/bin/env bash
set -e

echo "=== Cricket Field Placement AI — Setup ==="
echo ""

# Backend
echo "→ Setting up Python backend..."
cd "$(dirname "$0")/backend"
pip install -q -r requirements.txt
echo "  ✓ Backend dependencies installed"

# Data processing
echo ""
echo "→ Processing Cricsheet data (this may take 5-15 minutes)..."
python process_data.py
echo "  ✓ Data processed"

# Train model
echo ""
echo "→ Training ML model..."
python train_model.py
echo "  ✓ Model trained"

# Frontend
echo ""
echo "→ Setting up React frontend..."
cd ../frontend
npm install --silent
echo "  ✓ Frontend dependencies installed"

echo ""
echo "=== Setup complete! ==="
echo ""
echo "Start the app with:  ./run.sh"
