/**
 * LiveSpectralPanel.tsx
 *
 * Displays frequency-domain derived quantities: dominant_frequency and fft_energy.
 * Null values display "Unavailable".
 */
import React from 'react';
import { BarChart2 } from 'lucide-react';
import type { TelemetryFrame } from '../../types/live';

interface LiveSpectralPanelProps {
  latest: TelemetryFrame | null;
}

export const LiveSpectralPanel: React.FC<LiveSpectralPanelProps> = ({ latest }) => {
  const domFreq = latest?.dominant_frequency;
  const fftEnergy = latest?.fft_energy;

  return (
    <div className="scientific-panel p-4">
      <div className="flex items-center gap-2 mb-3">
        <BarChart2 className="w-3.5 h-3.5 text-[var(--accent-model)]" />
        <span className="text-xs font-mono font-semibold text-[var(--text-muted)] uppercase tracking-widest">
          Spectral / Frequency Analysis
        </span>
        <span className="ml-auto text-[10px] font-mono text-[var(--text-subtle)] italic">
          FFT Derived Quantities
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <div id="spectral-freq" className="scientific-panel-sub p-3 flex-1 min-w-[120px]">
          <div className="text-[9px] font-mono uppercase tracking-widest text-[var(--text-muted)] mb-1.5">
            Dominant Frequency
          </div>
          {domFreq !== null && domFreq !== undefined ? (
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-mono font-bold text-[var(--accent-model)] tabular-nums">
                {domFreq.toFixed(3)}
              </span>
              <span className="text-[10px] font-mono text-[var(--text-subtle)]">Hz</span>
            </div>
          ) : (
            <div className="text-xs font-mono text-[var(--text-subtle)] italic">Unavailable</div>
          )}
        </div>

        <div id="spectral-energy" className="scientific-panel-sub p-3 flex-1 min-w-[120px]">
          <div className="text-[9px] font-mono uppercase tracking-widest text-[var(--text-muted)] mb-1.5">
            FFT Energy
          </div>
          {fftEnergy !== null && fftEnergy !== undefined ? (
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-mono font-bold text-[var(--accent-model)] tabular-nums">
                {fftEnergy.toExponential(4)}
              </span>
              <span className="text-[10px] font-mono text-[var(--text-subtle)]">V²</span>
            </div>
          ) : (
            <div className="text-xs font-mono text-[var(--text-subtle)] italic">Unavailable</div>
          )}
        </div>
      </div>
    </div>
  );
};
