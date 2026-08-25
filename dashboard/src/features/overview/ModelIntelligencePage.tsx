/**
 * ModelIntelligencePage.tsx
 *
 * Dedicated Model Intelligence page for Research Workspace.
 * Features 3-Strategy Benchmark (Intra-cycle, Dynamic, Physics-ML) and Feature Importance rankings.
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchStrategyComparison,
  fetchFeatureImportances,
  fetchCellCorrelations,
} from '../../api/artifacts';
import { GlobalAnalysisHeader } from '../../components/layout/GlobalAnalysisHeader';
import { ModelStrategyBenchmark } from './ModelStrategyBenchmark';
import { BrainCircuit, Loader2, Info } from 'lucide-react';

export const ModelIntelligencePage: React.FC = () => {
  const { data: cellCorrelations } = useQuery({
    queryKey: ['cell-correlations'],
    queryFn: fetchCellCorrelations,
  });

  const { data: strategyData, isLoading: isSLoading } = useQuery({
    queryKey: ['strategy-comparison'],
    queryFn: fetchStrategyComparison,
  });

  const { data: featureImportanceData } = useQuery({
    queryKey: ['feature-importances'],
    queryFn: fetchFeatureImportances,
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

  const isLoading = isSLoading || !strategyData || !featureImportanceData;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Page Header */}
      <div className="scientific-panel p-4 space-y-2 border-l-4 border-l-[var(--accent-model)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <BrainCircuit className="w-5 h-5 text-[var(--accent-model)]" />
            <div>
              <h1 className="text-base sm:text-lg font-mono font-bold text-[var(--text-primary)] tracking-tight">
                MODEL INTELLIGENCE &amp; 3-STRATEGY BENCHMARK
              </h1>
              <p className="text-xs text-[var(--text-muted)] font-mono">
                Comparative evaluation of Strategy 1 (Intra-cycle), Strategy 2 (Dynamic Ripple), and Strategy 3 (Physics-ML) features
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded bg-[var(--accent-model)]/10 text-[var(--accent-model)] border border-[var(--accent-model)]/30 font-mono text-xs font-bold uppercase">
            PREDICTIVE ENGINE BENCHMARK
          </span>
        </div>
      </div>

      {/* 2. Context / Explanation Card */}
      <div className="p-3.5 rounded-lg bg-[var(--bg-panel-sub)] border border-[var(--border-sub)] flex items-start gap-3 text-xs font-sans text-[var(--text-secondary)]">
        <Info className="w-4 h-4 text-[var(--accent-model)] shrink-0 mt-0.5" />
        <div>
          <strong className="font-mono text-[var(--text-primary)] uppercase font-semibold">
            Model Strategy Context:
          </strong>{' '}
          Compares feature extraction methodologies across Strategy 1 (Intra-cycle V-I-T curves), Strategy 2 (Dynamic AC ripple features), and Strategy 3 (Physics-informed ML features) for SOH estimation and RUL forecasting.
        </div>
      </div>

      {/* 3. Insight Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
        <div className="scientific-panel p-4 space-y-1 border-l-4 border-l-[var(--text-secondary)]">
          <div className="text-[10px] text-[var(--text-muted)] uppercase">STRATEGY 1</div>
          <div className="text-xl font-bold text-[var(--text-primary)]">Intra-Cycle</div>
          <div className="text-[10px] text-[var(--text-muted)]">Voltage-Current Profiling</div>
        </div>

        <div className="scientific-panel p-4 space-y-1 border-l-4 border-l-[var(--accent-ripple)]">
          <div className="text-[10px] text-[var(--text-muted)] uppercase">STRATEGY 2</div>
          <div className="text-xl font-bold text-[var(--accent-ripple)]">Dynamic Ripple</div>
          <div className="text-[10px] text-[var(--text-muted)]">Sub-cycle Spectral Features</div>
        </div>

        <div className="scientific-panel p-4 space-y-1 border-l-4 border-l-[var(--accent-model)]">
          <div className="text-[10px] text-[var(--text-muted)] uppercase">STRATEGY 3</div>
          <div className="text-xl font-bold text-[var(--accent-model)]">Physics-ML</div>
          <div className="text-[10px] text-[var(--text-muted)]">Hybrid Domain Adaptation</div>
        </div>

        <div className="scientific-panel p-4 space-y-1 border-l-4 border-l-[var(--accent-healthy)]">
          <div className="text-[10px] text-[var(--text-muted)] uppercase">PREDICTIVE MODEL</div>
          <div className="text-xl font-bold text-[var(--accent-healthy)]">Random Forest</div>
          <div className="text-[10px] text-[var(--text-muted)]">Tree Feature Ranking</div>
        </div>
      </div>

      {/* 4. Filter Bar */}
      <GlobalAnalysisHeader availableCells={availableCells} />

      {/* 5. Strategy Benchmark Content */}
      {isLoading ? (
        <div className="p-16 flex flex-col items-center justify-center space-y-3 font-mono">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-model)]" />
          <span className="text-sm text-[var(--text-muted)]">Loading Model Strategy Benchmark...</span>
        </div>
      ) : (
        <ModelStrategyBenchmark
          strategyData={strategyData}
          featureImportanceData={featureImportanceData}
        />
      )}
    </div>
  );
};
