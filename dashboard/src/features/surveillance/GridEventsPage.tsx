/**
 * GridEventsPage.tsx
 *
 * Dedicated Alerts & Events Audit Feed for Grid Operations.
 * Chronological time-stamped history of all system alerts, connection events, and status changes.
 */
import React from 'react';
import { Clock, Filter } from 'lucide-react';
import { DEMO_FLEET_EVENTS } from '../../data/fleetDemoData';

export const GridEventsPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Banner */}
      <div className="scientific-panel p-4 space-y-2 border-l-4 border-l-[var(--accent-voltage)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-[var(--accent-voltage)]" />
            <div>
              <h1 className="text-base sm:text-lg font-mono font-bold text-[var(--text-primary)] tracking-tight">
                CHRONOLOGICAL ALERTS &amp; EVENTS AUDIT LOG
              </h1>
              <p className="text-xs text-[var(--text-muted)] font-mono">
                Time-stamped audit trail of operational alerts, system events, and telemetry status changes
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs text-[var(--text-muted)]">
            <Filter className="w-3.5 h-3.5" />
            <span>Showing all {DEMO_FLEET_EVENTS.length} events</span>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="scientific-panel p-4 space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-[var(--border-sub)] pb-2 text-[var(--text-muted)] text-[10px] uppercase font-bold">
          <span>TIMESTAMP &amp; SOURCE</span>
          <span>EVENT CATEGORY &amp; DESCRIPTION</span>
        </div>

        <div className="space-y-2 text-[11px]">
          {DEMO_FLEET_EVENTS.map((evt) => (
            <div
              key={evt.id}
              className="p-3 rounded bg-[var(--bg-panel-sub)] border border-[var(--border-sub)] flex flex-wrap items-center justify-between gap-3"
            >
              <div className="space-y-0.5 min-w-[140px]">
                <div className="text-[var(--text-primary)] font-bold">{evt.timestamp}</div>
                <div className="text-[10px] text-[var(--accent-live)]">{evt.source}</div>
              </div>

              <div className="flex-1 min-w-[200px] space-y-0.5">
                <div className="text-[var(--text-primary)] font-sans">{evt.description}</div>
              </div>

              <div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    evt.type === 'ALERT'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      : evt.type === 'WARNING'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'bg-[var(--accent-live)]/20 text-[var(--accent-live)] border border-[var(--accent-live)]/40'
                  }`}
                >
                  {evt.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
