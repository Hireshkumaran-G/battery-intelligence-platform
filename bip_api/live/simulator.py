"""
bip_api.live.simulator
──────────────────────
SimulatedTelemetrySource — software-only telemetry source for
development and testing without physical hardware.

Signal model:
  - voltage:     nominal + slow sinusoidal drift + Gaussian noise
  - current:     constant discharge + small noise
  - temperature: base + slow thermal ramp
  - ripple_rms:  RMS of a synthetic sinusoidal ripple overlaid on voltage
  - ripple_peak: peak of the same synthetic ripple
  - snr:         ratio of signal variance to noise variance (dB)
  - dV_dt:       numerical derivative of last two voltage samples
  - dominant_frequency: frequency of the synthetic ripple carrier
  - fft_energy:  sum of squared FFT magnitudes of a small synthetic buffer

CRITICAL: This simulator contains NO electrochemical model.
  - No SOH, no capacity fade, no RUL, no degradation curve.
  - The slow drift is purely a sinusoidal oscillation for visual
    interest in the live chart — it does NOT model real aging.
  - All quantities are labeled SIMULATED in the buffer_status field.
"""

from __future__ import annotations

import asyncio
import math
import random
import time
from typing import AsyncGenerator

from pydantic import BaseModel, Field

from bip_api.live.contract import (
    BufferStatus,
    SourceKind,
    SourceStatus,
    TelemetryFrame,
    TelemetrySource,
)


# ---------------------------------------------------------------------------
# Simulator configuration
# ---------------------------------------------------------------------------

class SimConfig(BaseModel):
    """
    Configuration for SimulatedTelemetrySource.
    All values are acquisition / signal parameters only.
    """
    sample_rate_hz:        float = Field(10.0,  ge=0.1, le=1000.0, description="Output frame rate (Hz)")
    voltage_nominal:       float = Field(3.65,  description="Nominal terminal voltage (V) — LFP-representative")
    voltage_drift_amp:     float = Field(0.08,  description="Amplitude of slow sinusoidal voltage drift (V)")
    voltage_drift_period:  float = Field(60.0,  description="Period of slow voltage oscillation (s)")
    voltage_noise_sigma:   float = Field(0.004, description="Gaussian noise σ on voltage (V)")
    current_nominal:       float = Field(-1.0,  description="Nominal current (A); negative = discharge")
    current_noise_sigma:   float = Field(0.005, description="Gaussian noise σ on current (A)")
    temperature_base:      float = Field(25.0,  description="Base ambient temperature (°C)")
    temperature_drift_amp: float = Field(3.0,   description="Slow thermal excursion amplitude (°C)")
    temperature_period:    float = Field(120.0, description="Period of thermal oscillation (s)")
    ripple_freq_hz:        float = Field(1.2,   description="Synthetic ripple carrier frequency (Hz)")
    ripple_amplitude:      float = Field(0.015, description="Synthetic ripple peak amplitude (V)")
    fft_buffer_size:       int   = Field(64,    ge=16, le=1024, description="Buffer size for FFT computation")


# ---------------------------------------------------------------------------
# Simulator implementation
# ---------------------------------------------------------------------------

