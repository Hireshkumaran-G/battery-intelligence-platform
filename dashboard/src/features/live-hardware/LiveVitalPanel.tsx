/**
 * LiveVitalPanel.tsx
 *
 * Displays the three primary acquisition vitals in real time:
 * Voltage (V), Current (A), Temperature (°C).
 *
 * Design: tight engineering readout panels, not KPI cards.
 * All values come directly from TelemetryFrame — no predictions.
 */
import React from 'react';
import clsx from 'clsx';
import { Zap, Activity, Thermometer } from 'lucide-react';
import type { TelemetryFrame } from '../../types/live';

interface VitalDisplayProps {
  id:        string;
  label:     string;
  unit:      string;
  value:     number | null | undefined;
  decimals:  number;
  icon:      React.ComponentType<{ className?: string }>;
  accentClass: string;
  borderClass: string;
  subtext?:  string;
}

const VitalDisplay: React.FC<VitalDisplayProps> = ({
  id, label, unit, value, decimals, icon: Icon, accentClass, borderClass, subtext,
}) => (
  <div
    id={id}
    className={clsx(
      'scientific-panel flex-1 min-w-[140px] p-3.5 border-t-2',
      borderClass,
    )}
  >
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-1.5">
        <Icon className={clsx('w-3.5 h-3.5', accentClass)} />
        <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[var(--text-muted)]">
          {label}
        </span>
      </div>
      <span className="text-[9px] font-mono text-[var(--text-subtle)] uppercase">{unit}</span>
    </div>

    <div className="font-mono">
      {value !== null && value !== undefined ? (
        <span className={clsx('text-2xl font-bold tabular-nums', accentClass)}>
          {value.toFixed(decimals)}
        </span>
      ) : (
        <span className="text-lg text-[var(--text-subtle)]">—</span>
      )}
    </div>

    {subtext && (
      <div className="mt-1 text-[10px] font-mono text-[var(--text-subtle)]">{subtext}</div>
    )}
  </div>
);

interface LiveVitalPanelProps {
  latest: TelemetryFrame | null;
}

export const LiveVitalPanel: React.FC<LiveVitalPanelProps> = ({ latest }) => {
  const currentSign = latest?.current !== undefined && latest.current < 0 ? 'DSC' : 'CHG';

  return (
    <div className="flex flex-wrap gap-3">
      <VitalDisplay
        id="vital-voltage"
        label="Voltage"
        unit="V"
        value={latest?.voltage ?? null}
        decimals={4}
        icon={Zap}
        accentClass="text-[var(--accent-voltage)]"
        borderClass="border-t-[var(--accent-voltage)]"
      />
      <VitalDisplay
        id="vital-current"
        label="Current"
        unit="A"
        value={latest?.current ?? null}
        decimals={4}
        icon={Activity}
        accentClass="text-[var(--accent-current)]"
        borderClass="border-t-[var(--accent-current)]"
        subtext={latest ? currentSign : undefined}
      />
      <VitalDisplay
        id="vital-temperature"
        label="Temperature"
        unit="°C"
        value={latest?.temperature ?? null}
        decimals={2}
        icon={Thermometer}
        accentClass="text-[var(--accent-thermal)]"
        borderClass="border-t-[var(--accent-thermal)]"
      />
    </div>
  );
};
