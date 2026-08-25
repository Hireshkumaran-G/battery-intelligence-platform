"""
bip_api.live.contract
─────────────────────
Defines the shared telemetry contract between all data sources
(simulated or real hardware) and the WebSocket streaming layer.

Design rules:
  - TelemetryFrame contains ONLY acquisition/derived signal quantities.
  - No SOH, RUL, confidence intervals, or degradation predictions.
  - Optional fields must be None (not 0.0) when unavailable.
  - The TelemetrySource ABC is the integration seam for future STM32
    serial source: implement stream() → same TelemetryFrame, zero
    changes needed downstream.
"""

from __future__ import annotations

import time
from abc import ABC, abstractmethod
from enum import Enum
from typing import AsyncGenerator, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Buffer status literals
# ---------------------------------------------------------------------------

class BufferStatus(str, Enum):
    READY = "READY"
    OVERFLOW = "OVERFLOW"
    STALE = "STALE"
    SIMULATED = "SIMULATED"   # Always set by SimulatedTelemetrySource


# ---------------------------------------------------------------------------
# Primary acquisition contract
# ---------------------------------------------------------------------------

class TelemetryFrame(BaseModel):
    """
    Single acquisition frame. Shared by all TelemetrySource implementations.

    Acquisition quantities:
        timestamp, sequence_number, voltage, current, temperature,
        sample_rate, buffer_status

    Derived signal quantities (None when not yet computable):
        ripple_rms, ripple_peak, dominant_frequency, fft_energy, snr, dV_dt

    EXPLICITLY ABSENT (by design):
        SOH, RUL, capacity, confidence_interval, degradation_*
    """
    # ── Metadata ───────────────────────────────────────────────────────────
    timestamp:        float = Field(..., description="Unix epoch seconds (UTC)")
    sequence_number:  int   = Field(..., description="Monotonically increasing frame counter")

    # ── Primary electrical signals ─────────────────────────────────────────
    voltage:          float = Field(..., description="Terminal voltage (V)")
    current:          float = Field(..., description="Current (A); discharge convention: negative")
    temperature:      float = Field(..., description="Cell/ambient temperature (°C)")

    # ── Acquisition context ────────────────────────────────────────────────
    sample_rate:      float        = Field(..., description="Effective sample rate (Hz)")
    buffer_status:    BufferStatus = Field(..., description="ADC buffer health")

    # ── Derived signal quantities ──────────────────────────────────────────
    ripple_rms:         Optional[float] = Field(None, description="RMS of detrended residual (V)")
    ripple_peak:        Optional[float] = Field(None, description="Peak ripple magnitude (V)")
    dominant_frequency: Optional[float] = Field(None, description="Dominant FFT bin frequency (Hz)")
    fft_energy:         Optional[float] = Field(None, description="Summed spectral energy (V²)")
    snr:                Optional[float] = Field(None, description="Signal-to-noise ratio (dB)")
    dV_dt:              Optional[float] = Field(None, description="Voltage rate of change (V/s)")


# ---------------------------------------------------------------------------
# Source status
# ---------------------------------------------------------------------------

class SourceKind(str, Enum):
    SIMULATED   = "simulated"
    STM32_SERIAL = "stm32_serial"   # Reserved for future hardware source


class SourceStatus(BaseModel):
    source_kind:   SourceKind = Field(..., description="Active telemetry source type")
    is_streaming:  bool       = Field(False, description="Whether the source is currently active")
    sample_rate:   float      = Field(..., description="Configured sample rate (Hz)")
    started_at:    Optional[float] = Field(None, description="Unix epoch when streaming started")
    frame_count:   int        = Field(0, description="Total frames emitted since start")
    description:   str        = Field("", description="Human-readable source description")


# ---------------------------------------------------------------------------
# Abstract source interface
# ---------------------------------------------------------------------------

class TelemetrySource(ABC):
    """
    Abstract base for all telemetry providers.

    To add a new source (e.g., STM32SerialSource):
      1. Subclass TelemetrySource
      2. Implement stream() → yields TelemetryFrame
      3. Implement get_status() → returns SourceStatus
      4. Assign to app.state.telemetry_source in main.py lifespan

    The WebSocket handler and all React components require zero modification.
    """

    @abstractmethod
    async def stream(self) -> AsyncGenerator[TelemetryFrame, None]:
        """Yield TelemetryFrame instances at the configured sample rate."""
        ...  # pragma: no cover

    @abstractmethod
    async def get_status(self) -> SourceStatus:
        """Return current source status snapshot."""
        ...  # pragma: no cover
