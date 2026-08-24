import React from 'react';
import ReactECharts from 'echarts-for-react';
import { FeatureImportanceRecord } from '../../types/artifacts';

interface FeatureImportanceChartProps {
  data: FeatureImportanceRecord[];
  target: 'soh' | 'rul';
  className?: string;
}

export const FeatureImportanceChart: React.FC<FeatureImportanceChartProps> = ({
  data,
  target,
  className,
}) => {
  const targetData = data
    .filter((d) => d.target.toLowerCase() === target.toLowerCase())
    .sort((a, b) => a.importance - b.importance); // ascending for horizontal bar

  const featureNames = targetData.map((d) => d.feature);
  const importanceValues = targetData.map((d) => (d.importance * 100).toFixed(2));

  const isSoh = target.toLowerCase() === 'soh';
  const barColor = isSoh ? '#38bdf8' : '#c084fc';

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#0f172a',
      borderColor: '#334155',
      textStyle: { color: '#f8fafc', fontSize: 12, fontFamily: 'monospace' },
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const item = params[0];
        return `<div class="font-mono text-xs"><b>${item.name}</b><br/>Importance: ${item.value}%</div>`;
      },
    },
    grid: {
      left: '3%',
      right: '8%',
      bottom: '5%',
      top: '5%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      name: 'Importance (%)',
      nameLocation: 'middle',
      nameGap: 24,
      nameTextStyle: { color: '#94a3b8', fontSize: 11 },
      splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } },
      axisLine: { lineStyle: { color: '#334155' } },
      axisLabel: { color: '#94a3b8', fontSize: 11, fontFamily: 'monospace' },
    },
    yAxis: {
      type: 'category',
      data: featureNames,
      axisLine: { lineStyle: { color: '#334155' } },
      axisLabel: { color: '#94a3b8', fontSize: 11, fontFamily: 'monospace' },
    },
    series: [
      {
        type: 'bar',
        data: importanceValues,
        itemStyle: {
          color: barColor,
          borderRadius: [0, 3, 3, 0],
        },
        label: {
          show: true,
          position: 'right',
          color: '#94a3b8',
          fontSize: 10,
          fontFamily: 'monospace',
          formatter: '{c}%',
        },
      },
    ],
  };

  return (
    <div className={className}>
      <ReactECharts option={option} style={{ height: '340px', width: '100%' }} notMerge />
    </div>
  );
};
