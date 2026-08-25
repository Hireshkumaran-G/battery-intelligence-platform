/**
 * GridCrossChemPage.tsx
 *
 * Dedicated Cross-Chemistry Operational Intelligence page for Grid Operations.
 * Compare LFP vs NMC vs LCO operational degradation signatures & risk envelopes.
 */
import React from 'react';
import { GitCompare } from 'lucide-react';

export const GridCrossChemPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Banner */}
      <div className="scientific-panel p-4 space-y-2 border-l-4 border-l-[var(--accent-current)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <GitCompare className="w-5 h-5 text-[var(--accent-current)]" />
            <div>
              <h1 className="text-base sm:text-lg font-mono font-bold text-[var(--text-primary)] tracking-tight">
                CROSS-CHEMISTRY OPERATIONAL INTELLIGENCE MATRIX
              </h1>
              <p className="text-xs text-[var(--text-muted)] font-mono">
                Comparative analysis of LFP, NMC, and LCO dynamic degradation signatures &amp; transferability
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded bg-[var(--accent-current)]/10 text-[var(--accent-current)] border border-[var(--accent-current)]/30 font-mono text-xs font-bold uppercase">
            CROSS-CHEMISTRY
          </span>
        </div>
      </div>

      {/* Grid Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
        <div className="scientific-panel p-4 space-y-3 border-t-4 border-t-[var(--accent-voltage)]">
          <div className="font-bold text-[var(--accent-voltage)] text-sm">LFP (Lithium Iron Phosphate)</div>
          <div className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-sans">
            Ultra-flat voltage plateau (3.2V). Minimal sign-reversal signature under AC ripple. SOH loss is dominated by SEI growth. Right-censoring adjustment applied.
          </div>
          <div className="text-[10px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-sub)]">
            Fleet Coverage: Pack-01, Pack-02 (40%)
          </div>
        </div>

        <div className="scientific-panel p-4 space-y-3 border-t-4 border-t-[var(--accent-current)]">
          <div className="font-bold text-[var(--accent-current)] text-sm">NMC (Nickel Manganese Cobalt)</div>
          <div className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-sans">
            Pronounced slope across SOC (3.7V nominal). Exhibits strong sign-reversal correlation under dynamic current ripples. High sensitivity to peak thermal transients.
          </div>
          <div className="text-[10px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-sub)]">
            Fleet Coverage: Pack-03, Pack-04 (40%)
          </div>
        </div>

        <div className="scientific-panel p-4 space-y-3 border-t-4 border-t-[var(--accent-thermal)]">
          <div className="font-bold text-[var(--accent-thermal)] text-sm">LCO (Lithium Cobalt Oxide)</div>
          <div className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-sans">
            High energy density baseline (3.9V nominal). Accelerated capacity degradation under cyclic ripple stress. Requires strict thermal bounds.
          </div>
          <div className="text-[10px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-sub)]">
            Fleet Coverage: Pack-05 (20%)
          </div>
        </div>
      </div>
    </div>
  );
};
