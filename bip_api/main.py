from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from bip_api.config import CORS_ORIGINS
from bip_api.live.simulator import SimConfig, SimulatedTelemetrySource
from bip_api.routers import overview, artifacts, deployment
from bip_api.routers import live as live_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan: initialise the active telemetry source at startup.

    Phase 1 (current): SimulatedTelemetrySource
    Phase 2 (future):  Replace with STM32SerialSource(port='/dev/ttyACM0')
                        — no other code changes required.
    """
    app.state.telemetry_source = SimulatedTelemetrySource(config=SimConfig())
    yield
    # Cleanup: nothing needed for the simulated source
    # Future: close serial port here for STM32SerialSource

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

# ── Research Dashboard Routers (Phase 1) — unchanged ──────────────────────
app.include_router(overview.router, prefix="/api/v1")
app.include_router(artifacts.router, prefix="/api/v1")
app.include_router(deployment.router, prefix="/api/v1")

# ── Live Hardware Telemetry Router (Phase 2) ───────────────────────────────
# REST:      GET /ws/v1/live/status   GET/POST /ws/v1/live/config
# WebSocket: WS  /ws/v1/live/telemetry
app.include_router(live_router.router, prefix="/ws/v1")


@app.get("/")
async def root():
    return {
        "platform": "Battery Intelligence Platform (BIP)",
        "status": "operational",
        "api_docs": "/docs",
        "version": "0.2.0",
        "research_api": "/api/v1",
        "live_api": "/ws/v1",
    }
