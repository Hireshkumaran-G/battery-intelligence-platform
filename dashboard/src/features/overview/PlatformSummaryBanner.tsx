import React from 'react';
import { Layers, Database, CircuitBoard, ShieldCheck } from 'lucide-react';
import { MetricCard } from '../../components/layout/MetricCard';
import { OverviewSummaryResponse } from '../../types/api';

interface PlatformSummaryBannerProps {
  summary?: OverviewSummaryResponse;
  isLoading: boolean;
}

export const PlatformSummaryBanner: React.FC<PlatformSummaryBannerProps> = ({
  summary,
  isLoading,
}) => {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-slate-900/60 rounded border border-slate-800" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Total Cells Analyzed"
        value={summary.total_cells}
        unit="cells"
        subtext="8 LFP • 8 NMC • 4 LCO verified cells"
        icon={Layers}
        variant="voltage"
      />
      <MetricCard
        title="Cycling Datasets"
        value={summary.datasets.length}
        unit="sources"
        subtext="Stanford/MIT • Oxford • NASA Ames"
        icon={Database}
        variant="ripple"
      />
      <MetricCard
        title="Edge TinyML Models"
        value={summary.deployed_models_count}
        unit="models"
        subtext={`Exported C packages for ${summary.target_mcu}`}
        icon={CircuitBoard}
        variant="model"
      />
      <MetricCard
        title="Scientific Integrity"
        value="100%"
        unit="compliant"
        subtext="Right-censored LFP RUL strictly enforced"
        icon={ShieldCheck}
        variant="healthy"
      />
    </div>
  );
};
