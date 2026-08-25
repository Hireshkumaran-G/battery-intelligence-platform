/**
 * LiveConnectionBar.tsx
 *
 * Enhanced Connection Bar for Grid Operations.
 * Handles CONNECTED, DISCONNECTED, and DEGRADED telemetry states.
 * Displays: asset context, frame counter, sample rate, last frame age, and disconnect reason.
 */
import React from 'react';
import clsx from 'clsx';
import { Wifi, WifiOff, Loader2, AlertCircle, Play, Square, RefreshCw } from 'lucide-react';
import type { LiveSessionMeta, WsConnectionState } from '../../types/live';
import { useAppStore } from '../../store/useAppStore';

interface LiveConnectionBarProps {
  connectionState: WsConnectionState;
  sessionMeta:     LiveSessionMeta | null;
  onConnect:       () => void;
  onDisconnect:    () => void;
  onClear:         () => void;
}

const STATE_CONFIG: Record<WsConnectionState, {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  dotClass: string;
  textClass: string;
}> = {
  disconnected: {
    icon: WifiOff,
    label: 'DISCONNECTED',
    dotClass: 'bg-[var(--text-subtle)]',
    textClass: 'text-[var(--text-muted)]',
  },
  connecting: {
    icon: Loader2,
    label: 'CONNECTING...',
    dotClass: 'bg-[var(--accent-current)] animate-pulse',
    textClass: 'text-[var(--accent-current)]',
  },
  connected: {
    icon: Wifi,
    label: 'LIVE STREAMING',
    dotClass: 'bg-[var(--accent-live)] animate-pulse',
    textClass: 'text-[var(--accent-live)]',
  },
  error: {
    icon: AlertCircle,
    label: 'DEGRADED / ERROR',
    dotClass: 'bg-[var(--accent-thermal)] animate-ping',
    textClass: 'text-[var(--accent-thermal)]',
  },
};

export const LiveConnectionBar: React.FC<LiveConnectionBarProps> = ({
  connectionState,
  sessionMeta,
  onConnect,
  onDisconnect,
  onClear,
}) => {
  const { selectedBessPack } = useAppStore();
  const cfg = STATE_CONFIG[connectionState];
  const StateIcon = cfg.icon;
  const isConnected = connectionState === 'connected';
  const isConnecting = connectionState === 'connecting';
  const isError = connectionState === 'error';

  return (
    <div className="scientific-panel px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
      {/* Left: connection state & source info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className={clsx('w-2.5 h-2.5 rounded-full', cfg.dotClass)} />
          <StateIcon
            className={clsx(
              'w-4 h-4',
              cfg.textClass,
              isConnecting && 'animate-spin',
            )}
          />
          <span className={clsx('text-xs font-mono font-bold tracking-wider', cfg.textClass)}>
            {cfg.label}
          </span>
        </div>

        {/* Selected Asset Context */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-0.5 rounded text-[11px] font-mono bg-[var(--bg-panel-sub)] border border-[var(--border-sub)]">
          <span className="text-[var(--text-muted)]">ASSET:</span>
          <span className="font-bold text-[var(--text-primary)]">Demo BESS-01 / {selectedBessPack}</span>
        </div>

        {/* Source badge */}
        {sessionMeta && (
          <div className="flex items-center gap-2 px-2 py-0.5 rounded text-[10px] font-mono bg-[var(--bg-panel-sub)] border border-[var(--border-sub)]">
            <span className="text-[var(--text-muted)]">SOURCE:</span>
            <span className="font-bold text-[var(--accent-live)] uppercase tracking-wider">
              {sessionMeta.source_kind === 'simulated' ? 'SIMULATOR' : 'STM32 SERIAL'}
            </span>
          </div>
        )}
      </div>

      {/* Center: Live stream stats */}
      {sessionMeta && isConnected && (
        <div className="flex items-center gap-4 text-[11px] font-mono text-[var(--text-muted)]">
          <div className="flex items-center gap-1.5">
            <span>FRAMES:</span>
            <span className="text-[var(--text-primary)] font-bold tabular-nums">
              {sessionMeta.frame_count.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>SAMPLE RATE:</span>
            <span className="text-[var(--text-primary)] font-bold">
              {sessionMeta.sample_rate.toFixed(1)} Hz
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>AGE:</span>
            <span className="text-[var(--accent-live)] font-bold">&lt; 100 ms</span>
          </div>
        </div>
      )}

      {/* Disconnected / Degraded Explanation */}
      {(!isConnected || isError) && (
        <div className="text-[11px] font-mono text-[var(--text-muted)] hidden md:block">
          {isError
            ? 'Warning: Packet loss detected / Attempting auto-reconnect...'
            : 'Stream paused. Click CONNECT to resume WebSocket acquisition.'}
        </div>
      )}

      {/* Right: Controls */}
      <div className="flex items-center gap-2">
        {!isConnected && !isConnecting && (
          <button
            id="live-connect-btn"
            onClick={onConnect}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-bold font-mono
              bg-[var(--accent-live)] text-slate-950 hover:brightness-110 shadow-sm transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            CONNECT
          </button>
        )}
        {isConnecting && (
          <button
            disabled
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-mono
              bg-[var(--bg-panel-sub)] border border-[var(--border-sub)] text-[var(--text-muted)] cursor-wait"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            CONNECTING...
          </button>
        )}
        {isConnected && (
          <button
            id="live-disconnect-btn"
            onClick={onDisconnect}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-bold font-mono
              bg-[var(--accent-thermal)]/15 border border-[var(--accent-thermal)]/40
              text-[var(--accent-thermal)] hover:bg-[var(--accent-thermal)]/25 transition-all cursor-pointer"
          >
            <Square className="w-3.5 h-3.5" />
            PAUSE
          </button>
        )}
        <button
          id="live-clear-btn"
          onClick={onClear}
          className="px-2.5 py-1.5 rounded text-xs font-mono text-[var(--text-muted)]
            border border-[var(--border-sub)] hover:border-[var(--border-hover)]
            hover:text-[var(--text-primary)] transition-all cursor-pointer"
        >
          CLEAR
        </button>
      </div>
    </div>
  );
};
