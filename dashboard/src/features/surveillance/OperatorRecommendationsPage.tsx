/**
 * OperatorRecommendationsPage.tsx
 *
 * Dedicated Operator Recommendations page for Grid Operations.
 * Provides actionable decision support and step-by-step dispatcher mitigation guidance.
 */
import React from 'react';
import { Lightbulb } from 'lucide-react';
import { DEMO_ANOMALIES } from '../../data/fleetDemoData';

export const OperatorRecommendationsPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Banner */}
      <div className="scientific-panel p-4 space-y-2 border-l-4 border-l-[var(--accent-healthy)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Lightbulb className="w-5 h-5 text-[var(--accent-healthy)]" />
            <div>
              <h1 className="text-base sm:text-lg font-mono font-bold text-[var(--text-primary)] tracking-tight">
                DISPATCHER DECISION SUPPORT &amp; RECOMMENDED ACTIONS
              </h1>
              <p className="text-xs text-[var(--text-muted)] font-mono">
                AI-assisted step-by-step mitigation guidance and load curtailment recommendations
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded bg-[var(--accent-healthy)]/10 text-[var(--accent-healthy)] border border-[var(--accent-healthy)]/30 font-mono text-xs font-bold uppercase">
            DECISION SUPPORT
          </span>
        </div>
      </div>

      {/* Recommendations Cards */}
      <div className="space-y-4 font-mono text-xs">
        {DEMO_ANOMALIES.map((item) => (
          <div key={item.id} className="scientific-panel p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--border-sub)] pb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[var(--text-primary)] text-sm">{item.assetId}</span>
                <span className="text-[var(--text-subtle)]">•</span>
                <span className="text-[var(--accent-voltage)]">{item.title}</span>
              </div>
              <span className="text-[var(--accent-healthy)] font-bold text-[11px]">
                CONFIDENCE: {item.confidencePercent}%
              </span>
            </div>

            <div className="p-3 rounded bg-[var(--bg-panel-sub)] border border-[var(--border-sub)] font-sans text-xs text-[var(--text-primary)] leading-relaxed space-y-1">
              <div className="font-mono text-[10px] text-[var(--accent-live)] font-bold uppercase">
                RECOMMENDED MITIGATION GUIDANCE:
              </div>
              <div>{item.recommendedAction}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
