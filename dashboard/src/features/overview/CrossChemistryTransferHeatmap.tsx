import React, { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { FeatureTransferRecord, BaselineResultRecord } from '../../types/artifacts';
import { useAppStore } from '../../store/useAppStore';
import { GitCompare, Info, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

interface CrossChemistryTransferHeatmapProps {
  transferData: FeatureTransferRecord[];
  withinData: BaselineResultRecord[];
  locoData: BaselineResultRecord[];
}

export const CrossChemistryTransferHeatmap: React.FC<CrossChemistryTransferHeatmapProps> = ({
  transferData,
  withinData,
  locoData,
}) => {
  const { theme } = useAppStore();
  const isDark = theme === 'dark';

  const [target, setTarget] = useState<'soh' | 'rul'>('soh');
  const [selectedBaselineChem, setSelectedBaselineChem] = useState<'LFP' | 'NMC' | 'LCO'>('NMC');

  // Filter transfer records by target
  const currentTransfer = useMemo(() => {
    return transferData.filter((r) => r.target.toLowerCase() === target.toLowerCase());
  }, [transferData, target]);

  // Distinct features
  const features = useMemo(() => {
    return Array.from(new Set(currentTransfer.map((r) => r.feature)));
  }, [currentTransfer]);

  const chemistries = ['LFP', 'NMC', 'LCO'];

  // Build heatmap series data: [chemIndex, featureIndex, rmse]
  const { heatmapData, minVal, maxVal } = useMemo(() => {
    const data: [number, number, number | string][] = [];
    const validNumericValues: number[] = [];

    features.forEach((feat, fIdx) => {
      chemistries.forEach((chem, cIdx) => {
        const rec = currentTransfer.find((r) => r.feature === feat && r.test_chem === chem);
        if (rec && rec.rmse !== null && rec.rmse !== undefined && !rec.is_censored) {
          const numVal = Number(rec.rmse.toFixed(4));
          data.push([cIdx, fIdx, numVal]);
          validNumericValues.push(numVal);
        } else {
          data.push([cIdx, fIdx, target === 'rul' && chem === 'LFP' ? 'Right-Censored' : 'N/A']);
        }
      });
    });

    const calculatedMin = validNumericValues.length > 0 ? Math.min(...validNumericValues) : target === 'soh' ? 0.03 : 600;
    const calculatedMax = validNumericValues.length > 0 ? Math.max(...validNumericValues) : target === 'soh' ? 0.45 : 5500;

    return {
      heatmapData: data,
      minVal: calculatedMin,
      maxVal: calculatedMax,
    };
  }, [features, chemistries, currentTransfer, target]);

  const isSoh = target === 'soh';

  const heatmapOption = {
    backgroundColor: 'transparent',
    tooltip: {
      position: 'top',
      backgroundColor: isDark ? '#090C11' : '#FFFFFF',
      borderColor: isDark ? '#252B35' : '#CBD5E1',
      textStyle: { color: isDark ? '#F1F5F9' : '#0F172A', fontSize: 12, fontFamily: 'monospace' },
      formatter: (params: any) => {
        const [cIdx, fIdx, val] = params.data;
        const chem = chemistries[cIdx];
        const feat = features[fIdx];
        const rec = currentTransfer.find((r) => r.feature === feat && r.test_chem === chem);

        if (typeof val === 'string') {
          return `
            <div class="font-mono text-xs p-1">
              <div class="font-bold text-amber-500 border-b ${isDark ? 'border-[#252B35]' : 'border-slate-200'} pb-1">${feat} &rarr; Test on ${chem}</div>
              <div class="mt-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}">Status: <span class="text-amber-500 font-bold">${val}</span></div>
              <div class="text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'} italic mt-0.5">Severson LFP cells never reached EOL; supervised RUL is undefined.</div>
            </div>
          `;
        }

        return `
          <div class="font-mono text-xs p-1">
            <div class="font-bold text-cyan-500 border-b ${isDark ? 'border-[#252B35]' : 'border-slate-200'} pb-1">${feat} &rarr; Test on ${chem}</div>
            <div class="mt-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}">LOCO RMSE: <span class="font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}">${val} ${isSoh ? '' : 'cycles'}</span></div>
            <div class="${isDark ? 'text-slate-300' : 'text-slate-700'}">LOCO R&sup2;: <span class="text-amber-500 font-bold">${rec?.r2 !== null && rec?.r2 !== undefined ? rec.r2.toFixed(4) : 'N/A'}</span></div>
            <div class="text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'} mt-0.5">Trained on: ${rec?.train_chems}</div>
          </div>
        `;
      },
    },
    grid: {
      left: '25%',
      right: '8%',
      bottom: '12%',
      top: '8%',
    },
    xAxis: {
      type: 'category',
      data: chemistries,
      splitArea: { show: true, areaStyle: { color: isDark ? ['rgba(9,12,17,0.7)', 'rgba(18,23,32,0.7)'] : ['rgba(240,244,249,0.7)', 'rgba(255,255,255,0.7)'] } },
      axisLabel: { color: isDark ? '#94A3B8' : '#475569', fontSize: 12, fontFamily: 'monospace', fontWeight: 'bold' },
      axisLine: { lineStyle: { color: isDark ? '#252B35' : '#CBD5E1' } },
    },
    yAxis: {
      type: 'category',
      data: features,
      splitArea: { show: true },
      axisLabel: { color: isDark ? '#94A3B8' : '#475569', fontSize: 11, fontFamily: 'monospace' },
      axisLine: { lineStyle: { color: isDark ? '#252B35' : '#CBD5E1' } },
    },
    visualMap: {
      min: minVal,
      max: maxVal,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '0%',
      inRange: {
        color: ['#0284c7', '#0d9488', '#eab308', '#ef4444'], // Blue/Teal (Low RMSE/Good) -> Red (High RMSE/Poor)
      },
      textStyle: { color: isDark ? '#94A3B8' : '#475569', fontSize: 10, fontFamily: 'monospace' },
    },
    series: [
      {
        name: 'LOCO Transfer RMSE',
        type: 'heatmap',
        data: heatmapData,
        label: {
          show: true,
          formatter: (params: any) => {
            const val = params.data[2];
            return typeof val === 'number' ? (isSoh ? val.toFixed(3) : Math.round(val).toString()) : 'Censored';
          },
          fontSize: 10,
          fontFamily: 'monospace',
          color: '#F1F5F9',
        },
        itemStyle: {
          borderWidth: 1,
          borderColor: isDark ? '#090C11' : '#FFFFFF',
        },
      },
    ],
  };

  // Baseline progression option
  const baselines = ['B0 (Naive)', 'B1 (Voltage)', 'B2 (Conventional)', 'B3 (Ripple-only)', 'B4 (Combined)'];
  const withinValues = baselines.map((b) => {
    const rec = withinData.find((r) => r.target.toLowerCase() === target.toLowerCase() && r.chemistry === selectedBaselineChem && r.baseline.startsWith(b.slice(0, 2)));
    return rec && rec.rmse !== undefined && rec.rmse !== null ? Number(rec.rmse.toFixed(4)) : null;
  });

  const locoValues = baselines.map((b) => {
    const rec = locoData.find((r) => r.target.toLowerCase() === target.toLowerCase() && r.chemistry === selectedBaselineChem && r.baseline.startsWith(b.slice(0, 2)));
    return rec && rec.rmse !== undefined && rec.rmse !== null ? Number(rec.rmse.toFixed(4)) : null;
  });

  const baselineOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark ? '#090C11' : '#FFFFFF',
      borderColor: isDark ? '#252B35' : '#CBD5E1',
      textStyle: { color: isDark ? '#F1F5F9' : '#0F172A', fontSize: 12, fontFamily: 'monospace' },
      axisPointer: { type: 'shadow' },
      valueFormatter: (val: number | null) => (val !== null && val !== undefined ? (isSoh ? val.toFixed(4) : `${val.toFixed(1)} cycles`) : 'N/A (Right-Censored)'),
    },
    legend: {
      top: 2,
      textStyle: { color: isDark ? '#94A3B8' : '#475569', fontSize: 11, fontFamily: 'monospace' },
      data: ['Within-Chemistry GroupKFold RMSE', 'LOCO Out-of-Distribution RMSE'],
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
      data: ['B0 (Naive)', 'B1 (Voltage)', 'B2 (Stat)', 'B3 (Ripple)', 'B4 (Full)'],
      axisLine: { lineStyle: { color: isDark ? '#252B35' : '#CBD5E1' } },
      axisLabel: { color: isDark ? '#94A3B8' : '#475569', fontSize: 10, fontFamily: 'monospace' },
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
        name: 'Within-Chemistry GroupKFold RMSE',
        type: 'bar',
        itemStyle: { color: isDark ? '#38BDF8' : '#0284C7', borderRadius: [2, 2, 0, 0] },
        data: withinValues,
      },
      {
        name: 'LOCO Out-of-Distribution RMSE',
        type: 'bar',
        itemStyle: { color: isDark ? '#C084FC' : '#9333EA', borderRadius: [2, 2, 0, 0] },
        data: locoValues,
      },
    ],
  };

  const isLfpRulCensored = target === 'rul' && selectedBaselineChem === 'LFP';

  return (
    <div id="cross-chemistry" className="space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-[var(--accent-current)]" />
          <h2 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider font-mono">
            Cross-Chemistry Transferability & LOCO Matrix
          </h2>
        </div>

        {/* SOH vs RUL Target Switch */}
        <div className="flex items-center gap-1 bg-[var(--bg-panel-sub)] p-0.5 rounded border border-[var(--border-sub)]">
          <button
            onClick={() => setTarget('soh')}
            className={clsx(
              'px-3 py-1 text-xs font-mono rounded transition-colors',
              target === 'soh' ? 'bg-[var(--bg-panel)] text-[var(--accent-voltage)] font-bold border border-[var(--accent-voltage)]/50' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            )}
          >
            SOH Transfer Matrix
          </button>
          <button
            onClick={() => setTarget('rul')}
            className={clsx(
              'px-3 py-1 text-xs font-mono rounded transition-colors',
              target === 'rul' ? 'bg-[var(--bg-panel)] text-[var(--accent-model)] font-bold border border-[var(--accent-model)]/50' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            )}
          >
            RUL Transfer Matrix
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Heatmap Matrix */}
        <div className="scientific-panel p-4 space-y-3 bg-[var(--bg-panel)] border border-[var(--border-main)] transition-colors duration-150">
          <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-2">
            <div>
              <h3 className="text-xs font-semibold text-[var(--text-primary)] font-mono uppercase tracking-wider">
                Single-Descriptor Transfer Error (LOCO RMSE)
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] font-sans mt-0.5">
                Leave-One-Chemistry-Out cross-validation test performance per descriptor.
              </p>
            </div>
            <span className="text-[10px] font-mono text-[var(--accent-ripple)]">Lower RMSE = Better Transfer</span>
          </div>

          <ReactECharts option={heatmapOption} style={{ height: '330px', width: '100%' }} notMerge />

          <div className="text-[11px] text-[var(--text-muted)] font-sans border-t border-[var(--border-main)] pt-2 flex items-start gap-1">
            <Info className="w-3.5 h-3.5 text-[var(--accent-ripple)] shrink-0 mt-0.5" />
            <span>
              <strong className="text-[var(--accent-voltage)]">voltage_kurtosis</strong> exhibits universal transfer across all chemistries (LOCO SOH RMSE = 0.0722), outperforming naive cycle index by 52%.
            </span>
          </div>
        </div>

        {/* Multi-Feature Tier Comparison (B0 to B4) */}
        <div className="scientific-panel p-4 space-y-3 bg-[var(--bg-panel)] border border-[var(--border-main)] transition-colors duration-150">
          <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-2">
            <div>
              <h3 className="text-xs font-semibold text-[var(--text-primary)] font-mono uppercase tracking-wider">
                Baseline Feature Tier Generalization
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] font-sans mt-0.5">
                Within-Chemistry vs. Out-of-Distribution LOCO error across tiers B0&ndash;B4.
              </p>
            </div>

            {/* Chemistry Selector */}
            <div className="flex items-center gap-1 bg-[var(--bg-panel-sub)] p-0.5 rounded border border-[var(--border-sub)]">
              {(['LFP', 'NMC', 'LCO'] as const).map((chem) => (
                <button
                  key={chem}
                  onClick={() => setSelectedBaselineChem(chem)}
                  className={clsx(
                    'px-2 py-0.5 text-[11px] font-mono rounded transition-colors',
                    selectedBaselineChem === chem ? 'bg-[var(--bg-panel)] text-[var(--accent-ripple)] font-bold border border-[var(--accent-ripple)]/50' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  )}
                >
                  {chem}
                </button>
              ))}
            </div>
          </div>

          {isLfpRulCensored ? (
            <div className="h-[330px] flex flex-col items-center justify-center space-y-2 p-6 text-center">
              <AlertTriangle className="w-8 h-8 text-[var(--accent-current)]" />
              <div className="font-mono text-sm text-[var(--accent-current)] font-bold">LFP RUL Right-Censored</div>
              <p className="text-xs text-[var(--text-muted)] max-w-sm font-sans">
                Severson LFP cells did not reach 80% SOH. Baseline RUL models for LFP are omitted to prevent bias.
              </p>
            </div>
          ) : (
            <ReactECharts option={baselineOption} style={{ height: '330px', width: '100%' }} notMerge />
          )}

          <div className="text-[11px] text-[var(--text-muted)] font-sans border-t border-[var(--border-main)] pt-2 flex items-start gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-[var(--accent-current)] shrink-0 mt-0.5" />
            <span>
              Out-of-distribution LOCO models experience error inflation due to domain shift, demonstrating why chemistry-specific calibration is necessary for production deployment.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
