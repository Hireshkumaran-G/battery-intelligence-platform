import React from 'react';
import ReactECharts from 'echarts-for-react';
import { CellCorrelationRecord } from '../../types/artifacts';
import { useAppStore } from '../../store/useAppStore';
import { Layers, Info } from 'lucide-react';

interface PrimaryDegradationChartProps {
  data: CellCorrelationRecord[];
}

export const PrimaryDegradationChart: React.FC<PrimaryDegradationChartProps> = ({ data }) => {
  const { selectedChemistry, selectedCellId, setSelectedCellId, theme } = useAppStore();
  const isDark = theme === 'dark';

  // Deduplicate cells by cell_id (taking poly_order == 2 record for canonical data)
  const canonicalCells = React.useMemo(() => {
    const deg2Records = data.filter((d) => d.poly_order === 2);
    const filtered =
      selectedChemistry === 'ALL'
        ? deg2Records
        : deg2Records.filter((d) => d.chemistry === selectedChemistry);

    // Sort LFP -> NMC -> LCO, then by cell_id
    const orderMap: Record<string, number> = { LFP: 1, NMC: 2, LCO: 3 };
    return [...filtered].sort((a, b) => {
      if (a.chemistry !== b.chemistry) {
        return (orderMap[a.chemistry] || 0) - (orderMap[b.chemistry] || 0);
      }
      return a.cell_id.localeCompare(b.cell_id, undefined, { numeric: true });
    });
  }, [data, selectedChemistry]);

  const cellNames = canonicalCells.map((c) => c.cell_id);
  const sohMin = canonicalCells.map((c) => (c.soh_min * 100).toFixed(1));
  const sohMax = canonicalCells.map((c) => (c.soh_max * 100).toFixed(1));

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark ? '#090C11' : '#FFFFFF',
      borderColor: isDark ? '#252B35' : '#CBD5E1',
      textStyle: { color: isDark ? '#F1F5F9' : '#0F172A', fontSize: 12, fontFamily: 'monospace' },
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const cell = canonicalCells[params[0].dataIndex];
        if (!cell) return '';
        const isCensored = cell.chemistry === 'LFP';

        return `
          <div class="font-mono text-xs space-y-1 p-1">
            <div class="font-bold text-cyan-500 text-sm border-b ${isDark ? 'border-[#252B35]' : 'border-slate-200'} pb-1 flex items-center justify-between">
              <span>${cell.cell_id}</span>
              <span class="text-[10px] font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}">(${cell.chemistry})</span>
            </div>
            <div class="${isDark ? 'text-slate-300' : 'text-slate-700'}">Total Lifespan: <span class="font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}">${cell.n_cycles.toLocaleString()} cycles</span></div>
            <div class="${isDark ? 'text-slate-300' : 'text-slate-700'}">SOH Bounds: <span>${(cell.soh_min * 100).toFixed(1)}% &rarr; ${(cell.soh_max * 100).toFixed(1)}%</span></div>
            <div class="${isDark ? 'text-slate-300' : 'text-slate-700'}">Deg 2 Residual r: <span class="text-amber-500 font-bold">${cell.r_norm_firstcyc.toFixed(4)}</span></div>
            <div class="${isDark ? 'text-slate-300' : 'text-slate-700'}">Detrending SNR: <span class="text-emerald-500 font-bold">${cell.mean_snr_dB.toFixed(1)} dB</span></div>
            <div class="pt-1 text-[10px] ${isCensored ? 'text-amber-500 font-semibold' : 'text-emerald-500 font-semibold'}">
              ${isCensored ? '&#9679; Right-Censored (Test terminated SOH &gt; 80%)' : '&#9679; Observed EOL (SOH &le; 80%)'}
            </div>
            <div class="text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'} italic pt-0.5">Click to inspect in Cell Deep-Dive</div>
          </div>
        `;
      },
    },
    legend: {
      top: 4,
      textStyle: { color: isDark ? '#94A3B8' : '#475569', fontSize: 11, fontFamily: 'monospace' },
      data: ['Cycle Lifespan (Cycles)', 'SOH Min (%)', 'SOH Max (%)'],
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '12%',
      top: '14%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: cellNames,
      axisLabel: {
        color: (value: string) => (value === selectedCellId ? (isDark ? '#38BDF8' : '#0284C7') : (isDark ? '#94A3B8' : '#475569')),
        fontSize: 11,
        fontFamily: 'monospace',
        rotate: 35,
        fontWeight: (value: string) => (value === selectedCellId ? 'bold' : 'normal'),
      },
      axisLine: { lineStyle: { color: isDark ? '#252B35' : '#CBD5E1' } },
    },
    yAxis: [
      {
        type: 'value',
        name: 'Total Cycle Count (Cycles)',
        nameTextStyle: { color: isDark ? '#94A3B8' : '#475569', fontSize: 11, fontFamily: 'monospace' },
        splitLine: { lineStyle: { color: isDark ? '#1B202A' : '#E2E8F0', type: 'dashed' } },
        axisLine: { lineStyle: { color: isDark ? '#252B35' : '#CBD5E1' } },
        axisLabel: { color: isDark ? '#94A3B8' : '#475569', fontSize: 11, fontFamily: 'monospace' },
      },
      {
        type: 'value',
        name: 'SOH Bounds (%)',
        nameTextStyle: { color: isDark ? '#94A3B8' : '#475569', fontSize: 11, fontFamily: 'monospace' },
        min: 40,
        max: 150,
        splitLine: { show: false },
        axisLine: { lineStyle: { color: isDark ? '#252B35' : '#CBD5E1' } },
        axisLabel: { color: isDark ? '#94A3B8' : '#475569', fontSize: 11, fontFamily: 'monospace' },
      },
    ],
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100,
      },
      {
        type: 'slider',
        bottom: 2,
        height: 14,
        borderColor: isDark ? '#1B202A' : '#E2E8F0',
        fillerColor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.15)',
        textStyle: { color: isDark ? '#64748B' : '#94A3B8', fontSize: 10, fontFamily: 'monospace' },
      },
    ],
    series: [
      {
        name: 'Cycle Lifespan (Cycles)',
        type: 'bar',
        data: canonicalCells.map((c) => ({
          value: c.n_cycles,
          itemStyle: {
            color:
              c.cell_id === selectedCellId
                ? (isDark ? '#22D3EE' : '#0891B2')
                : c.chemistry === 'LFP'
                ? (isDark ? '#38BDF8' : '#0284C7')
                : c.chemistry === 'NMC'
                ? (isDark ? '#F59E0B' : '#D97706')
                : (isDark ? '#F43F5E' : '#E11D48'),
            opacity: c.cell_id === selectedCellId ? 1.0 : 0.85,
            borderRadius: [2, 2, 0, 0],
          },
        })),
      },
      {
        name: 'SOH Min (%)',
        type: 'scatter',
        yAxisIndex: 1,
        symbol: 'circle',
        symbolSize: 7,
        itemStyle: { color: isDark ? '#F43F5E' : '#E11D48' },
        data: sohMin,
      },
      {
        name: 'SOH Max (%)',
        type: 'scatter',
        yAxisIndex: 1,
        symbol: 'diamond',
        symbolSize: 7,
        itemStyle: { color: isDark ? '#10B981' : '#059669' },
        data: sohMax,
      },
    ],
  };

  const onChartClick = (params: any) => {
    if (params && params.name) {
      setSelectedCellId(params.name);
    }
  };

  return (
    <div id="degradation" className="scientific-panel p-4 space-y-3 bg-[var(--bg-panel)] border border-[var(--border-main)] transition-colors duration-150">
      {/* Compact Instrument Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-main)] pb-2.5">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[var(--accent-voltage)]" />
          <h2 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider font-mono">
            Primary Degradation & Lifespan Envelope Analysis
          </h2>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono text-[var(--text-muted)]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-[var(--accent-voltage)]" /> LFP (Severson)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-[var(--accent-current)]" /> NMC (Oxford)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-[var(--accent-thermal)]" /> LCO (NASA)
          </span>
        </div>
      </div>

      <div className="text-xs text-[var(--text-secondary)] font-sans flex items-start gap-1.5 bg-[var(--bg-panel-sub)] p-2 rounded border border-[var(--border-sub)]">
        <Info className="w-3.5 h-3.5 text-[var(--accent-ripple)] shrink-0 mt-0.5" />
        <span>
          Visualizing total cycle lifespan (n_cycles) and empirical capacity/SOH degradation bounds across all 20 verified cells. Click any cell bar to load its multi-degree polynomial detrending profile in the inspector.
        </span>
      </div>

      <ReactECharts
        option={option}
        style={{ height: '360px', width: '100%' }}
        onEvents={{ click: onChartClick }}
        notMerge
      />
    </div>
  );
};
