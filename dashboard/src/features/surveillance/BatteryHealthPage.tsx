/**
 * BatteryHealthPage.tsx
 *
 * Dedicated Battery Health page for Grid Operations.
 * Focuses on SOH, capacity degradation, cell balance audit, and aging trajectory.
 */
import React from 'react';
import { Battery } from 'lucide-react';
import { DEMO_BESS_PACKS } from '../../data/fleetDemoData';

export const BatteryHealthPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Banner */}
      <div className="scientific-panel p-4 space-y-2 border-l-4 border-l-[var(--accent-voltage)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Battery className="w-5 h-5 text-[var(--accent-voltage)]" />
            <div>
              <h1 className="text-base sm:text-lg font-mono font-bold text-[var(--text-primary)] tracking-tight">
                FLEET BATTERY HEALTH &amp; SOH DEGRADATION AUDIT
              </h1>
              <p className="text-xs text-[var(--text-muted)] font-mono">
                State of Health (SOH) baseline monitoring, capacity fade analysis, and cell balance statistics
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded bg-[var(--accent-voltage)]/10 text-[var(--accent-voltage)] border border-[var(--accent-voltage)]/30 font-mono text-xs font-bold">
            HEALTH ANALYTICS
          </span>
        </div>
      </div>

      {/* Health Cards Table */}
      <div className="scientific-panel p-4 space-y-3 font-mono text-xs">
        <span className="font-bold text-[var(--text-primary)] uppercase tracking-wider block border-b border-[var(--border-sub)] pb-2">
          BESS PACK SOH DEGRADATION MATRIX
        </span>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-[var(--border-sub)] text-[var(--text-muted)] text-[10px] uppercase">
                <th className="py-2 px-3">PACK ID</th>
                <th className="py-2 px-3">CHEMISTRY</th>
                <th className="py-2 px-3">CURRENT SOH</th>
                <th className="py-2 px-3">CAPACITY FADE RATE</th>
                <th className="py-2 px-3">CELL BALANCING</th>
                <th className="py-2 px-3">HEALTH STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-sub)] text-[var(--text-secondary)]">
              {DEMO_BESS_PACKS.map((pack) => (
                <tr key={pack.id}>
                  <td className="py-2.5 px-3 font-bold text-[var(--text-primary)]">{pack.id}</td>
                  <td className="py-2.5 px-3 font-mono">{pack.chemistry}</td>
                  <td className="py-2.5 px-3 font-bold text-[var(--accent-voltage)]">
                    {pack.avgSohPercent.toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3">0.04% / 100 cycles</td>
                  <td className="py-2.5 px-3 text-[var(--accent-healthy)]">Balanced (&lt; 12 mV)</td>
                  <td className="py-2.5 px-3 font-bold">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] ${
                        pack.status === 'HEALTHY'
                          ? 'bg-[var(--accent-healthy)]/20 text-[var(--accent-healthy)]'
                          : pack.status === 'WARNING' || pack.status === 'MONITORING'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {pack.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
