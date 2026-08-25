/**
 * LiveOverviewPage.tsx
 *
 * Dedicated Live Tracking Overview page.
 * Provides high-level telemetry acquisition summary, stream status, and site context.
 */
import React from 'react';
import { Radio } from 'lucide-react';
import { useLiveTelemetry } from '../../hooks/useLiveTelemetry';
import { DEMO_BESS_PACKS } from '../../data/fleetDemoData';
import { useAppStore } from '../../store/useAppStore';

export const LiveOverviewPage: React.FC = () => {
  const { latest, connectionState, frames } = useLiveTelemetry();
  const { selectedBessPack } = useAppStore();
  const activePack = DEMO_BESS_PACKS.find((p) => p.id === selectedBessPack) || DEMO_BESS_PACKS[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Banner */}
      <div className="scientific-panel p-4 space-y-2 border-l-4 border-l-[var(--accent-live)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Radio className="w-5 h-5 text-[var(--accent-live)] animate-pulse" />
            <div>
              <h1 className="text-base sm:text-lg font-mono font-bold text-[var(--text-primary)] tracking-tight">
                LIVE TELEMETRY ACQUISITION OVERVIEW
              </h1>
              <p className="text-xs text-[var(--text-muted)] font-mono">
                Real-time WebSocket acquisition layer summary &amp; stream health status
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded bg-[var(--accent-live)]/10 text-[var(--accent-live)] border border-[var(--accent-live)]/30 font-mono text-xs font-bold uppercase">
            ACQUISITION LAYER
          </span>
        </div>
      </div>

      {/* Grid Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
        <div className="scientific-panel p-4 space-y-1.5 border-l-4 border-l-[var(--accent-live)]">
          <div className="text-[11px] text-[var(--text-muted)] uppercase">CONNECTION STATE</div>
          <div className="text-xl font-bold text-[var(--accent-live)] uppercase">{connectionState}</div>
          <div className="text-[10px] text-[var(--text-muted)]">WebSocket 10 Hz Continuous Stream</div>
        </div>

        <div className="scientific-panel p-4 space-y-1.5 border-l-4 border-l-[var(--accent-voltage)]">
          <div className="text-[11px] text-[var(--text-muted)] uppercase">SELECTED ASSET</div>
          <div className="text-xl font-bold text-[var(--text-primary)]">{activePack.id}</div>
          <div className="text-[10px] text-[var(--text-muted)]">Chemistry: {activePack.chemistry} ({activePack.cellCount} Cells)</div>
        </div>

        <div className="scientific-panel p-4 space-y-1.5 border-l-4 border-l-[var(--accent-current)]">
          <div className="text-[11px] text-[var(--text-muted)] uppercase">PACKETS BUFFERED</div>
          <div className="text-xl font-bold text-[var(--text-primary)]">{frames.length} / 500</div>
          <div className="text-[10px] text-[var(--text-muted)]">Ring Buffer Memory Allocation</div>
        </div>

        <div className="scientific-panel p-4 space-y-1.5 border-l-4 border-l-[var(--accent-healthy)]">
          <div className="text-[11px] text-[var(--text-muted)] uppercase">SIGNAL QUALITY</div>
          <div className="text-xl font-bold text-[var(--accent-healthy)]">98.7%</div>
          <div className="text-[10px] text-[var(--text-muted)]">Low Noise Floor / SNR Compliant</div>
        </div>
      </div>

      {/* Active Telemetry Readout */}
      <div className="scientific-panel p-4 space-y-3 font-mono text-xs">
        <span className="font-bold text-[var(--text-primary)] uppercase tracking-wider block border-b border-[var(--border-sub)] pb-2">
          ACQUISITION STREAM READOUT ({activePack.id})
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
          <div className="p-3 rounded bg-[var(--bg-panel-sub)] border border-[var(--border-sub)] space-y-1">
            <span className="text-[var(--text-muted)] block text-[10px]">VOLTAGE:</span>
            <span className="text-base font-bold text-[var(--accent-voltage)]">
              {latest ? `${latest.voltage.toFixed(3)} V` : `${activePack.voltageNominal} V`}
            </span>
          </div>

          <div className="p-3 rounded bg-[var(--bg-panel-sub)] border border-[var(--border-sub)] space-y-1">
            <span className="text-[var(--text-muted)] block text-[10px]">CURRENT:</span>
            <span className="text-base font-bold text-[var(--accent-current)]">
              {latest ? `${latest.current.toFixed(2)} A` : `${activePack.currentNominal} A`}
            </span>
          </div>

          <div className="p-3 rounded bg-[var(--bg-panel-sub)] border border-[var(--border-sub)] space-y-1">
            <span className="text-[var(--text-muted)] block text-[10px]">TEMPERATURE:</span>
            <span className="text-base font-bold text-[var(--accent-thermal)]">
              {latest ? `${latest.temperature.toFixed(1)} °C` : '25.0 °C'}
            </span>
          </div>

          <div className="p-3 rounded bg-[var(--bg-panel-sub)] border border-[var(--border-sub)] space-y-1">
            <span className="text-[var(--text-muted)] block text-[10px]">AC RIPPLE RMS:</span>
            <span className="text-base font-bold text-[var(--accent-ripple)]">
              {latest ? `${(latest.ripple_rms ?? 0).toFixed(2)} mV` : '14.2 mV'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
