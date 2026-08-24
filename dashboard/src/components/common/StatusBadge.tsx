import React from 'react';
import clsx from 'clsx';

export type StatusVariant =
  | 'healthy'
  | 'caution'
  | 'degraded'
  | 'censored'
  | 'active'
  | 'voltage'
  | 'current'
  | 'thermal'
  | 'ripple'
  | 'model';

interface StatusBadgeProps {
  variant: StatusVariant;
  label: string;
  className?: string;
  dot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  variant,
  label,
  className,
  dot = true,
}) => {
  const variantStyles: Record<StatusVariant, { bg: string; text: string; dot: string; border: string }> = {
    healthy: {
      bg: 'bg-emerald-500/10',
      text: 'text-[var(--accent-healthy)]',
      dot: 'bg-[var(--accent-healthy)]',
      border: 'border-emerald-500/30',
    },
    caution: {
      bg: 'bg-amber-500/10',
      text: 'text-[var(--accent-current)]',
      dot: 'bg-[var(--accent-current)]',
      border: 'border-amber-500/30',
    },
    degraded: {
      bg: 'bg-rose-500/10',
      text: 'text-[var(--accent-thermal)]',
      dot: 'bg-[var(--accent-thermal)]',
      border: 'border-rose-500/30',
    },
    censored: {
      bg: 'bg-[var(--bg-panel-sub)]',
      text: 'text-[var(--text-muted)]',
      dot: 'bg-[var(--text-muted)]',
      border: 'border-[var(--border-sub)]',
    },
    active: {
      bg: 'bg-cyan-500/10',
      text: 'text-[var(--accent-ripple)]',
      dot: 'bg-[var(--accent-ripple)] animate-pulse',
      border: 'border-cyan-500/30',
    },
    voltage: {
      bg: 'bg-sky-500/10',
      text: 'text-[var(--accent-voltage)]',
      dot: 'bg-[var(--accent-voltage)]',
      border: 'border-sky-500/30',
    },
    current: {
      bg: 'bg-amber-500/10',
      text: 'text-[var(--accent-current)]',
      dot: 'bg-[var(--accent-current)]',
      border: 'border-amber-500/30',
    },
    thermal: {
      bg: 'bg-rose-500/10',
      text: 'text-[var(--accent-thermal)]',
      dot: 'bg-[var(--accent-thermal)]',
      border: 'border-rose-500/30',
    },
    ripple: {
      bg: 'bg-cyan-500/10',
      text: 'text-[var(--accent-ripple)]',
      dot: 'bg-[var(--accent-ripple)]',
      border: 'border-cyan-500/30',
    },
    model: {
      bg: 'bg-purple-500/10',
      text: 'text-[var(--accent-model)]',
      dot: 'bg-[var(--accent-model)]',
      border: 'border-purple-500/30',
    },
  };

  const style = variantStyles[variant] || variantStyles.censored;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium border tracking-wide uppercase',
        style.bg,
        style.text,
        style.border,
        className
      )}
    >
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full', style.dot)} />}
      {label}
    </span>
  );
};
