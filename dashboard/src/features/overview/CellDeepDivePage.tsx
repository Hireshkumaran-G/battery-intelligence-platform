/**
 * CellDeepDivePage.tsx
 *
 * Dedicated Cell Deep-Dive & Detrending Sensitivity page for Research Workspace.
 * Features single-cell diagnostic inspector, polynomial order detrending sensitivity,
 * SOH decay trajectory, and right-censoring status.
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchCellCorrelations } from '../../api/artifacts';
import { GlobalAnalysisHeader } from '../../components/layout/GlobalAnalysisHeader';
import { CellAnalysisInspector } from './CellAnalysisInspector';
import { Search, Loader2, AlertTriangle, Info } from 'lucide-react';

export const CellDeepDivePage: React.FC = () => {
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
        <span className="text-sm text-rose-400">
          Failed to load cell inspector data: {(error as Error)?.message}
        </span>
      </div>
    );
  }

  if (isLoading || !cellCorrelations) {
    return (
      <div className="p-16 flex flex-col items-center justify-center space-y-3 font-mono">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-healthy)]" />
        <span className="text-sm text-[var(--text-muted)]">Loading Cell Inspector Data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Page Header */}
      <div className="scientific-panel p-4 space-y-2 border-l-4 border-l-[var(--accent-healthy)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Search className="w-5 h-5 text-[var(--accent-healthy)]" />
            <div>
              <h1 className="text-base sm:text-lg font-mono font-bold text-[var(--text-primary)] tracking-tight">
                CELL DEEP-DIVE &amp; DETRENDING SENSITIVITY
              </h1>
              <p className="text-xs text-[var(--text-muted)] font-mono">
                Individual cell degradation profile, polynomial detrending order sensitivity, and EOL censoring audit
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded bg-[var(--accent-healthy)]/10 text-[var(--accent-healthy)] border border-[var(--accent-healthy)]/30 font-mono text-xs font-bold uppercase">
            CELL DIAGNOSTIC LAYER
          </span>
        </div>
      </div>

      {/* 2. Context / Explanation Banner */}
      <div className="p-3.5 rounded-lg bg-[var(--bg-panel-sub)] border border-[var(--border-sub)] flex items-start gap-3 text-xs font-sans text-[var(--text-secondary)]">
        <Info className="w-4 h-4 text-[var(--accent-healthy)] shrink-0 mt-0.5" />
        <div>
          <strong className="font-mono text-[var(--text-primary)] uppercase font-semibold">
            Single-Cell Analysis Context:
          </strong>{' '}
          Examines multi-degree polynomial detrending performance (Degree 1 to 6), signal-to-noise ratios (SNR), and raw vs normalized ripple Pearson correlations (r) for the selected battery cell.
        </div>
      </div>

      {/* 3. Global Chemistry & Cell Selector Filter Bar */}
      <GlobalAnalysisHeader availableCells={availableCells} />

      {/* 4. Cell Analysis Inspector Component */}
      <CellAnalysisInspector data={cellCorrelations} />
    </div>
  );
};
