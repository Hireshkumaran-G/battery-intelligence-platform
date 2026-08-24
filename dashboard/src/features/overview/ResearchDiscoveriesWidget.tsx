import React, { useState } from 'react';
import { ResearchHighlight } from '../../types/api';
import { SignedVsAbsRecord, FeatureImportanceRecord } from '../../types/artifacts';
import { CorrelationComparisonChart } from '../../components/charts/CorrelationComparisonChart';
import { FeatureImportanceChart } from '../../components/charts/FeatureImportanceChart';
import { Sparkles, TrendingUp, BarChart3, LineChart } from 'lucide-react';
import clsx from 'clsx';

interface ResearchDiscoveriesWidgetProps {
  highlights: ResearchHighlight[];
  signedVsAbsData: SignedVsAbsRecord[];
  featureImportanceData: FeatureImportanceRecord[];
}

export const ResearchDiscoveriesWidget: React.FC<ResearchDiscoveriesWidgetProps> = ({
  highlights,
  signedVsAbsData,
  featureImportanceData,
}) => {
  const [activeChartTab, setActiveChartTab] = useState<'correlation' | 'soh_features' | 'rul_features'>('correlation');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-200 tracking-wide font-sans flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          Core Scientific Discoveries & Verification
        </h2>
        <span className="text-xs font-mono text-slate-400">
          Peer-Reviewed Cross-Chemistry Study Findings
        </span>
      </div>

      {/* Discovery Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {highlights.map((item) => (
          <div
            key={item.id}
            className="scientific-panel rounded p-3.5 flex flex-col justify-between space-y-2 border border-slate-800 hover:border-slate-700 transition-colors"
          >
            <div>
              <div className="text-[11px] font-mono font-medium uppercase tracking-wider text-cyan-400">
                {item.title}
              </div>
              <div className="text-sm font-mono font-bold text-slate-100 mt-1">
                {item.metric_value}
              </div>
              <div className="text-[11px] font-sans text-slate-400 mt-0.5">
                {item.metric_label}
              </div>
            </div>

            <p className="text-xs text-slate-400 font-sans leading-relaxed border-t border-slate-800/60 pt-2 line-clamp-3">
              {item.scientific_takeaway}
            </p>
          </div>
        ))}
      </div>

      {/* Analytical Visualizer Panel */}
      <div className="scientific-panel rounded p-4 border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-slate-200 tracking-wide font-sans">
              Interactive Research Visualizations
            </h3>
          </div>

          {/* Chart Tab Switcher */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded border border-slate-800">
            <button
              onClick={() => setActiveChartTab('correlation')}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-medium transition-colors',
                activeChartTab === 'correlation'
                  ? 'bg-slate-800 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <LineChart className="w-3.5 h-3.5" />
              Signed vs. Absolute |r| (Deg 1–6)
            </button>
            <button
              onClick={() => setActiveChartTab('soh_features')}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-medium transition-colors',
                activeChartTab === 'soh_features'
                  ? 'bg-slate-800 text-sky-400 border border-sky-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              SOH Feature Importance
            </button>
            <button
              onClick={() => setActiveChartTab('rul_features')}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-medium transition-colors',
                activeChartTab === 'rul_features'
                  ? 'bg-slate-800 text-purple-400 border border-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              RUL Feature Importance
            </button>
          </div>
        </div>

        {/* Render Chart according to active tab */}
        <div className="pt-2">
          {activeChartTab === 'correlation' && (
            <div>
              <div className="text-xs text-slate-400 font-sans mb-1 flex items-center justify-between">
                <span>
                  Evaluates Pearson correlation across polynomial orders 1–6. Confirms strong absolute association (|r| &ge; 0.69) at degree 2 across all 3 chemistries.
                </span>
                <span className="font-mono text-cyan-400 text-[11px]">NMC Sign Reversal: r &gt; 0</span>
              </div>
              <CorrelationComparisonChart data={signedVsAbsData} />
            </div>
          )}

          {activeChartTab === 'soh_features' && (
            <div>
              <div className="text-xs text-slate-400 font-sans mb-1">
                Random Forest feature importance for State-of-Health prediction. <span className="font-mono text-sky-400">voltage_kurtosis</span> accounts for 62.9% of predictive power.
              </div>
              <FeatureImportanceChart data={featureImportanceData} target="soh" />
            </div>
          )}

          {activeChartTab === 'rul_features' && (
            <div>
              <div className="text-xs text-slate-400 font-sans mb-1">
                Random Forest feature importance for Remaining Useful Life prediction. Physics-motivated <span className="font-mono text-purple-400">fft_energy</span> dominates at 78.6%.
              </div>
              <FeatureImportanceChart data={featureImportanceData} target="rul" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
