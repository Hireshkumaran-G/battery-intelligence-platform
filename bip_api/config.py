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
