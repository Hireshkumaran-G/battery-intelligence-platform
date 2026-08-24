import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchDeploymentSummary } from '../../api/overview';
import { StatusBadge } from '../../components/common/StatusBadge';
import { CircuitBoard, Cpu, FileCode } from 'lucide-react';

export const CompactDeploymentRegistry: React.FC = () => {
  const { data: deployment, isLoading } = useQuery({
    queryKey: ['deployment-summary'],
    queryFn: fetchDeploymentSummary,
  });

  return (
    <div id="deployment" className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider font-mono flex items-center gap-2">
          <CircuitBoard className="w-4 h-4 text-[var(--accent-model)]" />
          Edge TinyML Deployment Registry
        </h2>
        <span className="text-[11px] font-mono text-[var(--text-muted)]">
          stm32_export/ &bull; Target MCU: {deployment?.target_mcu ?? '—'}
        </span>
      </div>

      <div className="scientific-panel p-4 space-y-3 bg-[var(--bg-panel)] border border-[var(--border-main)] transition-colors duration-150">
        {/* MCU Hardware Summary Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded bg-[var(--bg-panel-sub)] border border-[var(--border-sub)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-purple-500/10 border border-purple-500/30 text-[var(--accent-model)]">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-[var(--text-primary)]">
                  Target MCU: {deployment?.target_mcu ?? '—'}
                </span>
                <StatusBadge variant="model" label="Embedded C" />
              </div>
              <p className="text-xs text-[var(--text-muted)] font-sans mt-0.5">
                ARM Cortex-M4 @ 180 MHz &bull; Hardware FPU &bull; Direct DMA ADC Sampling &bull; Auto-generated Scalers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-[var(--text-muted)] block text-[10px]">INFERENCE LATENCY:</span>
              <span className="text-[var(--text-secondary)] italic">not benchmarked</span>
            </div>
            <div className="border-l border-[var(--border-main)] pl-4">
              <span className="text-[var(--text-muted)] block text-[10px]">TOTAL MODELS:</span>
              <span className="text-[var(--text-primary)] font-semibold">
                {deployment?.total_models !== undefined ? `${deployment.total_models} Exported` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Models Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-[var(--bg-panel-sub)] rounded border border-[var(--border-sub)]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {deployment?.models.map((model) => (
              <div
                key={model.model_id}
                className="bg-[var(--bg-panel-sub)] border border-[var(--border-sub)] rounded-md p-3 hover:border-[var(--accent-model)]/40 transition-colors flex flex-col justify-between space-y-2.5"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 border-b border-[var(--border-sub)] pb-1.5">
                    <span className="font-mono font-bold text-xs text-[var(--accent-model)] truncate">
                      {model.model_name}
                    </span>
                    <StatusBadge variant="healthy" label="C READY" dot={false} />
                  </div>

                  <div className="mt-2 space-y-1 text-xs font-mono">
                    <div className="flex items-center justify-between text-[var(--text-muted)]">
                      <span>Chemistry:</span>
                      <span className="text-[var(--text-primary)]">{model.target_chemistry}</span>
                    </div>
                    <div className="flex items-center justify-between text-[var(--text-muted)]">
                      <span>Features:</span>
                      <span className="text-[var(--accent-ripple)]">{model.feature_count} Inputs</span>
                    </div>
                    <div className="flex items-center justify-between text-[var(--text-muted)]">
                      <span>Sampling Rate:</span>
                      <span className="text-[var(--text-primary)]">{model.sampling_rate_hz} Hz</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--border-sub)] flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
                  <span className="flex items-center gap-1">
                    <FileCode className="w-3 h-3 text-[var(--text-muted)]" />
                    {model.files.length} C Files
                  </span>
                  <span className="text-[var(--accent-healthy)] font-semibold">Available</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
