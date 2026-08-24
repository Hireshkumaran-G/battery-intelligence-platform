import React from 'react';
import { Database, Cpu, Sun, Moon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchHealth, fetchOverviewSummary, fetchDeploymentSummary } from '../../api/overview';
import { useAppStore } from '../../store/useAppStore';

export const Topbar: React.FC = () => {
  const { theme, toggleTheme } = useAppStore();

  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    refetchInterval: 30000,
  });

  const { data: summary } = useQuery({
    queryKey: ['overview-summary'],
    queryFn: fetchOverviewSummary,
  });

  const { data: deployment } = useQuery({
    queryKey: ['deployment-summary'],
    queryFn: fetchDeploymentSummary,
  });

  const manuscriptTitle =
    'Embedded Battery Degradation Monitoring Hardware System with Timer Triggered DMA Double-Buffer Acquisition and Ripple-Feature Extraction Circuit on ARM Cortex-M Microcontroller';

  return (
    <header className="sticky top-0 z-30 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 select-none bg-[var(--bg-topbar)] border-b border-[var(--border-main)] transition-colors duration-150 w-full">
      {/* Brand & Exact Manuscript Title */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-sans font-bold text-sm sm:text-base tracking-tight text-[var(--text-primary)] whitespace-nowrap">
            Battery Intelligence Platform
          </span>
        </div>
        <span className="text-[var(--border-main)] hidden md:inline">|</span>
        <span
          className="text-xs text-[var(--text-muted)] font-sans truncate cursor-help hidden sm:inline"
          title={manuscriptTitle}
        >
          {manuscriptTitle}
        </span>
      </div>

      {/* Engineering Status Readouts & Theme Toggle */}
      <div className="flex items-center gap-2.5 shrink-0 text-xs font-mono">
        {/* Dataset Counter */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--bg-panel-sub)] border border-[var(--border-sub)] text-[var(--text-secondary)] text-[11px]">
          <Database className="w-3 h-3 text-[var(--accent-ripple)]" />
          <span className="font-semibold text-[var(--text-primary)]">{summary?.total_cells ?? 20} Cells</span>
          <span className="text-[var(--border-main)]">•</span>
          <span className="text-[var(--accent-voltage)]">LFP: 8</span>
          <span className="text-[var(--border-main)]">•</span>
          <span className="text-[var(--accent-current)]">NMC: 8</span>
          <span className="text-[var(--border-main)]">•</span>
          <span className="text-[var(--accent-thermal)]">LCO: 4</span>
        </div>

        {/* Embedded Target MCU */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--bg-panel-sub)] border border-[var(--border-sub)] text-[11px] text-[var(--text-muted)]">
          <Cpu className="w-3 h-3 text-[var(--accent-model)]" />
          <span>MCU:</span>
          <span className="text-[var(--text-primary)] font-semibold">{deployment?.target_mcu ?? 'STM32F446RE'}</span>
        </div>

        {/* Backend Connectivity Status */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--bg-panel-sub)] border border-[var(--border-sub)] text-[11px]">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              health?.status === 'healthy' ? 'bg-[var(--accent-healthy)] animate-pulse' : 'bg-[var(--accent-current)]'
            }`}
          />
          <span className={health?.status === 'healthy' ? 'text-[var(--text-secondary)]' : 'text-[var(--accent-current)]'}>
            {health?.status === 'healthy' ? 'FastAPI Connected' : 'Connecting...'}
          </span>
        </div>

        {/* Theme Toggle Button (Light / Dark Mode) */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          className="p-1.5 px-2 rounded-md bg-[var(--bg-panel-sub)] border border-[var(--border-sub)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
        >
          {theme === 'dark' ? (
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-slate-700" />
          )}
          <span className="text-[10px] font-mono uppercase font-semibold">
            {theme === 'dark' ? 'Light' : 'Dark'}
          </span>
        </button>
      </div>
    </header>
  );
};
