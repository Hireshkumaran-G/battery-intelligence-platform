from contextlib import asynccontextmanager
from pathlib import Path
import glob
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from bip_api.config import CORS_ORIGINS
from bip_api.live.simulator import SimConfig, SimulatedTelemetrySource
from bip_api.routers import overview, artifacts, deployment
from bip_api.routers import live as live_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan: initialise active telemetry source at startup.
    Checks for connected STM32 USB serial port (/dev/ttyACM0, /dev/ttyUSB0, or COMx).
    Falls back to SimulatedTelemetrySource if no physical board is plugged in.
    """
    serial_port = os.getenv("BIP_SERIAL_PORT")
    if not serial_port:
        # Auto-detect Linux ST-LINK serial devices
        acm_ports = glob.glob("/dev/ttyACM*") + glob.glob("/dev/ttyUSB*")
        if acm_ports:
            serial_port = acm_ports[0]

    if serial_port:
        try:
            from bip_api.live.stm32_serial import STM32SerialTelemetrySource
            app.state.telemetry_source = STM32SerialTelemetrySource(port=serial_port, baudrate=115200)
            print(f"✓ Initialized STM32 USB Serial Telemetry Source on {serial_port}")
        except Exception as exc:
            app.state.telemetry_source = SimulatedTelemetrySource(config=SimConfig())
            print(f"✓ Initialized Simulated Telemetry Source (Fallback: {exc})")
    else:
        app.state.telemetry_source = SimulatedTelemetrySource(config=SimConfig())
        print("✓ Initialized Simulated Telemetry Source")

    yield


app = FastAPI(
    title="Battery Intelligence Platform (BIP) API",
    description=(
        "Research-grade REST API and live telemetry WebSocket server for the "
        "Battery Intelligence Platform. Serves cross-chemistry degradation artifacts, "
        "embedded deployment registry, and real-time acquisition streaming."
    ),
    version="0.2.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configure CORS for local development and dashboard communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Research Dashboard Routers (Phase 1) ──────────────────────────────────
app.include_router(overview.router, prefix="/api/v1")
app.include_router(artifacts.router, prefix="/api/v1")
app.include_router(deployment.router, prefix="/api/v1")

# ── Live Hardware Telemetry Router (Phase 2) ───────────────────────────────
# REST:      GET /ws/v1/live/status   GET/POST /ws/v1/live/config
# WebSocket: WS  /ws/v1/live/telemetry
app.include_router(live_router.router, prefix="/ws/v1")


@app.get("/api")
@app.get("/api/health")
async def api_info():
    return {
        "platform": "Battery Intelligence Platform (BIP)",
        "status": "operational",
        "api_docs": "/docs",
        "version": "0.2.0",
        "research_api": "/api/v1",
        "live_api": "/ws/v1",
    }


# ── Mount Production Dashboard Build (if compiled) ─────────────────────────
dist_path = Path(__file__).resolve().parent.parent / "dashboard" / "dist"
if dist_path.exists() and (dist_path / "index.html").exists():
    app.mount("/", StaticFiles(directory=str(dist_path), html=True), name="dashboard_static")
else:
    @app.get("/")
    async def root_fallback():
        return {
            "platform": "Battery Intelligence Platform (BIP)",
            "status": "operational",
            "api_docs": "/docs",
            "version": "0.2.0",
            "research_api": "/api/v1",
            "live_api": "/ws/v1",
            "dashboard_status": "Vite dev server running at http://localhost:5173 or run 'npm run build' inside dashboard/ to serve statically.",
        }
