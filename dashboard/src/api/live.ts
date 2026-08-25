/**
 * dashboard/src/api/live.ts
 *
 * API helpers for the live telemetry layer.
 * - fetchLiveStatus(): REST poll for source status
 * - getLiveWsUrl(): returns the correct WebSocket URL
 * - fetchSimConfig() / updateSimConfig(): simulator configuration
 */

import type { LiveStatusResponse, SimConfig } from '../types/live';

// ── WebSocket URL ─────────────────────────────────────────────────────────

/**
 * Returns the absolute WebSocket URL for the live telemetry stream.
 * Derives from VITE_API_URL or defaults to the Vite dev proxy.
 */
export function getLiveWsUrl(): string {
  const apiBase = import.meta.env.VITE_API_URL || '';
  // Convert http(s) → ws(s), or use window.location.host for proxied dev
  if (apiBase) {
    const wsBase = apiBase.replace(/^http/, 'ws').replace('/api/v1', '');
    return `${wsBase}/ws/v1/live/telemetry`;
  }
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${window.location.host}/ws/v1/live/telemetry`;
}

// ── REST: source status ───────────────────────────────────────────────────

/**
 * Fetch current live telemetry source status.
 * Safe to call from TanStack Query with a polling interval.
 *
 * Note: uses /ws/v1 prefix (not /api/v1) — different prefix from research API.
 */
export async function fetchLiveStatus(): Promise<LiveStatusResponse> {
  const BASE_WS_REST = import.meta.env.VITE_WS_API_URL || '/ws/v1';
  const url = `${BASE_WS_REST}/live/status`;
  const response = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
  if (!response.ok) throw new Error(`Live status error [${response.status}]`);
  return response.json() as Promise<LiveStatusResponse>;
}

// ── REST: simulator config ────────────────────────────────────────────────

export async function fetchSimConfig(): Promise<SimConfig> {
  const BASE_WS_REST = import.meta.env.VITE_WS_API_URL || '/ws/v1';
  const url = `${BASE_WS_REST}/live/config`;
  const response = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
  if (!response.ok) throw new Error(`Live config error [${response.status}]`);
  return response.json() as Promise<SimConfig>;
}

export async function updateSimConfig(config: Partial<SimConfig>): Promise<{ status: string }> {
  const BASE_WS_REST = import.meta.env.VITE_WS_API_URL || '/ws/v1';
  const url = `${BASE_WS_REST}/live/config`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!response.ok) throw new Error(`Config update error [${response.status}]`);
  return response.json() as Promise<{ status: string }>;
}
