import React from 'react';
import clsx from 'clsx';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  icon?: LucideIcon;
  variant?: 'voltage' | 'current' | 'thermal' | 'ripple' | 'model' | 'healthy' | 'neutral';
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  subtext,
  icon: Icon,
  variant = 'neutral',
  className,
}) => {
  const accentBorders: Record<string, string> = {
    voltage: 'border-l-sky-500 hover:border-sky-500/50',
    current: 'border-l-amber-500 hover:border-amber-500/50',
    thermal: 'border-l-rose-500 hover:border-rose-500/50',
    ripple: 'border-l-cyan-500 hover:border-cyan-500/50',
    model: 'border-l-purple-500 hover:border-purple-500/50',
    healthy: 'border-l-emerald-500 hover:border-emerald-500/50',
    neutral: 'border-l-slate-700 hover:border-slate-600',
  };

  const iconColors: Record<string, string> = {
    voltage: 'text-sky-400 bg-sky-500/10',
    current: 'text-amber-400 bg-amber-500/10',
    thermal: 'text-rose-400 bg-rose-500/10',
    ripple: 'text-cyan-400 bg-cyan-500/10',
    model: 'text-purple-400 bg-purple-500/10',
    healthy: 'text-emerald-400 bg-emerald-500/10',
    neutral: 'text-slate-400 bg-slate-800',
  };

  return (
    <div
      className={clsx(
        'scientific-panel rounded p-4 border-l-2 transition-colors duration-150 flex flex-col justify-between',
        accentBorders[variant],
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-mono font-medium uppercase tracking-wider text-slate-400">
          {title}
        </span>
        {Icon && (
          <div className={clsx('p-1.5 rounded', iconColors[variant])}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1.5 my-1">
        <span className="text-2xl font-mono font-semibold text-slate-100 tracking-tight">
          {value}
        </span>
        {unit && (
          <span className="text-xs font-mono font-normal text-slate-400">
            {unit}
          </span>
        )}
      </div>

      {subtext && (
        <div className="text-xs text-slate-400 font-sans mt-1 line-clamp-1">
          {subtext}
        </div>
      )}
    </div>
  );
};
