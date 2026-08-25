/**
 * dashboard/src/types/live.ts
 *
 * TypeScript contract for live telemetry streaming.
 * Mirrors bip_api/live/contract.py TelemetryFrame exactly.
 *
 * IMPORTANT: No SOH, RUL, capacity, or degradation fields.
 * Optional fields are null (not 0) when unavailable — components
 * must always display "Unavailable" rather than showing 0.
 */

// ── Acquisition buffer status ─────────────────────────────────────────────

export type BufferStatus = 'READY' | 'OVERFLOW' | 'STALE' | 'SIMULATED';

// ── Primary telemetry frame (1:1 with Python TelemetryFrame) ─────────────

export interface TelemetryFrame {
  // Metadata
  timestamp: number;           // Unix epoch seconds (UTC)
  sequence_number: number;     // Monotonically increasing

  // Primary electrical signals
  voltage: number;             // V
  current: number;             // A (discharge: negative)
  temperature: number;         // °C

  // Acquisition context
  sample_rate: number;         // Hz
  buffer_status: BufferStatus;

  // Derived signal quantities — null when not yet computable
  ripple_rms:         number | null;  // V  — RMS of detrended residual
  ripple_peak:        number | null;  // V  — peak ripple magnitude
  dominant_frequency: number | null;  // Hz — dominant FFT bin
  fft_energy:         number | null;  // V² — summed spectral energy
  snr:                number | null;  // dB — signal-to-noise ratio
  dV_dt:              number | null;  // V/s — voltage rate of change
}

// ── WebSocket connection lifecycle ────────────────────────────────────────

export type WsConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

// ── Source kind ───────────────────────────────────────────────────────────

export type SourceKind = 'simulated' | 'stm32_serial';

// ── Live REST status response ─────────────────────────────────────────────

export interface SourceInfoResponse {
  source_kind:  SourceKind;
  is_streaming: boolean;
  sample_rate:  number;
  started_at:   number | null;  // Unix epoch
  frame_count:  number;
  description:  string;
}

export interface LiveStatusResponse {
  api_version:  string;
  ws_endpoint:  string;
  source:       SourceInfoResponse;
}

// ── Live session meta (derived by the hook) ───────────────────────────────

export interface LiveSessionMeta {
  source_kind:   SourceKind;
  started_at_iso: string;     // ISO 8601
  frame_count:   number;
  sample_rate:   number;
}

// ── Simulator config (mirrors SimConfig Pydantic model) ───────────────────

export interface SimConfig {
  sample_rate_hz:        number;
  voltage_nominal:       number;
  voltage_drift_amp:     number;
  voltage_drift_period:  number;
  voltage_noise_sigma:   number;
  current_nominal:       number;
  current_noise_sigma:   number;
  temperature_base:      number;
  temperature_drift_amp: number;
  temperature_period:    number;
  ripple_freq_hz:        number;
  ripple_amplitude:      number;
  fft_buffer_size:       number;
}
