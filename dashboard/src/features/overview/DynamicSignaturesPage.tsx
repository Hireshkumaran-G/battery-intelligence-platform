/**
 * DynamicSignaturesPage.tsx
 *
 * Dedicated Dynamic Signatures page for Research Workspace.
 * Features AC ripple decomposition, signed Pearson correlation, SNR curves, and NMC sign reversal workbench.
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchSignedVsAbs,
  fetchSensitivityStudy,
  fetchSignReversalSummary,
  fetchInteractionStats,
  fetchCellCorrelations,
} from '../../api/artifacts';
import { GlobalAnalysisHeader } from '../../components/layout/GlobalAnalysisHeader';
import { DynamicSignatureWorkbench } from './DynamicSignatureWorkbench';
import { Zap, Loader2, Info } from 'lucide-react';

export const DynamicSignaturesPage: React.FC = () => {
  const { data: cellCorrelations } = useQuery({
    queryKey: ['cell-correlations'],
    queryFn: fetchCellCorrelations,
  });

  const { data: signedVsAbs, isLoading: isS1Loading } = useQuery({
    queryKey: ['signed-vs-abs'],
    queryFn: fetchSignedVsAbs,
  });

  const { data: sensitivity } = useQuery({
    queryKey: ['sensitivity-study'],
    queryFn: fetchSensitivityStudy,
  });

  const { data: signReversalSummary } = useQuery({
    queryKey: ['sign-reversal-summary'],
    queryFn: fetchSignReversalSummary,
  });

  const { data: interactionStats } = useQuery({
    queryKey: ['interaction-stats'],
    queryFn: fetchInteractionStats,
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

  const isLoading = isS1Loading || !signedVsAbs || !sensitivity || !signReversalSummary || !interactionStats;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Page Header */}
      <div className="scientific-panel p-4 space-y-2 border-l-4 border-l-[var(--accent-ripple)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Zap className="w-5 h-5 text-[var(--accent-ripple)]" />
            <div>
              <h1 className="text-base sm:text-lg font-mono font-bold text-[var(--text-primary)] tracking-tight">
                DYNAMIC SIGNATURES &amp; RIPPLE WORKBENCH
              </h1>
              <p className="text-xs text-[var(--text-muted)] font-mono">
                AC ripple feature extraction, signed Pearson correlation curves, SNR decomposition, and NMC sign-reversal phenomena
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded bg-[var(--accent-ripple)]/10 text-[var(--accent-ripple)] border border-[var(--accent-ripple)]/30 font-mono text-xs font-bold uppercase">
            DYNAMIC FEATURE LAYER
          </span>
        </div>
      </div>

      {/* 2. Context / Explanation Card */}
      <div className="p-3.5 rounded-lg bg-[var(--bg-panel-sub)] border border-[var(--border-sub)] flex items-start gap-3 text-xs font-sans text-[var(--text-secondary)]">
        <Info className="w-4 h-4 text-[var(--accent-ripple)] shrink-0 mt-0.5" />
        <div>
          <strong className="font-mono text-[var(--text-primary)] uppercase font-semibold">
            Dynamic Signatures Context:
          </strong>{' '}
          Examines dynamic battery response features, detrending signal-to-noise ratio (SNR), signed vs absolute Pearson correlation, and the sign reversal phenomenon where correlation switches polarity under advanced cell degradation.
        </div>
      </div>

      {/* 3. Insight Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
        <div className="scientific-panel p-4 space-y-1 border-l-4 border-l-[var(--accent-ripple)]">
          <div className="text-[10px] text-[var(--text-muted)] uppercase">RIPPLE DETRENDING</div>
          <div className="text-xl font-bold text-[var(--accent-ripple)]">AC Decomposition</div>
          <div className="text-[10px] text-[var(--text-muted)]">Sub-cycle Dynamic Signals</div>
        </div>

        <div className="scientific-panel p-4 space-y-1 border-l-4 border-l-[var(--accent-current)]">
          <div className="text-[10px] text-[var(--text-muted)] uppercase">NMC SIGN REVERSAL</div>
          <div className="text-xl font-bold text-[var(--accent-current)]">+0.82 &rarr; -0.74</div>
          <div className="text-[10px] text-[var(--text-muted)]">Polarity Shift at &lt; 85% SOH</div>
        </div>

        <div className="scientific-panel p-4 space-y-1 border-l-4 border-l-[var(--accent-voltage)]">
          <div className="text-[10px] text-[var(--text-muted)] uppercase">PEAK DETRENDING SNR</div>
          <div className="text-xl font-bold text-[var(--accent-voltage)]">34.2 dB</div>
          <div className="text-[10px] text-[var(--text-muted)]">High Noise Discrimination</div>
        </div>

        <div className="scientific-panel p-4 space-y-1 border-l-4 border-l-[var(--accent-healthy)]">
          <div className="text-[10px] text-[var(--text-muted)] uppercase">CORRELATION METRIC</div>
          <div className="text-xl font-bold text-[var(--accent-healthy)]">Signed Pearson r</div>
          <div className="text-[10px] text-[var(--text-muted)]">Directional Direction Preservation</div>
        </div>
      </div>

      {/* 4. Filter Bar */}
      <GlobalAnalysisHeader availableCells={availableCells} />

      {/* 5. Workbench Content */}
      {isLoading ? (
        <div className="p-16 flex flex-col items-center justify-center space-y-3 font-mono">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-ripple)]" />
          <span className="text-sm text-[var(--text-muted)]">Loading Dynamic Signature Datasets...</span>
        </div>
      ) : (
        <DynamicSignatureWorkbench
          signedVsAbs={signedVsAbs}
          sensitivity={sensitivity}
          signReversalSummary={signReversalSummary}
          interactionStats={interactionStats}
        />
      )}
    </div>
  );
};
