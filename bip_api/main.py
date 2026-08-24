from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from bip_api.config import CORS_ORIGINS
from bip_api.routers import overview, artifacts, deployment

app = FastAPI(
    title="Battery Intelligence Platform (BIP) API",
    description="Research-grade REST API for Battery Intelligence Platform degradation analysis, physics signatures, cross-chemistry benchmarks, and embedded deployment.",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS for local development and dashboard communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Phase 1 Routers under /api/v1
app.include_router(overview.router, prefix="/api/v1")
app.include_router(artifacts.router, prefix="/api/v1")
app.include_router(deployment.router, prefix="/api/v1")


@app.get("/")
async def root():
    return {
        "platform": "Battery Intelligence Platform (BIP)",
        "status": "operational",
        "api_docs": "/docs",
        "version": "0.1.0",
    }
