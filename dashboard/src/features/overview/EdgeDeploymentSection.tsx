import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchDeploymentSummary } from '../../api/overview';
import { StatusBadge } from '../../components/common/StatusBadge';
import { CircuitBoard, Cpu, FileCode } from 'lucide-react';

export const EdgeDeploymentSection: React.FC = () => {
  const { data: deployment, isLoading } = useQuery({
    queryKey: ['deployment-summary'],
    queryFn: fetchDeploymentSummary,
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-200 tracking-wide font-sans flex items-center gap-2">
          <CircuitBoard className="w-4 h-4 text-purple-400" />
          Edge TinyML Deployment Registry
        </h2>
        <span className="text-xs font-mono text-slate-400">
          Source: stm32_export/ (STM32F446RE C-Headers)
        </span>
      </div>

      <div className="scientific-panel rounded p-4 border border-slate-800 space-y-4">
        {/* MCU Target Architecture Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-slate-100">
                  Target Microcontroller: {deployment?.target_mcu || 'STM32F446RE'}
                </span>
                <StatusBadge variant="model" label="Embedded C" />
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                ARM Cortex-M4 @ 180 MHz • Hardware FPU • CMSIS DSP • Direct DMA ADC Sampling
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-500 block text-[10px]">INFERENCE LATENCY:</span>
              <span className="text-emerald-400 font-semibold">&lt; 100 &mu;s</span>
            </div>
            <div className="border-l border-slate-800 pl-4">
              <span className="text-slate-500 block text-[10px]">TOTAL MODELS:</span>
              <span className="text-slate-200 font-semibold">{deployment?.total_models || 4} Exported</span>
            </div>
          </div>
        </div>

        {/* Exported Models Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-slate-900/50 rounded border border-slate-800" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {deployment?.models.map((model) => (
              <div
                key={model.model_id}
                className="scientific-panel rounded p-3 border border-slate-800/80 hover:border-purple-500/30 transition-colors flex flex-col justify-between space-y-3 bg-slate-900/40"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 border-b border-slate-800/60 pb-2">
                    <span className="font-mono font-bold text-xs text-purple-300 truncate">
                      {model.model_name}
                    </span>
                    <StatusBadge variant="healthy" label="C READY" dot={false} />
                  </div>

                  <div className="mt-2 space-y-1 text-xs font-mono">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-slate-500">Target:</span>
                      <span className="text-slate-200">{model.target_chemistry}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-slate-500">Features:</span>
                      <span className="text-cyan-400">{model.feature_count} Inputs</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-slate-500">Sampling Rate:</span>
                      <span className="text-slate-200">{model.sampling_rate_hz} Hz</span>
                    </div>
                  </div>
                </div>

                {/* File list badge */}
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span className="flex items-center gap-1">
                    <FileCode className="w-3 h-3 text-slate-400" />
                    {model.files.length} C Artifacts
                  </span>
                  <span className="text-slate-400 hover:text-cyan-400 transition-colors cursor-default">
                    Phase 4 Inspect
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
