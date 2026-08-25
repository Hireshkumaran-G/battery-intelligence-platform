"""
bip_api.schemas.live
────────────────────
Pydantic v2 response models for the live telemetry REST endpoints.
(The WebSocket endpoint streams TelemetryFrame directly from contract.py.)
"""
from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field

from bip_api.live.contract import SourceKind


class SourceInfoResponse(BaseModel):
    source_kind:   SourceKind      = Field(..., description="Active source type")
    is_streaming:  bool            = Field(..., description="Whether WS stream is active")
    sample_rate:   float           = Field(..., description="Configured sample rate (Hz)")
    started_at:    Optional[float] = Field(None, description="Unix epoch when stream started")
    frame_count:   int             = Field(..., description="Total frames emitted since start")
    description:   str             = Field(..., description="Human-readable source description")


class LiveStatusResponse(BaseModel):
    api_version:   str             = Field("ws/v1", description="Live API version prefix")
    ws_endpoint:   str             = Field("/ws/v1/live/telemetry", description="WebSocket URL path")
    source:        SourceInfoResponse
