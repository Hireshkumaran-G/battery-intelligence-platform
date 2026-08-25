/**
 * AssetDetailsPage.tsx
 *
 * Dedicated Single BESS Asset Deep-Dive Inspector page.
 * Deep-dive profile for a selected BESS pack (Overview, Telemetry, Health, Events).
 */
import React from 'react';
import { HardDrive } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { DEMO_BESS_PACKS, DEMO_FLEET_EVENTS } from '../../data/fleetDemoData';

export const AssetDetailsPage: React.FC = () => {
  const { selectedBessPack, setSelectedBessPack } = useAppStore();
  const pack = DEMO_BESS_PACKS.find((p) => p.id === selectedBessPack) || DEMO_BESS_PACKS[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Banner */}
      <div className="scientific-panel p-4 space-y-2 border-l-4 border-l-[var(--accent-voltage)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <HardDrive className="w-5 h-5 text-[var(--accent-voltage)]" />
            <div>
              <h1 className="text-base sm:text-lg font-mono font-bold text-[var(--text-primary)] tracking-tight">
                ASSET DEEP-DIVE INSPECTOR: {pack.id}
              </h1>
              <p className="text-xs text-[var(--text-muted)] font-mono">
                Individual BESS pack telemetry, degradation profile, cell balance, and event history
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-[var(--text-muted)]">SELECT ASSET:</span>
            <select
              value={selectedBessPack}
              onChange={(e) => setSelectedBessPack(e.target.value)}
              className="bg-[var(--bg-panel)] text-[var(--accent-voltage)] font-bold px-2.5 py-1 rounded border border-[var(--border-main)] focus:outline-none cursor-pointer"
            >
              {DEMO_BESS_PACKS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id} ({p.chemistry})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Asset Vital Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
        <div className="scientific-panel p-3.5 space-y-1">
          <span className="text-[10px] text-[var(--text-muted)] uppercase">PACK ID &amp; CHEM</span>
          <div className="text-base font-bold text-[var(--text-primary)]">{pack.id} ({pack.chemistry})</div>
          <span className="text-[10px] text-[var(--text-muted)]">Cell Count: {pack.cellCount} Cells</span>
        </div>

        <div className="scientific-panel p-3.5 space-y-1">
          <span className="text-[10px] text-[var(--text-muted)] uppercase">AVERAGE SOH</span>
          <div className="text-base font-bold text-[var(--accent-healthy)]">{pack.avgSohPercent.toFixed(1)}%</div>
          <span className="text-[10px] text-[var(--text-muted)]">Capacity Baseline</span>
        </div>

        <div className="scientific-panel p-3.5 space-y-1">
          <span className="text-[10px] text-[var(--text-muted)] uppercase">ESTIMATED RUL</span>
          <div className="text-base font-bold text-[var(--accent-model)]">{pack.estRulCycles} Cycles</div>
          <span className="text-[10px] text-[var(--text-muted)]">EOL Target: 80.0% SOH</span>
        </div>

        <div className="scientific-panel p-3.5 space-y-1">
          <span className="text-[10px] text-[var(--text-muted)] uppercase">OPERATIONAL STATUS</span>
          <div className="text-base font-bold text-[var(--accent-live)]">{pack.status}</div>
          <span className="text-[10px] text-[var(--text-muted)]">Site: Demo BESS-01</span>
        </div>
      </div>

      {/* Recent Events for this Asset */}
      <div className="scientific-panel p-4 space-y-3 font-mono text-xs">
        <span className="font-bold text-[var(--text-primary)] uppercase tracking-wider block border-b border-[var(--border-sub)] pb-2">
          ASSET EVENT &amp; TELEMETRY LOG ({pack.id})
        </span>

        <div className="space-y-2 text-[11px]">
          {DEMO_FLEET_EVENTS.slice(0, 3).map((evt) => (
            <div key={evt.id} className="p-2.5 rounded bg-[var(--bg-panel-sub)] border border-[var(--border-sub)] space-y-1">
              <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
                <span>{evt.timestamp}</span>
                <span className="text-[var(--accent-live)] font-bold">{evt.source}</span>
              </div>
              <div className="text-[11px] text-[var(--text-primary)] font-sans">
                {evt.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
