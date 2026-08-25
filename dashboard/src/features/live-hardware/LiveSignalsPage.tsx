/**
 * LiveSignalsPage.tsx
 *
 * Dedicated Live Signal Analysis view.
 * Integrates Vital Panel, Dynamic AC Ripple Analysis, Spectral FFT Density, and Differential Kinetics (dV/dt).
 */
import React from 'react';
import { Zap } from 'lucide-react';
import { useLiveTelemetry } from '../../hooks/useLiveTelemetry';
import { LiveVitalPanel } from './LiveVitalPanel';
import { LiveRipplePanel } from './LiveRipplePanel';
import { LiveSpectralPanel } from './LiveSpectralPanel';
import { LiveDerivativePanel } from './LiveDerivativePanel';

export const LiveSignalsPage: React.FC = () => {
  const { latest, frames } = useLiveTelemetry();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="scientific-panel p-4 space-y-2 border-l-4 border-l-[var(--accent-ripple)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Zap className="w-5 h-5 text-[var(--accent-ripple)]" />
            <div>
              <h1 className="text-base sm:text-lg font-mono font-bold text-[var(--text-primary)] tracking-tight">
                HIGH-RESOLUTION SIGNAL ANALYSIS
              </h1>
              <p className="text-xs text-[var(--text-muted)] font-mono">
                AC Ripple, FFT spectral density decomposition, and differential dV/dt kinetics workbench
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded bg-[var(--accent-ripple)]/10 text-[var(--accent-ripple)] border border-[var(--accent-ripple)]/30 font-mono text-xs font-bold uppercase">
            SIGNAL PROCESSING
          </span>
        </div>
      </div>

      {/* Vital Electrical Signals */}
      <LiveVitalPanel latest={latest} />

      {/* Derived Quantities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <LiveRipplePanel latest={latest} frames={frames} />
        <LiveSpectralPanel latest={latest} />
        <LiveDerivativePanel latest={latest} />
      </div>
    </div>
  );
};
