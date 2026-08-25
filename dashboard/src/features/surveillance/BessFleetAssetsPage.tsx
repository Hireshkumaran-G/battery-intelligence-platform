/**
 * BessFleetAssetsPage.tsx
 *
 * Dedicated BESS Fleet Assets directory view.
 * Displays site maps, pack configuration directory, and hardware specifications.
 */
import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { DEMO_BESS_PACKS } from '../../data/fleetDemoData';

export const BessFleetAssetsPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Banner */}
      <div className="scientific-panel p-4 space-y-2 border-l-4 border-l-[var(--accent-healthy)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[var(--accent-healthy)]" />
            <div>
              <h1 className="text-base sm:text-lg font-mono font-bold text-[var(--text-primary)] tracking-tight">
                BESS FLEET ASSETS DIRECTORY
              </h1>
              <p className="text-xs text-[var(--text-muted)] font-mono">
                Site layout, monitored battery pack configurations, and cell count allocation
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded bg-[var(--accent-healthy)]/10 text-[var(--accent-healthy)] border border-[var(--accent-healthy)]/30 font-mono text-xs font-bold uppercase">
            SITE ASSETS
          </span>
        </div>
      </div>

      {/* Asset Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-xs">
        {DEMO_BESS_PACKS.map((pack) => (
          <div key={pack.id} className="scientific-panel p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--border-sub)] pb-2">
              <span className="font-bold text-[var(--text-primary)] text-sm">{pack.id}</span>
              <span className="px-2 py-0.5 rounded bg-[var(--bg-panel-sub)] border border-[var(--border-sub)] text-[var(--text-muted)] font-bold text-[10px]">
                {pack.chemistry}
              </span>
            </div>

            <div className="space-y-1.5 text-[11px] text-[var(--text-secondary)]">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">LOCATION:</span>
                <span className="text-[var(--text-primary)]">Demo BESS-01</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">CELL COUNT:</span>
                <span className="text-[var(--text-primary)]">{pack.cellCount} Cells</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">NOMINAL VOLTAGE:</span>
                <span className="text-[var(--accent-voltage)]">{pack.voltageNominal} V</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">RATED CAPACITY:</span>
                <span className="text-[var(--text-primary)]">100 Ah</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">AVG SOH:</span>
                <span className="font-bold text-[var(--accent-healthy)]">{pack.avgSohPercent.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
