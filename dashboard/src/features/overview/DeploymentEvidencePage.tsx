/**
 * DeploymentEvidencePage.tsx
 *
 * Dedicated Deployment Evidence & TinyML Registry page for Research Workspace.
 * Displays exported C model packages, target STM32 microcontroller specifications,
 * CMSIS-DSP optimization bounds, and hardware integration artifacts.
 */
import React from 'react';
import { CompactDeploymentRegistry } from './CompactDeploymentRegistry';
import { CircuitBoard, Info } from 'lucide-react';

export const DeploymentEvidencePage: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Page Header */}
      <div className="scientific-panel p-4 space-y-2 border-l-4 border-l-[var(--accent-model)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <CircuitBoard className="w-5 h-5 text-[var(--accent-model)]" />
            <div>
              <h1 className="text-base sm:text-lg font-mono font-bold text-[var(--text-primary)] tracking-tight">
                DEPLOYMENT EVIDENCE &amp; TINYML REGISTRY
              </h1>
              <p className="text-xs text-[var(--text-muted)] font-mono">
                Hardware-ready C packages, STM32 microcontroller target specifications, and embedded inference artifacts
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded bg-[var(--accent-model)]/10 text-[var(--accent-model)] border border-[var(--accent-model)]/30 font-mono text-xs font-bold uppercase">
            HARDWARE EMBEDDED C • STM32
          </span>
        </div>
      </div>

      {/* 2. Context / Explanation Banner */}
      <div className="p-3.5 rounded-lg bg-[var(--bg-panel-sub)] border border-[var(--border-sub)] flex items-start gap-3 text-xs font-sans text-[var(--text-secondary)]">
        <Info className="w-4 h-4 text-[var(--accent-model)] shrink-0 mt-0.5" />
        <div>
          <strong className="font-mono text-[var(--text-primary)] uppercase font-semibold">
            Embedded Deployment Context:
          </strong>{' '}
          Details exported C header and implementation files generated for real-time edge execution on ARM Cortex-M microcontrollers. Physics-ML feature scaling and regression trees are compiled directly into native C headers.
        </div>
      </div>

      {/* 3. Microcontroller Target Specifications Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 font-mono text-xs">
        <div className="scientific-panel p-4 space-y-1 border-l-4 border-l-[var(--accent-model)]">
          <div className="text-[10px] text-[var(--text-muted)] uppercase">TARGET HARDWARE MCU</div>
          <div className="text-xl font-bold text-[var(--accent-model)]">STM32F446RE</div>
          <div className="text-[10px] text-[var(--text-muted)]">ARM Cortex-M4 @ 180 MHz</div>
        </div>

        <div className="scientific-panel p-4 space-y-1 border-l-4 border-l-[var(--accent-healthy)]">
          <div className="text-[10px] text-[var(--text-muted)] uppercase">HARDWARE ACCELERATION</div>
          <div className="text-xl font-bold text-[var(--accent-healthy)]">Hardware FPU</div>
          <div className="text-[10px] text-[var(--text-muted)]">CMSIS-DSP Optimized</div>
        </div>

        <div className="scientific-panel p-4 space-y-1 border-l-4 border-l-[var(--accent-voltage)]">
          <div className="text-[10px] text-[var(--text-muted)] uppercase">SAMPLING METHOD</div>
          <div className="text-xl font-bold text-[var(--accent-voltage)]">Timer DMA ADC</div>
          <div className="text-[10px] text-[var(--text-muted)]">Zero-CPU Overhead Buffer</div>
        </div>

        <div className="scientific-panel p-4 space-y-1 border-l-4 border-l-[var(--accent-ripple)]">
          <div className="text-[10px] text-[var(--text-muted)] uppercase">MEMORY FOOTPRINT</div>
          <div className="text-xl font-bold text-[var(--accent-ripple)]">&lt; 32 KB Flash</div>
          <div className="text-[10px] text-[var(--text-muted)]">Static Heap Allocation</div>
        </div>
      </div>

      {/* 4. Compact Deployment Registry */}
      <CompactDeploymentRegistry />
    </div>
  );
};
