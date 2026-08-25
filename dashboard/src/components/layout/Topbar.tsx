import React from 'react';
import { Sun, Moon, Activity, Layers, ShieldCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchHealth } from '../../api/overview';
import { useAppStore } from '../../store/useAppStore';

export const Topbar: React.FC = () => {
  const { currentWorkspace, setWorkspace, theme, toggleTheme } = useAppStore();

  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    refetchInterval: 30000,
  });

  return (
    <header className="h-[54px] px-4 sm:px-5 flex items-center justify-between gap-3 select-none bg-[var(--bg-topbar)] border-b border-[var(--border-main)] transition-colors duration-150 w-full shrink-0 z-30">
      {/* Left: Brand & Workspace Switcher */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-sans font-bold text-sm sm:text-base tracking-tight text-[var(--text-primary)] whitespace-nowrap">
            Battery Intelligence Platform
          </span>
        </div>

        {/* 3-Workspace Switcher */}
        <div className="flex items-center p-0.5 rounded-lg bg-[var(--bg-panel-sub)] border border-[var(--border-sub)] font-mono text-[11px]">
          <button
            id="ws-research-btn"
            onClick={() => setWorkspace('research')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              currentWorkspace === 'research'
                ? 'bg-[var(--bg-panel)] text-[var(--text-primary)] font-bold shadow-xs border border-[var(--border-main)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[var(--accent-thermal)]" />
            <span>RESEARCH</span>
          </button>

          <button
            id="ws-live-btn"
            onClick={() => setWorkspace('live')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              currentWorkspace === 'live'
                ? 'bg-[var(--bg-panel)] text-[var(--accent-live)] font-bold shadow-xs border border-[var(--border-main)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-[var(--accent-live)] animate-pulse" />
            <span>LIVE TRACKING</span>
          </button>

          <button
            id="ws-grid-btn"
            onClick={() => setWorkspace('grid')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              currentWorkspace === 'grid'
                ? 'bg-[var(--bg-panel)] text-[var(--accent-voltage)] font-bold shadow-xs border border-[var(--border-main)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent-voltage)]" />
            <span>GRID OPERATIONS</span>
          </button>
        </div>
      </div>

      {/* Right: Contextual System Info */}
      <div className="flex items-center gap-2 shrink-0 text-xs font-mono">
        {/* Backend API Status */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--bg-panel-sub)] border border-[var(--border-sub)] text-[11px]">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              health?.status === 'healthy' ? 'bg-[var(--accent-healthy)] animate-pulse' : 'bg-[var(--accent-current)]'
            }`}
          />
          <span className={health?.status === 'healthy' ? 'text-[var(--text-secondary)] font-semibold' : 'text-[var(--accent-current)]'}>
            API
          </span>
        </div>

        {/* Source System Status */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--bg-panel-sub)] border border-[var(--border-sub)] text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-live)] animate-pulse" />
          <span className="text-[var(--accent-live)] font-semibold uppercase">SYSTEM</span>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          className="p-1.5 px-2 rounded-md bg-[var(--bg-panel-sub)] border border-[var(--border-sub)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
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
