/**
 * dashboard/src/hooks/useLiveTelemetry.ts
 *
 * WebSocket hook for live telemetry streaming.
 *
 * Features:
 *  - Ring-buffer of last RING_BUFFER_SIZE frames
 *  - Exponential backoff auto-reconnect (3 attempts, max 8 s)
 *  - Clean disconnect on unmount / explicit disconnect()
 *  - Exposes connection state, latest frame, and session metadata
 *
 * Usage:
 *   const { frames, latest, connectionState, connect, disconnect } = useLiveTelemetry();
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { getLiveWsUrl } from '../api/live';
import type {
  LiveSessionMeta,
  SourceKind,
  TelemetryFrame,
  WsConnectionState,
} from '../types/live';

// ── Constants ─────────────────────────────────────────────────────────────

const RING_BUFFER_SIZE = 500;
const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_BASE_DELAY_MS = 1000;
const RECONNECT_MAX_DELAY_MS = 8000;

// ── Hook ──────────────────────────────────────────────────────────────────

export interface UseLiveTelemetryResult {
  frames:          TelemetryFrame[];
  latest:          TelemetryFrame | null;
  connectionState: WsConnectionState;
  sessionMeta:     LiveSessionMeta | null;
  connect:         () => void;
  disconnect:      () => void;
  clearFrames:     () => void;
}

export function useLiveTelemetry(): UseLiveTelemetryResult {
  const [frames, setFrames]               = useState<TelemetryFrame[]>([]);
  const [latest, setLatest]               = useState<TelemetryFrame | null>(null);
  const [connectionState, setConnectionState] = useState<WsConnectionState>('disconnected');
  const [sessionMeta, setSessionMeta]     = useState<LiveSessionMeta | null>(null);

  const wsRef               = useRef<WebSocket | null>(null);
  const reconnectAttempt    = useRef(0);
  const reconnectTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frameCountRef       = useRef(0);
  const sessionStartRef     = useRef<string | null>(null);
  const shouldReconnectRef  = useRef(false);

  // ── Core connect logic ─────────────────────────────────────────────────

  const openConnection = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setConnectionState('connecting');
    const url = getLiveWsUrl();
    const ws  = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectAttempt.current  = 0;
      frameCountRef.current     = 0;
      sessionStartRef.current   = new Date().toISOString();
      setConnectionState('connected');
    };

    ws.onmessage = (event: MessageEvent<string>) => {
      try {
        const frame = JSON.parse(event.data) as TelemetryFrame;
        frameCountRef.current += 1;

        setLatest(frame);
        setFrames((prev) => {
          const next = [...prev, frame];
          return next.length > RING_BUFFER_SIZE
            ? next.slice(next.length - RING_BUFFER_SIZE)
            : next;
        });

        // Keep sessionMeta in sync
        setSessionMeta({
          source_kind:    frame.buffer_status === 'SIMULATED' ? 'simulated' : 'stm32_serial' as SourceKind,
          started_at_iso: sessionStartRef.current ?? new Date().toISOString(),
          frame_count:    frameCountRef.current,
          sample_rate:    frame.sample_rate,
        });
      } catch {
        // Malformed frame — skip silently
      }
    };

    ws.onerror = () => {
      setConnectionState('error');
    };

    ws.onclose = () => {
      wsRef.current = null;
      if (!shouldReconnectRef.current) {
        setConnectionState('disconnected');
        return;
      }

      // Attempt reconnect with exponential backoff
      const attempt = reconnectAttempt.current;
      if (attempt < MAX_RECONNECT_ATTEMPTS) {
        const delay = Math.min(
          RECONNECT_BASE_DELAY_MS * Math.pow(2, attempt),
          RECONNECT_MAX_DELAY_MS,
        );
        reconnectAttempt.current += 1;
        setConnectionState('connecting');
        reconnectTimerRef.current = setTimeout(() => {
          if (shouldReconnectRef.current) openConnection();
        }, delay);
      } else {
        setConnectionState('error');
        shouldReconnectRef.current = false;
      }
    };
  }, []);

  // ── Public API ─────────────────────────────────────────────────────────

  const connect = useCallback(() => {
    shouldReconnectRef.current  = true;
    reconnectAttempt.current    = 0;
    openConnection();
  }, [openConnection]);

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnected');
      wsRef.current = null;
    }
    setConnectionState('disconnected');
  }, []);

  const clearFrames = useCallback(() => {
    setFrames([]);
    setLatest(null);
    frameCountRef.current = 0;
  }, []);

  // ── Cleanup on unmount ─────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      shouldReconnectRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounted');
        wsRef.current = null;
      }
    };
  }, []);

  return { frames, latest, connectionState, sessionMeta, connect, disconnect, clearFrames };
}
