/**
 * LiveDerivativePanel.tsx
 *
 * Displays dV/dt (voltage rate of change) in real time.
 */
import React from 'react';
import { TrendingUp } from 'lucide-react';
import type { TelemetryFrame } from '../../types/live';

interface LiveDerivativePanelProps {
  latest: TelemetryFrame | null;
}

export const LiveDerivativePanel: React.FC<LiveDerivativePanelProps> = ({ latest }) => {
  const dvDt = latest?.dV_dt;

  return (
    <div className="scientific-panel p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-3.5 h-3.5 text-[var(--accent-voltage)]" />
        <span className="text-xs font-mono font-semibold text-[var(--text-muted)] uppercase tracking-widest">
          Differential Kinetics (dV/dt)
        </span>
        <span className="ml-auto text-[10px] font-mono text-[var(--text-subtle)] italic">
          Rate of Voltage Change
        </span>
      </div>

      <div id="derivative-dv-dt" className="scientific-panel-sub p-3">
        <div className="text-[9px] font-mono uppercase tracking-widest text-[var(--text-muted)] mb-1.5">
          dV / dt
        </div>
        {dvDt !== null && dvDt !== undefined ? (
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-mono font-bold text-[var(--accent-voltage)] tabular-nums">
              {(dvDt * 1000).toFixed(4)}
            </span>
            <span className="text-[10px] font-mono text-[var(--text-subtle)]">mV/s</span>
            <span className="text-[10px] font-mono text-[var(--text-subtle)] ml-2">
              ({dvDt.toFixed(6)} V/s)
            </span>
          </div>
        ) : (
          <div className="text-xs font-mono text-[var(--text-subtle)] italic">Unavailable</div>
        )}
      </div>
    </div>
  );
};
