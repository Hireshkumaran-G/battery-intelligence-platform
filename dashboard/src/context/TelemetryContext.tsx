/**
 * dashboard/src/context/TelemetryContext.tsx
 *
 * Global Telemetry Context Provider.
 * Maintains ONE active WebSocket connection across all pages and workspaces.
 */

import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import { getLiveWsUrl } from '../api/live';
import type {
  LiveSessionMeta,
  SourceKind,
  TelemetryFrame,
  WsConnectionState,
} from '../types/live';

const RING_BUFFER_SIZE = 500;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_BASE_DELAY_MS = 1000;
const RECONNECT_MAX_DELAY_MS = 5000;

export interface TelemetryContextValue {
  frames: TelemetryFrame[];
  latest: TelemetryFrame | null;
  connectionState: WsConnectionState;
  sessionMeta: LiveSessionMeta | null;
  connect: () => void;
  disconnect: () => void;
  clearFrames: () => void;
}

const TelemetryContext = createContext<TelemetryContextValue | null>(null);

export const TelemetryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [frames, setFrames] = useState<TelemetryFrame[]>([]);
  const [latest, setLatest] = useState<TelemetryFrame | null>(null);
  const [connectionState, setConnectionState] = useState<WsConnectionState>('disconnected');
  const [sessionMeta, setSessionMeta] = useState<LiveSessionMeta | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempt = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frameCountRef = useRef(0);
  const sessionStartRef = useRef<string | null>(null);
  const shouldReconnectRef = useRef(true);

  const openConnection = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setConnectionState('connecting');
    const url = getLiveWsUrl();
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectAttempt.current = 0;
      frameCountRef.current = 0;
      sessionStartRef.current = new Date().toISOString();
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

        setSessionMeta({
          source_kind: frame.buffer_status === 'SIMULATED' ? 'simulated' : ('stm32_serial' as SourceKind),
          started_at_iso: sessionStartRef.current ?? new Date().toISOString(),
          frame_count: frameCountRef.current,
          sample_rate: frame.sample_rate,
        });
      } catch {
        // Skip invalid JSON
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

      const attempt = reconnectAttempt.current;
      if (attempt < MAX_RECONNECT_ATTEMPTS) {
        const delay = Math.min(
          RECONNECT_BASE_DELAY_MS * Math.pow(1.5, attempt),
          RECONNECT_MAX_DELAY_MS,
        );
        reconnectAttempt.current += 1;
        setConnectionState('connecting');
        reconnectTimerRef.current = setTimeout(() => {
          if (shouldReconnectRef.current) openConnection();
        }, delay);
      } else {
        setConnectionState('error');
      }
    };
  }, []);

  const connect = useCallback(() => {
    shouldReconnectRef.current = true;
    reconnectAttempt.current = 0;
    openConnection();
  }, [openConnection]);

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnect');
      wsRef.current = null;
    }
    setConnectionState('disconnected');
  }, []);

  const clearFrames = useCallback(() => {
    setFrames([]);
    setLatest(null);
    frameCountRef.current = 0;
  }, []);

  // Auto-connect on startup
  useEffect(() => {
    connect();
    return () => {
      shouldReconnectRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  return (
    <TelemetryContext.Provider
      value={{
        frames,
        latest,
        connectionState,
        sessionMeta,
        connect,
        disconnect,
        clearFrames,
      }}
    >
      {children}
    </TelemetryContext.Provider>
  );
};

export function useTelemetryStream(): TelemetryContextValue {
  const ctx = useContext(TelemetryContext);
  if (!ctx) {
    throw new Error('useTelemetryStream must be used within TelemetryProvider');
  }
  return ctx;
}
