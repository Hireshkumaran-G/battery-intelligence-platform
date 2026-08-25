/**
 * LiveRipplePanel.tsx
 *
 * Displays ripple acquisition quantities: ripple_rms, ripple_peak, snr.
 * These are signal analysis quantities — NOT degradation predictions.
 *
 * Null values display "Unavailable" with explicit explanation.
 * This panel never displays SOH, RUL, or degradation estimates.
 */
import React from 'react';
import { Activity } from 'lucide-react';
import type { TelemetryFrame } from '../../types/live';

interface RippleMetricProps {
  id:       string;
  label:    string;
  unit:     string;
  value:    number | null | undefined;
  decimals: number;
}

const RippleMetric: React.FC<RippleMetricProps> = ({ id, label, unit, value, decimals }) => (
  <div id={id} className="scientific-panel-sub p-3 flex-1 min-w-[100px]">
    <div className="text-[9px] font-mono uppercase tracking-widest text-[var(--text-muted)] mb-1.5">
      {label}
    </div>
    {value !== null && value !== undefined ? (
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-mono font-bold text-[var(--accent-ripple)] tabular-nums">
          {value.toFixed(decimals)}
        </span>
        <span className="text-[10px] font-mono text-[var(--text-subtle)]">{unit}</span>
      </div>
    ) : (
      <div className="text-xs font-mono text-[var(--text-subtle)] italic">Unavailable</div>
    )}
  </div>
);

interface LiveRipplePanelProps {
  latest: TelemetryFrame | null;
  frames: TelemetryFrame[];
}

export const LiveRipplePanel: React.FC<LiveRipplePanelProps> = ({ latest, frames }) => {
  const rippleHistory = frames.slice(-100).map((f) => f.ripple_rms).filter((v) => v !== null) as number[];
  const rippleMin = rippleHistory.length ? Math.min(...rippleHistory) : null;
  const rippleMax = rippleHistory.length ? Math.max(...rippleHistory) : null;

  return (
    <div className="scientific-panel p-4">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-3.5 h-3.5 text-[var(--accent-ripple)]" />
        <span className="text-xs font-mono font-semibold text-[var(--text-muted)] uppercase tracking-widest">
          Ripple / Dynamic Signal
        </span>
        <span className="ml-auto text-[10px] font-mono text-[var(--text-subtle)] italic">
          Acquisition quantities only
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <RippleMetric
          id="ripple-rms"
          label="Ripple RMS"
          unit="V"
          value={latest?.ripple_rms}
          decimals={5}
        />
        <RippleMetric
          id="ripple-peak"
          label="Ripple Peak"
          unit="V"
          value={latest?.ripple_peak}
          decimals={5}
        />
        <RippleMetric
          id="ripple-snr"
          label="SNR"
          unit="dB"
          value={latest?.snr}
          decimals={2}
        />
      </div>

      {/* Last-100 frame range display */}
      {rippleHistory.length > 0 && (
        <div className="scientific-panel-sub px-3 py-2 flex items-center justify-between text-[10px] font-mono text-[var(--text-subtle)]">
          <span>ripple_rms (last 100 frames):</span>
          <span>
            min <span className="text-[var(--accent-ripple)] font-semibold">{rippleMin?.toFixed(5)}</span>
            {'  '}max <span className="text-[var(--accent-ripple)] font-semibold">{rippleMax?.toFixed(5)}</span>
            {'  '}V
          </span>
        </div>
      )}
    </div>
  );
};
