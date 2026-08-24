import React, { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { StrategyComparisonRecord, FeatureImportanceRecord } from '../../types/artifacts';
import { useAppStore } from '../../store/useAppStore';
import { BrainCircuit, Info } from 'lucide-react';
import clsx from 'clsx';

interface ModelStrategyBenchmarkProps {
  strategyData: StrategyComparisonRecord[];
  featureImportanceData: FeatureImportanceRecord[];
}

export const ModelStrategyBenchmark: React.FC<ModelStrategyBenchmarkProps> = ({
  strategyData,
  featureImportanceData,
}) => {
  const { theme } = useAppStore();
  const isDark = theme === 'dark';

  const [target, setTarget] = useState<'SOH' | 'RUL'>('SOH');
  const [importanceTarget, setImportanceTarget] = useState<'soh' | 'rul'>('soh');

  // Filter strategy data by target
  const currentStrategies = strategyData.filter((r) => r.target.toUpperCase() === target);
  const chems = currentStrategies.map((r) => r.chemistry);

  const stratA = currentStrategies.map((r) => r.rmse_strategy_A_global);
  const stratB = currentStrategies.map((r) => r.rmse_strategy_B_specific);
  const stratC = currentStrategies.map((r) => r.rmse_strategy_C_calibrated);

  const isSoh = target === 'SOH';

  const strategyOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark ? '#090C11' : '#FFFFFF',
      borderColor: isDark ? '#252B35' : '#CBD5E1',
      textStyle: { color: isDark ? '#F1F5F9' : '#0F172A', fontSize: 12, fontFamily: 'monospace' },
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const chem = params[0].name;
        const rec = currentStrategies.find((r) => r.chemistry === chem);
        return `
          <div class="font-mono text-xs p-1 space-y-1">
            <div class="font-bold text-purple-400 border-b ${isDark ? 'border-[#252B35]' : 'border-slate-200'} pb-1">${chem} (${target}) Benchmark</div>
            <div class="${isDark ? 'text-slate-300' : 'text-slate-700'}">Strategy A (Global): <span class="text-sky-500 font-bold">${rec?.rmse_strategy_A_global}</span> (R&sup2; = ${rec?.r2_strategy_A_global})</div>
            <div class="${isDark ? 'text-slate-300' : 'text-slate-700'}">Strategy B (Specific): <span class="text-emerald-500 font-bold">${rec?.rmse_strategy_B_specific}</span> (R&sup2; = ${rec?.r2_strategy_B_specific})</div>
            <div class="${isDark ? 'text-slate-300' : 'text-slate-700'}">Strategy C (Calibrated): <span class="text-purple-500 font-bold">${rec?.rmse_strategy_C_calibrated}</span> (R&sup2; = ${rec?.r2_strategy_C_calibrated})</div>
          </div>
        `;
      },
    },
    legend: {
      top: 2,
      textStyle: { color: isDark ? '#94A3B8' : '#475569', fontSize: 11, fontFamily: 'monospace' },
      data: ['Strategy A (Global)', 'Strategy B (Chemistry-Specific)', 'Strategy C (Calibrated)'],
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '18%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: chems,
      axisLine: { lineStyle: { color: isDark ? '#252B35' : '#CBD5E1' } },
      axisLabel: { color: isDark ? '#94A3B8' : '#475569', fontSize: 12, fontFamily: 'monospace', fontWeight: 'bold' },
    },
    yAxis: {
      type: 'value',
      name: isSoh ? 'RMSE (SOH)' : 'RMSE (Cycles)',
      nameTextStyle: { color: isDark ? '#94A3B8' : '#475569', fontSize: 11, fontFamily: 'monospace' },
      splitLine: { lineStyle: { color: isDark ? '#1B202A' : '#E2E8F0', type: 'dashed' } },
      axisLine: { lineStyle: { color: isDark ? '#252B35' : '#CBD5E1' } },
      axisLabel: { color: isDark ? '#94A3B8' : '#475569', fontSize: 11, fontFamily: 'monospace' },
    },
    series: [
      {
        name: 'Strategy A (Global)',
        type: 'bar',
        itemStyle: { color: isDark ? '#38BDF8' : '#0284C7', borderRadius: [2, 2, 0, 0] },
        data: stratA.map((v) => (v !== null && v !== undefined ? Number(v.toFixed(4)) : null)),
      },
      {
        name: 'Strategy B (Chemistry-Specific)',
        type: 'bar',
        itemStyle: { color: isDark ? '#10B981' : '#059669', borderRadius: [2, 2, 0, 0] },
        data: stratB.map((v) => (v !== null && v !== undefined ? Number(v.toFixed(4)) : null)),
      },
      {
        name: 'Strategy C (Calibrated)',
        type: 'bar',
        itemStyle: { color: isDark ? '#A855F7' : '#9333EA', borderRadius: [2, 2, 0, 0] },
        data: stratC.map((v) => (v !== null && v !== undefined ? Number(v.toFixed(4)) : null)),
      },
    ],
  };

  // Feature Importance horizontal bar chart
  const currentImportance = featureImportanceData
    .filter((d) => d.target.toLowerCase() === importanceTarget.toLowerCase())
    .sort((a, b) => a.importance - b.importance);

  const featureNames = currentImportance.map((d) => d.feature);
  const importanceValues = currentImportance.map((d) => (d.importance * 100).toFixed(2));
  const barColor = importanceTarget === 'soh' ? (isDark ? '#38BDF8' : '#0284C7') : (isDark ? '#A855F7' : '#9333EA');

  const importanceOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark ? '#090C11' : '#FFFFFF',
      borderColor: isDark ? '#252B35' : '#CBD5E1',
      textStyle: { color: isDark ? '#F1F5F9' : '#0F172A', fontSize: 12, fontFamily: 'monospace' },
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const item = params[0];
        return `<div class="font-mono text-xs"><b>${item.name}</b><br/>Weight: ${item.value}%</div>`;
      },
    },
    grid: {
      left: '3%',
      right: '12%',
      bottom: '5%',
      top: '5%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      name: 'Weight (%)',
      nameLocation: 'middle',
      nameGap: 24,
      nameTextStyle: { color: isDark ? '#94A3B8' : '#475569', fontSize: 11, fontFamily: 'monospace' },
      splitLine: { lineStyle: { color: isDark ? '#1B202A' : '#E2E8F0', type: 'dashed' } },
      axisLine: { lineStyle: { color: isDark ? '#252B35' : '#CBD5E1' } },
      axisLabel: { color: isDark ? '#94A3B8' : '#475569', fontSize: 11, fontFamily: 'monospace' },
    },
    yAxis: {
      type: 'category',
      data: featureNames,
      axisLine: { lineStyle: { color: isDark ? '#252B35' : '#CBD5E1' } },
      axisLabel: { color: isDark ? '#94A3B8' : '#475569', fontSize: 10, fontFamily: 'monospace' },
    },
    series: [
      {
        type: 'bar',
        data: importanceValues,
        itemStyle: { color: barColor, borderRadius: [0, 2, 2, 0] },
        label: {
          show: true,
          position: 'right',
          color: isDark ? '#94A3B8' : '#475569',
          fontSize: 10,
          fontFamily: 'monospace',
          formatter: '{c}%',
        },
      },
    ],
  };

  return (
    <div id="model-intelligence" className="space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-[var(--accent-model)]" />
          <h2 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider font-mono">
            Model Intelligence & Modeling Strategy Benchmark
          </h2>
        </div>
        <span className="text-[11px] font-mono text-[var(--text-muted)]">
          Source: strategy_comparison_results.csv & feature_importances.csv
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: 3-Strategy Benchmark */}
        <div className="scientific-panel p-4 space-y-3 bg-[var(--bg-panel)] border border-[var(--border-main)] transition-colors duration-150">
          <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-2">
            <div>
              <h3 className="text-xs font-semibold text-[var(--text-primary)] font-mono uppercase tracking-wider">
                3-Strategy Benchmark (GroupKFold Cell Splits)
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] font-sans mt-0.5">
                Global (A) vs. Specific (B) vs. Calibrated (C) architecture comparison.
              </p>
            </div>

            {/* Target toggle */}
            <div className="flex items-center gap-1 bg-[var(--bg-panel-sub)] p-0.5 rounded border border-[var(--border-sub)]">
              <button
                onClick={() => setTarget('SOH')}
                className={clsx(
                  'px-2.5 py-0.5 text-xs font-mono rounded transition-colors',
                  target === 'SOH' ? 'bg-[var(--bg-panel)] text-[var(--accent-voltage)] font-bold border border-[var(--accent-voltage)]/50' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                )}
              >
                SOH
              </button>
              <button
                onClick={() => setTarget('RUL')}
                className={clsx(
                  'px-2.5 py-0.5 text-xs font-mono rounded transition-colors',
                  target === 'RUL' ? 'bg-[var(--bg-panel)] text-[var(--accent-model)] font-bold border border-[var(--accent-model)]/50' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                )}
              >
                RUL
              </button>
            </div>
          </div>

          <ReactECharts option={strategyOption} style={{ height: '320px', width: '100%' }} notMerge />

          <div className="text-[11px] text-[var(--text-muted)] font-sans border-t border-[var(--border-main)] pt-2 flex items-start gap-1">
            <Info className="w-3.5 h-3.5 text-[var(--accent-healthy)] shrink-0 mt-0.5" />
            <span>
              <strong className="text-[var(--accent-healthy)]">Strategy B (Chemistry-Specific)</strong> achieves lowest error across all chemistries (SOH RMSE &le; 0.0285, RUL RMSE &le; 684 cycles).
            </span>
          </div>
        </div>

        {/* Right: Feature Importance Weights */}
        <div className="scientific-panel p-4 space-y-3 bg-[var(--bg-panel)] border border-[var(--border-main)] transition-colors duration-150">
          <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-2">
            <div>
              <h3 className="text-xs font-semibold text-[var(--text-primary)] font-mono uppercase tracking-wider">
                Random Forest Feature Importance Weights
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] font-sans mt-0.5">
                Relative predictive weights across all 18 engineered features.
              </p>
            </div>

            {/* Importance toggle */}
            <div className="flex items-center gap-1 bg-[var(--bg-panel-sub)] p-0.5 rounded border border-[var(--border-sub)]">
              <button
                onClick={() => setImportanceTarget('soh')}
                className={clsx(
                  'px-2.5 py-0.5 text-xs font-mono rounded transition-colors',
                  importanceTarget === 'soh' ? 'bg-[var(--bg-panel)] text-[var(--accent-voltage)] font-bold border border-[var(--accent-voltage)]/50' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                )}
              >
                SOH
              </button>
              <button
                onClick={() => setImportanceTarget('rul')}
                className={clsx(
                  'px-2.5 py-0.5 text-xs font-mono rounded transition-colors',
                  importanceTarget === 'rul' ? 'bg-[var(--bg-panel)] text-[var(--accent-model)] font-bold border border-[var(--accent-model)]/50' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                )}
              >
                RUL
              </button>
            </div>
          </div>

          <ReactECharts option={importanceOption} style={{ height: '320px', width: '100%' }} notMerge />

          <div className="text-[11px] text-[var(--text-muted)] font-sans border-t border-[var(--border-main)] pt-2 flex items-start gap-1">
            <Info className="w-3.5 h-3.5 text-[var(--accent-model)] shrink-0 mt-0.5" />
            <span>
              {importanceTarget === 'soh' ? (
                <span><strong className="text-[var(--accent-voltage)]">voltage_kurtosis</strong> dominates SOH prediction at 62.9%, followed by temperature variance (9.3%).</span>
              ) : (
                <span><strong className="text-[var(--accent-model)]">fft_energy</strong> dominates RUL prediction at 78.6%, followed by voltage skewness (7.5%).</span>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
