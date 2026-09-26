#!/usr/bin/env python3
"""
Unified platform launcher for Battery Intelligence Platform (BIP).
Starts the FastAPI backend and (optionally) the Vite dashboard frontend.
"""
import os
import sys
import subprocess
import time
import shutil
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
DASHBOARD_DIR = ROOT_DIR / "dashboard"

def check_dashboard_setup():
    """Ensure dashboard dependencies are installed."""
    if not DASHBOARD_DIR.exists():
        print(f"Warning: Dashboard directory not found at {DASHBOARD_DIR}")
        return False
    
    node_modules = DASHBOARD_DIR / "node_modules"
    if not node_modules.exists():
        npm_cmd = shutil.which("npm")
        if not npm_cmd:
            print("Warning: 'npm' command not found. Please install Node.js (>=18) or use conda environment:")
            print("  conda env create -f environment.yml")
            print("  conda activate bip")
            return False
        print("Installing dashboard dependencies (npm install)...")
        subprocess.run([npm_cmd, "install"], cwd=DASHBOARD_DIR, check=True)
    return True

def main():
    print("=" * 65)
    print("  Battery Intelligence Platform (BIP) - System Launcher")
    print("=" * 65)
    
    os.chdir(ROOT_DIR)
    sys.path.insert(0, str(ROOT_DIR))

    has_dashboard = check_dashboard_setup()
    
    processes = []
    try:
        # Start API server via uvicorn
        print("\n[1/2] Starting BIP FastAPI Backend Server on http://0.0.0.0:8000 ...")
        api_proc = subprocess.Popen(
            [sys.executable, "-m", "uvicorn", "bip_api.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"],
            cwd=ROOT_DIR
        )
        processes.append(api_proc)

        if has_dashboard:
            npm_cmd = shutil.which("npm")
            if npm_cmd:
                print("[2/2] Starting Vite Dashboard Frontend on http://localhost:5173 ...")
                dashboard_proc = subprocess.Popen(
                    [npm_cmd, "run", "dev"],
                    cwd=DASHBOARD_DIR
                )
                processes.append(dashboard_proc)
        
        print("\n" + "=" * 65)
        print("  System is live:")
        print("  - Research Dashboard:  http://localhost:5173")
        print("  - Backend REST API:    http://localhost:8000/docs")
        print("  - Live Telemetry WS:   ws://localhost:8000/ws/v1/live/telemetry")
        print("=" * 65)
        print("Press Ctrl+C to terminate all services.\n")
        
        while True:
            time.sleep(1)

    except KeyboardInterrupt:
        print("\nShutting down platform services...")
    finally:
        for p in processes:
            p.terminate()
            try:
                p.wait(timeout=3)
            except Exception:
                p.kill()
        print("Platform shut down cleanly.")

if __name__ == "__main__":
    main()
