/**
 * DegradationForecastPage.tsx
 *
 * Dedicated Degradation Forecast page for Grid Operations.
 * Focuses on future RUL trajectory, cycle life bounds, and projected threshold crossings.
 */
import React from 'react';
import { BrainCircuit } from 'lucide-react';
import { DEMO_BESS_PACKS } from '../../data/fleetDemoData';

export const DegradationForecastPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Banner */}
      <div className="scientific-panel p-4 space-y-2 border-l-4 border-l-[var(--accent-model)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <BrainCircuit className="w-5 h-5 text-[var(--accent-model)]" />
            <div>
              <h1 className="text-base sm:text-lg font-mono font-bold text-[var(--text-primary)] tracking-tight">
                PREDICTIVE DEGRADATION &amp; RUL FORECAST
              </h1>
              <p className="text-xs text-[var(--text-muted)] font-mono">
                Remaining Useful Life (RUL) trajectories, cycle lifetime bounds, and projected maintenance windows
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded bg-[var(--accent-model)]/10 text-[var(--accent-model)] border border-[var(--accent-model)]/30 font-mono text-xs font-bold">
            PROJECTION ENGINE
          </span>
        </div>
      </div>

      {/* Forecast Table */}
      <div className="scientific-panel p-4 space-y-3 font-mono text-xs">
        <span className="font-bold text-[var(--text-primary)] uppercase tracking-wider block border-b border-[var(--border-sub)] pb-2">
          RUL &amp; END-OF-LIFE (EOL 80% SOH) PROJECTION TABLE
        </span>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-[var(--border-sub)] text-[var(--text-muted)] text-[10px] uppercase">
                <th className="py-2 px-3">PACK ID</th>
                <th className="py-2 px-3">CHEMISTRY</th>
                <th className="py-2 px-3">CURRENT SOH</th>
                <th className="py-2 px-3">ESTIMATED RUL (CYCLES)</th>
                <th className="py-2 px-3">PROJECTED EOL DATE</th>
                <th className="py-2 px-3">CONFIDENCE (95% CI)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-sub)] text-[var(--text-secondary)]">
              {DEMO_BESS_PACKS.map((pack) => (
                <tr key={pack.id}>
                  <td className="py-2.5 px-3 font-bold text-[var(--text-primary)]">{pack.id}</td>
                  <td className="py-2.5 px-3">{pack.chemistry}</td>
                  <td className="py-2.5 px-3 font-bold text-[var(--accent-voltage)]">
                    {pack.avgSohPercent.toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 font-bold text-[var(--accent-model)]">
                    {pack.estRulCycles} Cycles
                  </td>
                  <td className="py-2.5 px-3">Q3 2028</td>
                  <td className="py-2.5 px-3 text-[var(--accent-healthy)] font-bold">± 42 Cycles</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