class SimulatedTelemetrySource(TelemetrySource):
    """
    Software-only telemetry source that generates synthetic acquisition frames.

    Usage:
        source = SimulatedTelemetrySource(config=SimConfig())
        async for frame in source.stream():
            # frame is a valid TelemetryFrame

    Future replacement path:
        Replace this with STM32SerialSource(port='/dev/ttyACM0')
        No other code changes required.
    """

    def __init__(self, config: SimConfig | None = None) -> None:
        self.config       = config or SimConfig()
        self._frame_count = 0
        self._started_at: float | None = None
        self._is_streaming = False
        self._v_buffer: list[float] = []   # Rolling voltage buffer for FFT

    # ------------------------------------------------------------------
    # TelemetrySource interface
    # ------------------------------------------------------------------

    async def stream(self) -> AsyncGenerator[TelemetryFrame, None]:
        """
        Yield TelemetryFrame at config.sample_rate_hz.
        Runs indefinitely until the caller disconnects / cancels.
        """
        self._started_at  = time.time()
        self._is_streaming = True
        self._frame_count  = 0
        self._v_buffer     = []

        interval = 1.0 / self.config.sample_rate_hz

        try:
            while True:
                t_now = time.time()
                elapsed = t_now - self._started_at

                frame = self._generate_frame(self._frame_count, elapsed, t_now)
                self._frame_count += 1

                yield frame

                await asyncio.sleep(interval)
        finally:
            self._is_streaming = False

    async def get_status(self) -> SourceStatus:
        return SourceStatus(
            source_kind=SourceKind.SIMULATED,
            is_streaming=self._is_streaming,
            sample_rate=self.config.sample_rate_hz,
            started_at=self._started_at,
            frame_count=self._frame_count,
            description=(
                f"SimulatedTelemetrySource @ {self.config.sample_rate_hz:.1f} Hz — "
                f"no real hardware connected"
            ),
        )

    # ------------------------------------------------------------------
    # Internal signal generation
    # ------------------------------------------------------------------

    def _generate_frame(self, seq: int, elapsed: float, timestamp: float) -> TelemetryFrame:
        cfg = self.config

        # ── Voltage ───────────────────────────────────────────────────
        v_drift = cfg.voltage_drift_amp * math.sin(
            2 * math.pi * elapsed / cfg.voltage_drift_period
        )
        v_noise = random.gauss(0.0, cfg.voltage_noise_sigma)
        v_ripple = cfg.ripple_amplitude * math.sin(
            2 * math.pi * cfg.ripple_freq_hz * elapsed
        )
        voltage = cfg.voltage_nominal + v_drift + v_ripple + v_noise

        # ── Current ───────────────────────────────────────────────────
        current = cfg.current_nominal + random.gauss(0.0, cfg.current_noise_sigma)

        # ── Temperature ───────────────────────────────────────────────
        t_drift = cfg.temperature_drift_amp * math.sin(
            2 * math.pi * elapsed / cfg.temperature_period
        )
        temperature = cfg.temperature_base + t_drift + random.gauss(0.0, 0.1)

        # ── Rolling voltage buffer ─────────────────────────────────────
        self._v_buffer.append(voltage)
        if len(self._v_buffer) > cfg.fft_buffer_size:
            self._v_buffer.pop(0)

        # ── dV/dt ─────────────────────────────────────────────────────
        dv_dt: float | None = None
        if len(self._v_buffer) >= 2:
            dt = 1.0 / cfg.sample_rate_hz
            dv_dt = (self._v_buffer[-1] - self._v_buffer[-2]) / dt

        # ── Ripple quantities (from known synthetic signal) ────────────
        ripple_rms  = cfg.ripple_amplitude / math.sqrt(2.0)   # RMS of a pure sine
        ripple_peak = cfg.ripple_amplitude

        # ── FFT-derived quantities ─────────────────────────────────────
        dominant_frequency: float | None = None
        fft_energy: float | None = None
        snr: float | None = None

        buf_len = len(self._v_buffer)
        if buf_len >= cfg.fft_buffer_size:
            buf = self._v_buffer[:]
            n = len(buf)

            # Simple DFT magnitude (no scipy dependency in runtime path)
            freqs = [k * cfg.sample_rate_hz / n for k in range(n // 2)]
            magnitudes = []
            for k in range(n // 2):
                re = sum(buf[j] * math.cos(2 * math.pi * k * j / n) for j in range(n))
                im = sum(buf[j] * math.sin(2 * math.pi * k * j / n) for j in range(n))
                magnitudes.append(math.sqrt(re * re + im * im) / n)

            if magnitudes:
                max_idx = max(range(len(magnitudes)), key=lambda i: magnitudes[i])
                dominant_frequency = freqs[max_idx] if max_idx < len(freqs) else None
                fft_energy = sum(m * m for m in magnitudes)

                # SNR: power in ripple carrier bin vs. total noise power
                carrier_bin = round(cfg.ripple_freq_hz * n / cfg.sample_rate_hz)
                if 0 < carrier_bin < len(magnitudes):
                    signal_power = magnitudes[carrier_bin] ** 2
                    noise_power  = max(
                        fft_energy - signal_power,
                        1e-12,  # guard against zero division
                    )
                    snr = 10 * math.log10(signal_power / noise_power) if signal_power > 0 else None

        return TelemetryFrame(
            timestamp=timestamp,
            sequence_number=seq,
            voltage=round(voltage, 6),
            current=round(current, 6),
            temperature=round(temperature, 4),
            sample_rate=cfg.sample_rate_hz,
            buffer_status=BufferStatus.SIMULATED,
            ripple_rms=round(ripple_rms, 6),
            ripple_peak=round(ripple_peak, 6),
            dominant_frequency=round(dominant_frequency, 4) if dominant_frequency is not None else None,
            fft_energy=round(fft_energy, 8) if fft_energy is not None else None,
            snr=round(snr, 3) if snr is not None else None,
            dV_dt=round(dv_dt, 6) if dv_dt is not None else None,
        )
