/**
 * DegradationLifecyclePage.tsx
 *
 * Dedicated Degradation & Lifecycle page for Research Workspace.
 * Features Primary Degradation Envelope chart, Global Filter Bar, SOH bounds, and capacity fade insights.
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchCellCorrelations } from '../../api/artifacts';
import { GlobalAnalysisHeader } from '../../components/layout/GlobalAnalysisHeader';
import { PrimaryDegradationChart } from './PrimaryDegradationChart';
import { Layers, Loader2, AlertTriangle, Info } from 'lucide-react';

export const DegradationLifecyclePage: React.FC = () => {
  const { data: cellCorrelations, isLoading, isError, error } = useQuery({
    queryKey: ['cell-correlations'],
    queryFn: fetchCellCorrelations,
  });

  const availableCells = React.useMemo(() => {
    if (!cellCorrelations) return [];
    const deg2Records = cellCorrelations.filter((d) => d.poly_order === 2);
    return deg2Records.map((r) => ({
      id: r.cell_id,
      chemistry: r.chemistry,
      cycles: r.n_cycles,
    }));
  }, [cellCorrelations]);

  if (isError) {
    return (
      <div className="p-12 flex flex-col items-center justify-center space-y-3 font-mono">
        <AlertTriangle className="w-8 h-8 text-rose-400" />
        <span className="text-sm text-rose-400">Failed to load degradation data: {(error as Error)?.message}</span>
      </div>
    );
  }

  if (isLoading || !cellCorrelations) {
    return (
      <div className="p-16 flex flex-col items-center justify-center space-y-3 font-mono">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-voltage)]" />
        <span className="text-sm text-[var(--text-muted)]">Loading Degradation &amp; Lifecycle Data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Page Header */}
      <div className="scientific-panel p-4 space-y-2 border-l-4 border-l-[var(--accent-thermal)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-[var(--accent-thermal)]" />
            <div>
              <h1 className="text-base sm:text-lg font-mono font-bold text-[var(--text-primary)] tracking-tight">
                DEGRADATION &amp; LIFECYCLE ENVELOPE ANALYSIS
              </h1>
              <p className="text-xs text-[var(--text-muted)] font-mono">
                Cycle-life envelopes, empirical SOH capacity degradation, and right-censoring bounds across verified cell datasets
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded bg-[var(--accent-thermal)]/10 text-[var(--accent-thermal)] border border-[var(--accent-thermal)]/30 font-mono text-xs font-bold uppercase">
            RESEARCH DATA • VERIFIED
          </span>
        </div>
      </div>

      {/* 2. Context / Explanation Card */}
      <div className="p-3.5 rounded-lg bg-[var(--bg-panel-sub)] border border-[var(--border-sub)] flex items-start gap-3 text-xs font-sans text-[var(--text-secondary)]">
        <Info className="w-4 h-4 text-[var(--accent-thermal)] shrink-0 mt-0.5" />
        <div>
          <strong className="font-mono text-[var(--text-primary)] uppercase font-semibold">
            Analysis Scope &amp; Methodology:
          </strong>{' '}
          Compares observed cycle lifespan and empirical capacity/SOH degradation bounds across verified LFP, NMC, and LCO cells. Employs right-censoring corrections for long-life LFP cells where cycling terminated prior to End-of-Life (EOL).
        </div>
      </div>

      {/* 3. Research Insight Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
        <div className="scientific-panel p-4 space-y-1 border-l-4 border-l-[var(--accent-voltage)]">
          <div className="text-[10px] text-[var(--text-muted)] uppercase">VERIFIED CELLS</div>
          <div className="text-xl font-bold text-[var(--text-primary)]">20 Cells</div>
          <div className="text-[10px] text-[var(--text-muted)]">Full Degradation History</div>
        </div>

        <div className="scientific-panel p-4 space-y-1 border-l-4 border-l-[var(--accent-thermal)]">
          <div className="text-[10px] text-[var(--text-muted)] uppercase">LFP DATASET</div>
          <div className="text-xl font-bold text-[var(--accent-thermal)]">Right-Censored</div>
          <div className="text-[10px] text-[var(--text-muted)]">&gt; 1,000 Cycles Capacity Stable</div>
        </div>

        <div className="scientific-panel p-4 space-y-1 border-l-4 border-l-[var(--accent-current)]">
          <div className="text-[10px] text-[var(--text-muted)] uppercase">NMC &amp; LCO DATASET</div>
          <div className="text-xl font-bold text-[var(--accent-current)]">EOL Observed</div>
          <div className="text-[10px] text-[var(--text-muted)]">Complete Aging Envelopes</div>
        </div>

        <div className="scientific-panel p-4 space-y-1 border-l-4 border-l-[var(--accent-healthy)]">
          <div className="text-[10px] text-[var(--text-muted)] uppercase">DETRENDING SCHEME</div>
          <div className="text-xl font-bold text-[var(--accent-healthy)]">Degree 2 Poly</div>
          <div className="text-[10px] text-[var(--text-muted)]">Baseline Detrending Normalization</div>
        </div>
      </div>

      {/* 4. Chemistry & Cell Filter Bar */}
      <GlobalAnalysisHeader availableCells={availableCells} />

      {/* 5. Primary Degradation Chart */}
      <PrimaryDegradationChart data={cellCorrelations} />
    </div>
  );
};
