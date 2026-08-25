/**
 * LiveSignalChart.tsx
 *
 * Rolling time-series chart showing voltage, current, and temperature
 * from the live ring-buffer.
 *
 * Uses ECharts (already in the project's package.json) via echarts-for-react.
 * Renders the last N frames from the ring-buffer as a synchronized
 * three-panel time-series.
 */
import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useAppStore } from '../../store/useAppStore';
import type { TelemetryFrame } from '../../types/live';

interface LiveSignalChartProps {
  frames: TelemetryFrame[];
  maxVisible?: number;
}

export const LiveSignalChart: React.FC<LiveSignalChartProps> = ({
  frames,
  maxVisible = 200,
}) => {
  const { theme } = useAppStore();
  const isDark = theme === 'dark';

  const visible = useMemo(
    () => frames.slice(-maxVisible),
    [frames, maxVisible],
  );

  const timestamps = useMemo(
    () => visible.map((f) => new Date(f.timestamp * 1000).toLocaleTimeString('en-GB', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    })),
    [visible],
  );

  const voltageData  = useMemo(() => visible.map((f) => f.voltage),     [visible]);
  const currentData  = useMemo(() => visible.map((f) => f.current),     [visible]);
  const tempData     = useMemo(() => visible.map((f) => f.temperature), [visible]);

  const gridColor  = isDark ? '#1B202A' : '#E2E8F0';
  const axisColor  = isDark ? '#94A3B8' : '#64748B';
  const bgColor    = 'transparent';

  const option = useMemo(() => ({
    backgroundColor: bgColor,
    animation: false,
    grid: [
      { left: 56, right: 16, top: 12,  height: '26%' },
      { left: 56, right: 16, top: '40%', height: '26%' },
      { left: 56, right: 16, top: '72%', height: '26%' },
    ],
    xAxis: [
      { type: 'category', data: timestamps, show: false, gridIndex: 0 },
      { type: 'category', data: timestamps, show: false, gridIndex: 1 },
      {
        type: 'category', data: timestamps, gridIndex: 2,
        axisLine:  { lineStyle: { color: gridColor } },
        axisLabel: { color: axisColor, fontSize: 9, fontFamily: 'monospace' },
        axisTick:  { show: false },
        splitLine: { show: false },
      },
    ],
    yAxis: [
      {
        type: 'value', gridIndex: 0,
        name: 'V', nameTextStyle: { color: '#38BDF8', fontSize: 9, fontFamily: 'monospace' },
        axisLabel: { color: '#38BDF8', fontSize: 9, fontFamily: 'monospace', formatter: (v: number) => v.toFixed(3) },
        splitLine: { lineStyle: { color: gridColor, type: 'dashed' } },
        axisLine:  { show: false }, axisTick: { show: false },
        scale: true,
      },
      {
        type: 'value', gridIndex: 1,
        name: 'A', nameTextStyle: { color: '#F59E0B', fontSize: 9, fontFamily: 'monospace' },
        axisLabel: { color: '#F59E0B', fontSize: 9, fontFamily: 'monospace', formatter: (v: number) => v.toFixed(3) },
        splitLine: { lineStyle: { color: gridColor, type: 'dashed' } },
        axisLine:  { show: false }, axisTick: { show: false },
        scale: true,
      },
      {
        type: 'value', gridIndex: 2,
        name: '°C', nameTextStyle: { color: '#F43F5E', fontSize: 9, fontFamily: 'monospace' },
        axisLabel: { color: '#F43F5E', fontSize: 9, fontFamily: 'monospace', formatter: (v: number) => v.toFixed(1) },
        splitLine: { lineStyle: { color: gridColor, type: 'dashed' } },
        axisLine:  { show: false }, axisTick: { show: false },
        scale: true,
      },
    ],
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark ? '#090C11' : '#fff',
      borderColor: isDark ? '#252B35' : '#CBD5E1',
      textStyle: { color: isDark ? '#F1F5F9' : '#0F172A', fontSize: 11, fontFamily: 'monospace' },
      formatter: (params: any[]) => {
        const t = params[0]?.axisValue ?? '';
        return params.map((p: any) => `${p.marker}${p.seriesName}: <b>${Number(p.value).toFixed(4)}</b>`).join('<br/>') + `<br/><span style="color:#64748B;font-size:10px">${t}</span>`;
      },
    },
    series: [
      {
        name: 'Voltage',
        type: 'line', smooth: false, symbol: 'none',
        xAxisIndex: 0, yAxisIndex: 0,
        data: voltageData,
        lineStyle: { color: '#38BDF8', width: 1.5 },
        areaStyle: { color: 'rgba(56,189,248,0.06)' },
        z: 2,
      },
      {
        name: 'Current',
        type: 'line', smooth: false, symbol: 'none',
        xAxisIndex: 1, yAxisIndex: 1,
        data: currentData,
        lineStyle: { color: '#F59E0B', width: 1.5 },
        areaStyle: { color: 'rgba(245,158,11,0.06)' },
        z: 2,
      },
      {
        name: 'Temperature',
        type: 'line', smooth: false, symbol: 'none',
        xAxisIndex: 2, yAxisIndex: 2,
        data: tempData,
        lineStyle: { color: '#F43F5E', width: 1.5 },
        areaStyle: { color: 'rgba(244,63,94,0.06)' },
        z: 2,
      },
    ],
  }), [timestamps, voltageData, currentData, tempData, gridColor, axisColor, isDark]);

  if (frames.length === 0) {
    return (
      <div className="scientific-panel p-4">
        <div className="text-xs font-mono font-semibold text-[var(--text-muted)] mb-3 uppercase tracking-widest">
          Live Signal — Voltage / Current / Temperature
        </div>
        <div className="h-64 flex items-center justify-center text-sm text-[var(--text-subtle)] font-mono">
          No frames received yet — connect to begin streaming
        </div>
      </div>
    );
  }

  return (
    <div className="scientific-panel p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono font-semibold text-[var(--text-muted)] uppercase tracking-widest">
          Live Signal — Voltage / Current / Temperature
        </span>
        <span className="text-[10px] font-mono text-[var(--text-subtle)]">
          Last {visible.length} frames
        </span>
      </div>
      <ReactECharts
        option={option}
        style={{ height: 320 }}
        notMerge={false}
        lazyUpdate={true}
      />
    </div>
  );
};
