import React from 'react';
import ReactECharts from 'echarts-for-react';
import { SignedVsAbsRecord } from '../../types/artifacts';

interface CorrelationComparisonChartProps {
  data: SignedVsAbsRecord[];
  className?: string;
}

export const CorrelationComparisonChart: React.FC<CorrelationComparisonChartProps> = ({
  data,
  className,
}) => {
  const degrees = [1, 2, 3, 4, 5, 6];

  const lfpSigned = degrees.map((d) => data.find((r) => r.chemistry === 'LFP' && r.degree === d)?.mean_signed_r ?? null);
  const nmcSigned = degrees.map((d) => data.find((r) => r.chemistry === 'NMC' && r.degree === d)?.mean_signed_r ?? null);
  const lcoSigned = degrees.map((d) => data.find((r) => r.chemistry === 'LCO' && r.degree === d)?.mean_signed_r ?? null);

  const lfpAbs = degrees.map((d) => data.find((r) => r.chemistry === 'LFP' && r.degree === d)?.mean_abs_r ?? null);
  const nmcAbs = degrees.map((d) => data.find((r) => r.chemistry === 'NMC' && r.degree === d)?.mean_abs_r ?? null);
  const lcoAbs = degrees.map((d) => data.find((r) => r.chemistry === 'LCO' && r.degree === d)?.mean_abs_r ?? null);

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#0f172a',
      borderColor: '#334155',
      textStyle: { color: '#f8fafc', fontSize: 12, fontFamily: 'monospace' },
      axisPointer: { type: 'cross', lineStyle: { color: '#475569' } },
      valueFormatter: (value: number | null) => (value !== null && value !== undefined ? value.toFixed(4) : 'N/A'),
    },
    legend: {
      top: 4,
      textStyle: { color: '#94a3b8', fontSize: 11 },
      itemGap: 12,
      data: [
        'LFP (Signed r)',
        'NMC (Signed r - Sign Reversal)',
        'LCO (Signed r)',
        'LFP (|r| Abs)',
        'NMC (|r| Abs)',
        'LCO (|r| Abs)',
      ],
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '8%',
      top: '20%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      name: 'Polynomial Detrending Order',
      nameLocation: 'middle',
      nameGap: 24,
      nameTextStyle: { color: '#94a3b8', fontSize: 11 },
      data: ['Degree 1', 'Degree 2', 'Degree 3', 'Degree 4', 'Degree 5', 'Degree 6'],
      axisLine: { lineStyle: { color: '#334155' } },
      axisLabel: { color: '#94a3b8', fontSize: 11, fontFamily: 'monospace' },
    },
    yAxis: {
      type: 'value',
      name: 'Pearson Correlation (r)',
      nameTextStyle: { color: '#94a3b8', fontSize: 11 },
      min: -1.0,
      max: 1.0,
      interval: 0.5,
      splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } },
      axisLine: { lineStyle: { color: '#334155' } },
      axisLabel: { color: '#94a3b8', fontSize: 11, fontFamily: 'monospace' },
    },
    series: [
      {
        name: 'LFP (Signed r)',
        type: 'line',
        data: lfpSigned,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#38bdf8', width: 2 },
        itemStyle: { color: '#38bdf8' },
      },
      {
        name: 'NMC (Signed r - Sign Reversal)',
        type: 'line',
        data: nmcSigned,
        symbol: 'rect',
        symbolSize: 6,
        lineStyle: { color: '#fbbf24', width: 2 },
        itemStyle: { color: '#fbbf24' },
      },
      {
        name: 'LCO (Signed r)',
        type: 'line',
        data: lcoSigned,
        symbol: 'triangle',
        symbolSize: 6,
        lineStyle: { color: '#f87171', width: 2 },
        itemStyle: { color: '#f87171' },
      },
      {
        name: 'LFP (|r| Abs)',
        type: 'line',
        data: lfpAbs,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { color: '#38bdf8', width: 1.5, type: 'dashed' },
        itemStyle: { color: '#38bdf8' },
      },
      {
        name: 'NMC (|r| Abs)',
        type: 'line',
        data: nmcAbs,
        symbol: 'rect',
        symbolSize: 4,
        lineStyle: { color: '#fbbf24', width: 1.5, type: 'dashed' },
        itemStyle: { color: '#fbbf24' },
      },
      {
        name: 'LCO (|r| Abs)',
        type: 'line',
        data: lcoAbs,
        symbol: 'triangle',
        symbolSize: 4,
        lineStyle: { color: '#f87171', width: 1.5, type: 'dashed' },
        itemStyle: { color: '#f87171' },
      },
    ],
  };

  return (
    <div className={className}>
      <ReactECharts option={option} style={{ height: '320px', width: '100%' }} notMerge />
    </div>
  );
};
