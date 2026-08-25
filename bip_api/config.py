import os
from pathlib import Path

# Project root resolution
_curr = Path(__file__).resolve().parent
PROJECT_ROOT = _curr.parent

ARTIFACTS_DIR = PROJECT_ROOT / "bip" / "classification_artifacts"
STM32_EXPORT_DIR = PROJECT_ROOT / "stm32_export"
DATA_DIR = PROJECT_ROOT / "data"

CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# ---------------------------------------------------------------------------
# Live Telemetry Configuration Defaults
# (Override via POST /ws/v1/live/config at runtime)
# ---------------------------------------------------------------------------

# Default simulator sample rate (Hz). 10 Hz is readable in dev; 100 Hz is
# closer to realistic embedded acquisition pace.
LIVE_DEFAULT_SAMPLE_RATE_HZ: float = 10.0

# Placeholder for future STM32 USB CDC serial port
# On Linux: typically /dev/ttyACM0 or /dev/ttyUSB0
# On Windows: typically COM3, COM4, etc.
LIVE_STM32_SERIAL_PORT: str = "/dev/ttyACM0"
LIVE_STM32_BAUD_RATE:   int = 115200
