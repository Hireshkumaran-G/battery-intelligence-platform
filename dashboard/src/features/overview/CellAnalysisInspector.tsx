import React from 'react';
import ReactECharts from 'echarts-for-react';
import { CellCorrelationRecord } from '../../types/artifacts';
import { useAppStore } from '../../store/useAppStore';
import { Search, AlertTriangle, Sliders } from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';

interface CellAnalysisInspectorProps {
  data: CellCorrelationRecord[];
}

export const CellAnalysisInspector: React.FC<CellAnalysisInspectorProps> = ({ data }) => {
  const { selectedCellId, setSelectedCellId, selectedChemistry, theme } = useAppStore();
  const isDark = theme === 'dark';

  // Get all 6 polynomial order records for the selected cell
  const cellRecords = React.useMemo(() => {
    return data
      .filter((r) => r.cell_id === selectedCellId)
      .sort((a, b) => a.poly_order - b.poly_order);
  }, [data, selectedCellId]);

  // Primary deg 2 record
  const deg2Record = cellRecords.find((r) => r.poly_order === 2) || cellRecords[0];

  const isLfp = deg2Record?.chemistry === 'LFP';
  const isCensored = isLfp;

  // Available cells list for quick picker (filtered by active chemistry)
  const distinctCells = React.useMemo(() => {
    const map = new Map<string, { id: string; chem: string }>();
    data.forEach((r) => {
      if (selectedChemistry === 'ALL' || r.chemistry === selectedChemistry) {
        if (!map.has(r.cell_id)) {
          map.set(r.cell_id, { id: r.cell_id, chem: r.chemistry });
        }
      }
    });
    return Array.from(map.values());
  }, [data, selectedChemistry]);

  const orders = cellRecords.map((r) => `Deg ${r.poly_order}`);
  const rRaw = cellRecords.map((r) => (r.r_raw !== undefined && r.r_raw !== null ? Number(r.r_raw.toFixed(4)) : null));
  const rNorm = cellRecords.map((r) => (r.r_norm_firstcyc !== undefined && r.r_norm_firstcyc !== null ? Number(r.r_norm_firstcyc.toFixed(4)) : null));
  const snr = cellRecords.map((r) => (r.mean_snr_dB !== undefined && r.mean_snr_dB !== null ? Number(r.mean_snr_dB.toFixed(1)) : null));

  const cellOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark ? '#090C11' : '#FFFFFF',
      borderColor: isDark ? '#252B35' : '#CBD5E1',
      textStyle: { color: isDark ? '#F1F5F9' : '#0F172A', fontSize: 12, fontFamily: 'monospace' },
      axisPointer: { type: 'cross' },
      valueFormatter: (val: number | null) => (val !== null && val !== undefined ? val.toFixed(4) : 'N/A'),
    },
    legend: {
      top: 2,
      textStyle: { color: isDark ? '#94A3B8' : '#475569', fontSize: 11, fontFamily: 'monospace' },
      data: ['Normalized Ripple Correlation (r)', 'Raw Ripple Correlation (r)', 'Detrending SNR (dB)'],
    },
    grid: {
      left: '3%',
      right: '5%',
      bottom: '10%',
      top: '20%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: orders,
      axisLine: { lineStyle: { color: isDark ? '#252B35' : '#CBD5E1' } },
      axisLabel: { color: isDark ? '#94A3B8' : '#475569', fontSize: 11, fontFamily: 'monospace' },
    },
    yAxis: [
      {
        type: 'value',
        name: 'Pearson Correlation (r)',
        nameTextStyle: { color: isDark ? '#94A3B8' : '#475569', fontSize: 11, fontFamily: 'monospace' },
        min: -1.0,
        max: 1.0,
        splitLine: { lineStyle: { color: isDark ? '#1B202A' : '#E2E8F0', type: 'dashed' } },
        axisLine: { lineStyle: { color: isDark ? '#252B35' : '#CBD5E1' } },
        axisLabel: { color: isDark ? '#94A3B8' : '#475569', fontSize: 11, fontFamily: 'monospace' },
      },
      {
        type: 'value',
        name: 'SNR (dB)',
        nameTextStyle: { color: isDark ? '#94A3B8' : '#475569', fontSize: 11, fontFamily: 'monospace' },
        min: 0,
        max: 80,
        splitLine: { show: false },
        axisLine: { lineStyle: { color: isDark ? '#252B35' : '#CBD5E1' } },
        axisLabel: { color: isDark ? '#94A3B8' : '#475569', fontSize: 11, fontFamily: 'monospace' },
      },
    ],
    series: [
      {
        name: 'Normalized Ripple Correlation (r)',
        type: 'line',
        data: rNorm,
        symbol: 'circle',
        symbolSize: 7,
        lineStyle: { color: isDark ? '#38BDF8' : '#0284C7', width: 2 },
        itemStyle: { color: isDark ? '#38BDF8' : '#0284C7' },
      },
      {
        name: 'Raw Ripple Correlation (r)',
        type: 'line',
        data: rRaw,
        symbol: 'triangle',
        symbolSize: 6,
        lineStyle: { color: isDark ? '#F59E0B' : '#D97706', width: 1.5, type: 'dashed' },
        itemStyle: { color: isDark ? '#F59E0B' : '#D97706' },
      },
      {
        name: 'Detrending SNR (dB)',
        type: 'bar',
        yAxisIndex: 1,
        data: snr,
        itemStyle: { color: isDark ? 'rgba(16, 185, 129, 0.25)' : 'rgba(5, 150, 105, 0.25)', borderRadius: [2, 2, 0, 0] },
      },
    ],
  };

  return (
    <div id="cell-inspector" className="scientific-panel p-4 space-y-4 bg-[var(--bg-panel)] border border-[var(--border-main)] transition-colors duration-150">
      {/* Inspector Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-main)] pb-3">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-[var(--accent-healthy)]" />
          <h2 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider font-mono">
            Cell-Level Deep-Dive Inspector
          </h2>
        </div>

        {/* Cell Selector */}
        <div className="flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          <span className="text-xs font-mono text-[var(--text-muted)]">Selected Cell:</span>
          <select
            value={selectedCellId}
            onChange={(e) => setSelectedCellId(e.target.value)}
            className="bg-[var(--bg-panel-sub)] border border-[var(--border-sub)] rounded px-3 py-1 text-xs font-mono text-[var(--accent-ripple)] font-bold focus:outline-none focus:border-[var(--accent-ripple)] transition-colors"
          >
            {distinctCells.map((c) => (
              <option key={c.id} value={c.id}>
                {c.id} ({c.chem})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Aligned Numerical Readouts Bar */}
      {deg2Record && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs font-mono">
          <div className="bg-[var(--bg-panel-sub)] p-2.5 rounded border border-[var(--border-sub)]">
            <span className="text-[var(--text-muted)] block text-[10px] uppercase">CHEMISTRY</span>
            <span className="text-[var(--text-primary)] font-bold text-sm">{deg2Record.chemistry}</span>
          </div>

          <div className="bg-[var(--bg-panel-sub)] p-2.5 rounded border border-[var(--border-sub)]">
            <span className="text-[var(--text-muted)] block text-[10px] uppercase">TOTAL CYCLES</span>
            <span className="text-[var(--accent-ripple)] font-bold text-sm">{deg2Record.n_cycles.toLocaleString()}</span>
          </div>

          <div className="bg-[var(--bg-panel-sub)] p-2.5 rounded border border-[var(--border-sub)]">
            <span className="text-[var(--text-muted)] block text-[10px] uppercase">SOH RANGE</span>
            <span className="text-[var(--text-primary)] font-bold text-sm">
              {(deg2Record.soh_min * 100).toFixed(1)}% &rarr; {(deg2Record.soh_max * 100).toFixed(1)}%
            </span>
          </div>

          <div className="bg-[var(--bg-panel-sub)] p-2.5 rounded border border-[var(--border-sub)]">
            <span className="text-[var(--text-muted)] block text-[10px] uppercase">DEG 2 CORRELATION (r)</span>
            <span className="text-[var(--accent-current)] font-bold text-sm">{deg2Record.r_norm_firstcyc.toFixed(4)}</span>
          </div>

          <div className="bg-[var(--bg-panel-sub)] p-2.5 rounded border border-[var(--border-sub)]">
            <span className="text-[var(--text-muted)] block text-[10px] uppercase">DETRENDING SNR</span>
            <span className="text-[var(--accent-healthy)] font-bold text-sm">{deg2Record.mean_snr_dB.toFixed(1)} dB</span>
          </div>

          <div className="bg-[var(--bg-panel-sub)] p-2.5 rounded border border-[var(--border-sub)] flex flex-col justify-between">
            <span className="text-[var(--text-muted)] block text-[10px] uppercase">EOL STATUS</span>
            {isCensored ? (
              <StatusBadge variant="censored" label="Right-Censored" dot={false} />
            ) : (
              <StatusBadge variant="healthy" label="EOL Observed" dot={false} />
            )}
          </div>
        </div>
      )}

      {/* Polynomial Detrending Profile Chart */}
      <div className="bg-[var(--bg-panel-sub)] p-3 rounded border border-[var(--border-sub)] space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono text-[var(--text-primary)] font-semibold">
            Polynomial Order Sensitivity Profile ({selectedCellId})
          </span>
          <span className="text-[var(--text-muted)] font-mono text-[11px]">
            p-value = {deg2Record?.p_norm_firstcyc !== undefined && deg2Record.p_norm_firstcyc !== null ? deg2Record.p_norm_firstcyc.toExponential(2) : 'N/A'}
          </span>
        </div>

        <ReactECharts option={cellOption} style={{ height: '280px', width: '100%' }} notMerge />
      </div>

      {isCensored && (
        <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-xs text-amber-600 dark:text-amber-300 font-sans">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <span>
            <strong>Right-Censoring Protocol Notice:</strong> {selectedCellId} is from the Severson LFP dataset, which terminated cycling above 80% SOH. Because its true End-of-Life was not observed in the experimental lab, its RUL is scientifically indeterminate (NaN). Supervised RUL models exclude this cell to prevent training bias.
          </span>
        </div>
      )}
    </div>
  );
};
