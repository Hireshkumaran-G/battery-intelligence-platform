import React, { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { SignedVsAbsRecord, SensitivityStudyRecord, SignReversalPhysicsRecord, InteractionStatRecord } from '../../types/artifacts';
import { useAppStore } from '../../store/useAppStore';
import { Zap, Activity, Info } from 'lucide-react';
import clsx from 'clsx';

interface DynamicSignatureWorkbenchProps {
  signedVsAbs: SignedVsAbsRecord[];
  sensitivity: SensitivityStudyRecord[];
  signReversalSummary: SignReversalPhysicsRecord[];
  interactionStats: InteractionStatRecord[];
}

export const DynamicSignatureWorkbench: React.FC<DynamicSignatureWorkbenchProps> = ({
  signedVsAbs,
  sensitivity,
  signReversalSummary,
  interactionStats,
}) => {
  const { theme } = useAppStore();
  const isDark = theme === 'dark';
  const [metricMode, setMetricMode] = useState<'signed_r' | 'abs_r' | 'snr'>('signed_r');

  const degrees = [1, 2, 3, 4, 5, 6];

  const lfpSignedRecords = degrees.map((d) => signedVsAbs.find((r) => r.chemistry === 'LFP' && r.degree === d));
  const nmcSignedRecords = degrees.map((d) => signedVsAbs.find((r) => r.chemistry === 'NMC' && r.degree === d));
  const lcoSignedRecords = degrees.map((d) => signedVsAbs.find((r) => r.chemistry === 'LCO' && r.degree === d));

  const lfpSnrRecords = degrees.map((d) => sensitivity.find((s) => s.chemistry === 'LFP' && s.poly_order === d));
  const nmcSnrRecords = degrees.map((s_deg) => sensitivity.find((s) => s.chemistry === 'NMC' && s.poly_order === s_deg));
  const lcoSnrRecords = degrees.map((s_deg) => sensitivity.find((s) => s.chemistry === 'LCO' && s.poly_order === s_deg));

  const getSeriesData = (chem: 'LFP' | 'NMC' | 'LCO') => {
    if (metricMode === 'snr') {
      const records = chem === 'LFP' ? lfpSnrRecords : chem === 'NMC' ? nmcSnrRecords : lcoSnrRecords;
      return records.map((r) => (r && r.mean_snr_dB !== undefined && r.mean_snr_dB !== null ? Number(r.mean_snr_dB.toFixed(2)) : null));
    }
    const records = chem === 'LFP' ? lfpSignedRecords : chem === 'NMC' ? nmcSignedRecords : lcoSignedRecords;
    return records.map((r) => {
      if (!r) return null;
      const val = metricMode === 'signed_r' ? r.mean_signed_r : r.mean_abs_r;
      return val !== undefined && val !== null ? Number(val.toFixed(4)) : null;
    });
  };

  const fStatRecord = interactionStats.length >= 3 ? interactionStats[2].f_stat_vs_prev : null;
  const fStatStr = fStatRecord !== null && fStatRecord !== undefined ? fStatRecord.toFixed(2) : '—';

  const correlationOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark ? '#090C11' : '#FFFFFF',
      borderColor: isDark ? '#252B35' : '#CBD5E1',
      textStyle: { color: isDark ? '#F1F5F9' : '#0F172A', fontSize: 12, fontFamily: 'monospace' },
      axisPointer: { type: 'cross' },
      valueFormatter: (value: number | null) => (value !== null && value !== undefined ? (metricMode === 'snr' ? `${value.toFixed(2)} dB` : value.toFixed(4)) : 'N/A'),
    },
    legend: {
      top: 2,
      textStyle: { color: isDark ? '#94A3B8' : '#475569', fontSize: 11, fontFamily: 'monospace' },
      data: ['LFP (Severson)', 'NMC (Oxford - Sign Reversal)', 'LCO (NASA Ames)'],
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
      name: 'Polynomial Order',
      nameLocation: 'middle',
      nameGap: 24,
      nameTextStyle: { color: isDark ? '#94A3B8' : '#475569', fontSize: 11, fontFamily: 'monospace' },
      data: ['Deg 1', 'Deg 2 (Canonical)', 'Deg 3', 'Deg 4', 'Deg 5', 'Deg 6'],
      axisLine: { lineStyle: { color: isDark ? '#252B35' : '#CBD5E1' } },
      axisLabel: { color: isDark ? '#94A3B8' : '#475569', fontSize: 11, fontFamily: 'monospace' },
    },
    yAxis: {
      type: 'value',
      name: metricMode === 'snr' ? 'Detrending SNR (dB)' : metricMode === 'abs_r' ? 'Absolute |r|' : 'Signed Pearson r',
      nameTextStyle: { color: isDark ? '#94A3B8' : '#475569', fontSize: 11, fontFamily: 'monospace' },
      min: metricMode === 'snr' ? 20 : metricMode === 'abs_r' ? 0 : -1.0,
      max: metricMode === 'snr' ? 75 : 1.0,
      splitLine: { lineStyle: { color: isDark ? '#1B202A' : '#E2E8F0', type: 'dashed' } },
      axisLine: { lineStyle: { color: isDark ? '#252B35' : '#CBD5E1' } },
      axisLabel: { color: isDark ? '#94A3B8' : '#475569', fontSize: 11, fontFamily: 'monospace' },
    },
    series: [
      {
        name: 'LFP (Severson)',
        type: 'line',
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: isDark ? '#38BDF8' : '#0284C7', width: 2 },
        itemStyle: { color: isDark ? '#38BDF8' : '#0284C7' },
        data: getSeriesData('LFP'),
      },
      {
        name: 'NMC (Oxford - Sign Reversal)',
        type: 'line',
        symbol: 'rect',
        symbolSize: 7,
        lineStyle: { color: isDark ? '#F59E0B' : '#D97706', width: 2 },
        itemStyle: { color: isDark ? '#F59E0B' : '#D97706' },
        data: getSeriesData('NMC'),
      },
      {
        name: 'LCO (NASA Ames)',
        type: 'line',
        symbol: 'triangle',
        symbolSize: 7,
        lineStyle: { color: isDark ? '#F43F5E' : '#E11D48', width: 2 },
        itemStyle: { color: isDark ? '#F43F5E' : '#E11D48' },
        data: getSeriesData('LCO'),
      },
    ],
  };

  // Physical Delta chart options
  const deltaParams = ['delta_ripple_rms_deg2', 'delta_voltage_mean', 'delta_voltage_kurtosis'];
  const paramLabels = ['Δ Ripple RMS', 'Δ V Mean (V)', 'Δ V Kurtosis'];

  const physicalDeltaOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark ? '#090C11' : '#FFFFFF',
      borderColor: isDark ? '#252B35' : '#CBD5E1',
      textStyle: { color: isDark ? '#F1F5F9' : '#0F172A', fontSize: 12, fontFamily: 'monospace' },
      axisPointer: { type: 'shadow' },
    },
    legend: {
      top: 2,
      textStyle: { color: isDark ? '#94A3B8' : '#475569', fontSize: 11, fontFamily: 'monospace' },
      data: ['LFP (Cell 0)', 'NMC (Cell 1)', 'LCO (B0005)'],
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
      data: paramLabels,
      axisLine: { lineStyle: { color: isDark ? '#252B35' : '#CBD5E1' } },
      axisLabel: { color: isDark ? '#94A3B8' : '#475569', fontSize: 11, fontFamily: 'monospace' },
    },
    yAxis: {
      type: 'value',
      name: 'Shift Value (Late SOH - Early SOH)',
      nameTextStyle: { color: isDark ? '#94A3B8' : '#475569', fontSize: 10, fontFamily: 'monospace' },
      splitLine: { lineStyle: { color: isDark ? '#1B202A' : '#E2E8F0', type: 'dashed' } },
      axisLine: { lineStyle: { color: isDark ? '#252B35' : '#CBD5E1' } },
      axisLabel: { color: isDark ? '#94A3B8' : '#475569', fontSize: 10, fontFamily: 'monospace' },
    },
    series: [
      {
        name: 'LFP (Cell 0)',
        type: 'bar',
        itemStyle: { color: isDark ? '#38BDF8' : '#0284C7', borderRadius: [2, 2, 0, 0] },
        data: deltaParams.map((p) => {
          const row = signReversalSummary.find((r) => r.chemistry === 'LFP');
          return row && (row as any)[p] !== undefined ? Number((row as any)[p]).toFixed(4) : null;
        }),
      },
      {
        name: 'NMC (Cell 1)',
        type: 'bar',
        itemStyle: { color: isDark ? '#F59E0B' : '#D97706', borderRadius: [2, 2, 0, 0] },
        data: deltaParams.map((p) => {
          const row = signReversalSummary.find((r) => r.chemistry === 'NMC');
          return row && (row as any)[p] !== undefined ? Number((row as any)[p]).toFixed(4) : null;
        }),
      },
      {
        name: 'LCO (B0005)',
        type: 'bar',
        itemStyle: { color: isDark ? '#F43F5E' : '#E11D48', borderRadius: [2, 2, 0, 0] },
        data: deltaParams.map((p) => {
          const row = signReversalSummary.find((r) => r.chemistry === 'LCO');
          return row && (row as any)[p] !== undefined ? Number((row as any)[p]).toFixed(4) : null;
        }),
      },
    ],
  };

  return (
    <div id="dynamic-signatures" className="space-y-3">
      {/* Instrument Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[var(--accent-ripple)]" />
          <h2 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider font-mono">
            Dynamic Ripple Signatures & NMC Sign Reversal Mechanics
          </h2>
        </div>
        <div className="text-[11px] font-mono text-[var(--accent-ripple)] bg-[var(--bg-panel-sub)] px-2.5 py-0.5 rounded border border-[var(--border-sub)]">
          ANOVA Interaction: F = {fStatStr} (p &lt; 0.0001)
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Instrument: Signed vs Abs Correlation Across Orders 1-6 */}
        <div className="scientific-panel p-4 space-y-3 bg-[var(--bg-panel)] border border-[var(--border-main)] transition-colors duration-150">
          <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-2">
            <div>
              <h3 className="text-xs font-semibold text-[var(--text-primary)] font-mono uppercase tracking-wider">
                {metricMode === 'snr'
                  ? 'Polynomial Detrending SNR (dB)'
                  : metricMode === 'abs_r'
                  ? 'Absolute Pearson Correlation (|r|)'
                  : 'Signed Pearson Correlation (r)'}
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] font-sans mt-0.5">
                {metricMode === 'snr'
                  ? 'Signal-to-Noise Ratio (dB) vs. polynomial detrending degree across chemistries.'
                  : 'Evaluates association between ripple amplitude and capacity across degrees 1 to 6.'}
              </p>
            </div>

            {/* 3-Way Metric Mode Switcher */}
            <div className="flex items-center gap-1 bg-[var(--bg-panel-sub)] p-0.5 rounded border border-[var(--border-sub)]">
              <button
                onClick={() => setMetricMode('signed_r')}
                className={clsx(
                  'px-2 py-0.5 text-[11px] font-mono rounded transition-colors',
                  metricMode === 'signed_r' ? 'bg-[var(--bg-panel)] text-[var(--accent-ripple)] font-bold border border-[var(--accent-ripple)]/50' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                )}
              >
                Signed r
              </button>
              <button
                onClick={() => setMetricMode('abs_r')}
                className={clsx(
                  'px-2 py-0.5 text-[11px] font-mono rounded transition-colors',
                  metricMode === 'abs_r' ? 'bg-[var(--bg-panel)] text-[var(--accent-ripple)] font-bold border border-[var(--accent-ripple)]/50' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                )}
              >
                |r| Abs
              </button>
              <button
                onClick={() => setMetricMode('snr')}
                className={clsx(
                  'px-2 py-0.5 text-[11px] font-mono rounded transition-colors',
                  metricMode === 'snr' ? 'bg-[var(--bg-panel)] text-[var(--accent-healthy)] font-bold border border-[var(--accent-healthy)]/50' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                )}
              >
                SNR (dB)
              </button>
            </div>
          </div>

          <ReactECharts option={correlationOption} style={{ height: '290px', width: '100%' }} notMerge />

          <div className="text-[11px] text-[var(--text-muted)] font-sans border-t border-[var(--border-main)] pt-2 flex items-start gap-1">
            <Info className="w-3.5 h-3.5 text-[var(--accent-current)] shrink-0 mt-0.5" />
            <span>
              <strong className="text-[var(--accent-current)]">Sign Reversal Discovery:</strong> Degree 2 yields strong correlation across all chemistries (|r| &ge; 0.69), with negative slope in LFP (r = &minus;0.69) and LCO (r = &minus;0.97), but positive slope in NMC (r = +0.95).
            </span>
          </div>
        </div>

        {/* Right Instrument: Physical Parameter Shift Comparison */}
        <div className="scientific-panel p-4 space-y-3 bg-[var(--bg-panel)] border border-[var(--border-main)] transition-colors duration-150">
          <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-2">
            <div>
              <h3 className="text-xs font-semibold text-[var(--text-primary)] font-mono uppercase tracking-wider">
                Physical Degradation Shift Comparison
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] font-sans mt-0.5">
                Measured delta values (&Delta; = Late SOH &minus; Early SOH) per representative cell.
              </p>
            </div>
            <Activity className="w-4 h-4 text-[var(--accent-model)]" />
          </div>

          <ReactECharts option={physicalDeltaOption} style={{ height: '290px', width: '100%' }} notMerge />

          <div className="text-[11px] text-[var(--text-muted)] font-sans border-t border-[var(--border-main)] pt-2 flex items-start gap-1">
            <Info className="w-3.5 h-3.5 text-[var(--accent-ripple)] shrink-0 mt-0.5" />
            <span>
              In NMC, severe impedance growth along its steep OCV slope causes voltage variance (&sigma;<sub>V</sub>) and ripple to expand rapidly, reversing the correlation sign compared to the flat LFP plateau.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
