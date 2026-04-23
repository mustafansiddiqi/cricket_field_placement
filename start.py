"""
Cricket Field Placement — launcher
Usage: python start.py
"""

import subprocess
import sys
import os
import time
import signal
import webbrowser
from pathlib import Path

ROOT     = Path(__file__).parent
BACKEND  = ROOT / "backend"
FRONTEND = ROOT / "frontend"
DATA_DIR = ROOT / "data"
MODEL_DIR = BACKEND / "models"

procs = []

def stop(sig=None, frame=None):
    print("\nShutting down...")
    for p in procs:
        p.terminate()
    sys.exit(0)

signal.signal(signal.SIGINT, stop)
signal.signal(signal.SIGTERM, stop)

# ── 1. Install backend deps if needed ─────────────────────────────────────────
print("Checking backend dependencies...")
subprocess.run(
    [sys.executable, "-m", "pip", "install", "-q", "-r", "requirements.txt"],
    cwd=BACKEND, check=True
)

# ── 2. Process data if not done yet ───────────────────────────────────────────
if not (DATA_DIR / "deliveries.csv").exists():
    print("Processing match data (first run — this may take a minute)...")
    subprocess.run([sys.executable, "process_data.py"], cwd=BACKEND, check=True)

# ── 3. Train model if not done yet ────────────────────────────────────────────
if not (MODEL_DIR / "zone_model.pkl").exists():
    print("Training model (first run — this may take a minute)...")
    MODEL_DIR.mkdir(exist_ok=True)
    subprocess.run([sys.executable, "train_model.py"], cwd=BACKEND, check=True)

# ── 4. Install frontend deps if needed ────────────────────────────────────────
if not (FRONTEND / "node_modules").exists():
    print("Installing frontend dependencies...")
    subprocess.run(["npm", "install"], cwd=FRONTEND, check=True)

# ── 5. Start backend ──────────────────────────────────────────────────────────
print("Starting backend on http://localhost:8000 ...")
backend_proc = subprocess.Popen(
    [sys.executable, "-m", "uvicorn", "api:app", "--reload", "--port", "8000"],
    cwd=BACKEND
)
procs.append(backend_proc)

# ── 6. Start frontend ─────────────────────────────────────────────────────────
print("Starting frontend on http://localhost:3000 ...")
frontend_proc = subprocess.Popen(["npm", "run", "dev"], cwd=FRONTEND)
procs.append(frontend_proc)

# ── 7. Open browser after a short delay ───────────────────────────────────────
time.sleep(3)
webbrowser.open("http://localhost:3000")

print("\nApp is running. Press Ctrl+C to stop.\n")

# Keep alive
for p in procs:
    p.wait()
