/**
 * MaintenancePrioritiesPage.tsx
 *
 * Dedicated Maintenance Priorities page for Grid Operations.
 * Ranked risk queue for field engineers and maintenance planning.
 */
import React from 'react';
import { Wrench } from 'lucide-react';
import { DEMO_ANOMALIES } from '../../data/fleetDemoData';

export const MaintenancePrioritiesPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Banner */}
      <div className="scientific-panel p-4 space-y-2 border-l-4 border-l-rose-500">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Wrench className="w-5 h-5 text-rose-500" />
            <div>
              <h1 className="text-base sm:text-lg font-mono font-bold text-[var(--text-primary)] tracking-tight">
                FIELD MAINTENANCE PRIORITIES &amp; RISK QUEUE
              </h1>
              <p className="text-xs text-[var(--text-muted)] font-mono">
                Ranked maintenance queue sorted by degradation severity and dynamic operational risk
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 font-mono text-xs font-bold uppercase">
            PRIORITY QUEUE
          </span>
        </div>
      </div>

      {/* Queue Table */}
      <div className="scientific-panel p-4 space-y-3 font-mono text-xs">
        <span className="font-bold text-[var(--text-primary)] uppercase tracking-wider block border-b border-[var(--border-sub)] pb-2">
          PRIORITIZED MAINTENANCE DISPATCH QUEUE
        </span>

        <div className="space-y-3">
          {DEMO_ANOMALIES.map((item, idx) => (
            <div
              key={item.id}
              className="p-4 rounded bg-[var(--bg-panel-sub)] border border-[var(--border-sub)] space-y-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-sub)] pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 font-bold flex items-center justify-center text-[10px]">
                    #{idx + 1}
                  </span>
                  <span className="font-bold text-[var(--text-primary)] text-sm">{item.assetId}</span>
                  <span className="text-[var(--text-subtle)]">|</span>
                  <span className="text-[var(--accent-voltage)] font-bold">{item.chemistry}</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold text-[10px]">
                  {item.severity} PRIORITY
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-sans">
                <div>
                  <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase block">DETECTED ANOMALY:</span>
                  <span className="font-bold text-[var(--text-primary)]">{item.title}</span>
                </div>
                <div>
                  <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase block">RECOMMENDED FIELD ACTION:</span>
                  <span className="text-[var(--accent-healthy)] font-mono text-[11px]">{item.recommendedAction}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
