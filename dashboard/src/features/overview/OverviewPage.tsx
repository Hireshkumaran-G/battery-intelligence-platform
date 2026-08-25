import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchCellCorrelations,
  fetchSignedVsAbs,
  fetchSensitivityStudy,
  fetchSignReversalSummary,
  fetchInteractionStats,
  fetchFeatureTransfer,
  fetchWithinChemistry,
  fetchLocoChemistry,
  fetchStrategyComparison,
  fetchFeatureImportances,
} from '../../api/artifacts';
import { GlobalAnalysisHeader } from '../../components/layout/GlobalAnalysisHeader';
import { PrimaryDegradationChart } from './PrimaryDegradationChart';
import { DynamicSignatureWorkbench } from './DynamicSignatureWorkbench';
import { CrossChemistryTransferHeatmap } from './CrossChemistryTransferHeatmap';
import { ModelStrategyBenchmark } from './ModelStrategyBenchmark';
import { CellAnalysisInspector } from './CellAnalysisInspector';
import { CompactArtifactExplorer } from './CompactArtifactExplorer';
import { CompactDeploymentRegistry } from './CompactDeploymentRegistry';
import { Loader2, AlertTriangle } from 'lucide-react';

export const OverviewPage: React.FC = () => {
  const { data: cellCorrelations, isLoading: isCellsLoading, isError: isCellsError, error: cellsError } = useQuery({
    queryKey: ['cell-correlations'],
    queryFn: fetchCellCorrelations,
  });

  const { data: signedVsAbs } = useQuery({
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

  const { data: transferData } = useQuery({
    queryKey: ['feature-transfer'],
    queryFn: fetchFeatureTransfer,
  });

  const { data: withinData } = useQuery({
    queryKey: ['within-chemistry'],
    queryFn: fetchWithinChemistry,
  });

  const { data: locoData } = useQuery({
    queryKey: ['loco-chemistry'],
    queryFn: fetchLocoChemistry,
  });

  const { data: strategyData } = useQuery({
    queryKey: ['strategy-comparison'],
    queryFn: fetchStrategyComparison,
  });

  const { data: featureImportanceData } = useQuery({
    queryKey: ['feature-importances'],
    queryFn: fetchFeatureImportances,
  });

  // Extract distinct cell list for the global analysis header
  const availableCells = React.useMemo(() => {
    if (!cellCorrelations) return [];
    const deg2Records = cellCorrelations.filter((d) => d.poly_order === 2);
    return deg2Records.map((r) => ({
      id: r.cell_id,
      chemistry: r.chemistry,
      cycles: r.n_cycles,
    }));
  }, [cellCorrelations]);

  if (isCellsError) {
    const message = cellsError instanceof Error ? cellsError.message : 'Unknown error';
    return (
      <div className="p-16 flex flex-col items-center justify-center space-y-4 min-h-[500px]">
        <AlertTriangle className="w-10 h-10 text-rose-400" />
        <div className="text-center space-y-1">
          <p className="text-base font-semibold text-rose-400">API Unavailable</p>
          <p className="text-sm font-mono text-slate-400">{message}</p>
          <p className="text-xs text-slate-500 mt-2">
            Make sure the BIP API server is running on{' '}
            <code className="text-cyan-400">http://localhost:8000</code>
          </p>
        </div>
      </div>
    );
  }

  if (isCellsLoading || !cellCorrelations) {
    return (
      <div className="p-16 flex flex-col items-center justify-center space-y-3 min-h-[500px]">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        <span className="text-sm font-mono text-slate-400">Loading Research Data & Artifacts...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Global Analysis Header (Filters & Quick Jumps) */}
      <GlobalAnalysisHeader availableCells={availableCells} />

      {/* 2. Primary Degradation & Lifespan Envelope Visualization */}
      <PrimaryDegradationChart data={cellCorrelations} />

      {/* 3. Dynamic Ripple Signatures & NMC Sign Reversal Workbench */}
      {signedVsAbs && sensitivity && signReversalSummary && interactionStats && (
        <DynamicSignatureWorkbench
          signedVsAbs={signedVsAbs}
          sensitivity={sensitivity}
          signReversalSummary={signReversalSummary}
          interactionStats={interactionStats}
        />
      )}

      {/* 4. Cross-Chemistry Transferability & LOCO Matrix */}
      {transferData && withinData && locoData && (
        <CrossChemistryTransferHeatmap
          transferData={transferData}
          withinData={withinData}
          locoData={locoData}
        />
      )}

      {/* 5. Model Intelligence & 3-Strategy Benchmark */}
      {strategyData && featureImportanceData && (
        <ModelStrategyBenchmark
          strategyData={strategyData}
          featureImportanceData={featureImportanceData}
        />
      )}

      {/* 6. Cell-Level Deep-Dive Inspector */}
      <CellAnalysisInspector data={cellCorrelations} />

      {/* 7. Research Artifacts Explorer */}
      <CompactArtifactExplorer />

      {/* 8. STM32 Embedded TinyML Deployment Registry */}
      <CompactDeploymentRegistry />
    </div>
  );
};
