"""
bip_api.routers.live
────────────────────
Live hardware telemetry endpoints.

Routes:
  GET /ws/v1/live/status          → LiveStatusResponse (JSON, REST)
  WS  /ws/v1/live/telemetry       → streams TelemetryFrame JSON at sample_rate Hz
  GET /ws/v1/live/config          → current SimConfig (for UI sliders)
  POST /ws/v1/live/config         → update sim config at runtime

The WebSocket handler is deliberately source-agnostic:
  - It only calls app.state.telemetry_source.stream()
  - Switching to STM32SerialSource requires no changes here
"""
from __future__ import annotations

import asyncio
import logging

from fastapi import APIRouter, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse

from bip_api.live.contract import TelemetrySource
from bip_api.live.simulator import SimConfig
from bip_api.schemas.live import LiveStatusResponse, SourceInfoResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="", tags=["Live Telemetry"])


# ---------------------------------------------------------------------------
# Helper: retrieve source from app state
# ---------------------------------------------------------------------------

def _get_source(request: Request) -> TelemetrySource:
    return request.app.state.telemetry_source


# ---------------------------------------------------------------------------
# REST: status
# ---------------------------------------------------------------------------

@router.get("/live/status", response_model=LiveStatusResponse)
async def get_live_status(request: Request):
    """
    Returns current live telemetry source status.
    Safe to poll from the frontend (Topbar health indicator).
    """
    source = _get_source(request)
    status = await source.get_status()

    return LiveStatusResponse(
        api_version="ws/v1",
        ws_endpoint="/ws/v1/live/telemetry",
        source=SourceInfoResponse(
            source_kind=status.source_kind,
            is_streaming=status.is_streaming,
            sample_rate=status.sample_rate,
            started_at=status.started_at,
            frame_count=status.frame_count,
            description=status.description,
        ),
    )


# ---------------------------------------------------------------------------
# REST: read simulator config
# ---------------------------------------------------------------------------

@router.get("/live/config")
async def get_live_config(request: Request):
    """
    Returns current SimConfig (sample_rate, signal parameters).
    Used by the live dashboard UI to populate sliders.
    """
    source = _get_source(request)
    # Only SimulatedTelemetrySource has a .config attribute
    if hasattr(source, "config") and isinstance(source.config, SimConfig):
        return source.config.model_dump()
    return JSONResponse(
        status_code=200,
        content={"message": "Config not applicable for this source type."},
    )


# ---------------------------------------------------------------------------
# REST: update simulator config
# ---------------------------------------------------------------------------

@router.post("/live/config")
async def update_live_config(request: Request, config: SimConfig):
    """
    Updates SimConfig at runtime.
    New sample_rate takes effect on the NEXT WebSocket connection
    (current connection continues at old rate until client reconnects).
    """
    source = _get_source(request)
    if hasattr(source, "config") and isinstance(source.config, SimConfig):
        source.config = config
        logger.info("SimConfig updated: sample_rate=%.1f Hz", config.sample_rate_hz)
        return {"status": "updated", "new_config": config.model_dump()}
    return JSONResponse(
        status_code=400,
        content={"error": "Config updates only supported for SimulatedTelemetrySource."},
    )


# ---------------------------------------------------------------------------
# WebSocket: live telemetry stream
# ---------------------------------------------------------------------------

@router.websocket("/live/telemetry")
async def websocket_telemetry(websocket: WebSocket):

    """
    WebSocket endpoint that streams TelemetryFrame JSON at sample_rate Hz.

    Client connect → server begins streaming → client disconnect → server stops.

    Frame format: JSON-serialized TelemetryFrame (see bip_api.live.contract).
    No authentication required in development phase.
    """
    await websocket.accept()
    logger.info("Live telemetry WS: client connected from %s", websocket.client)

    source = websocket.app.state.telemetry_source

    try:
        async for frame in source.stream():
            payload = frame.model_dump_json()
            await websocket.send_text(payload)
    except WebSocketDisconnect:
        logger.info("Live telemetry WS: client disconnected cleanly")
    except asyncio.CancelledError:
        logger.info("Live telemetry WS: stream task cancelled")
    except Exception as exc:
        logger.error("Live telemetry WS: unexpected error — %s", exc, exc_info=True)
        try:
            await websocket.close(code=1011)
        except Exception:
            pass
    finally:
        logger.info("Live telemetry WS: connection closed")
