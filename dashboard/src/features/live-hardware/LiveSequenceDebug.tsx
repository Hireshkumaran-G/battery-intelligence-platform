/**
 * LiveSequenceDebug.tsx
 *
 * Developer panel for inspecting buffer status, sequence numbers, timestamps,
 * sample rate, and raw TelemetryFrame JSON payloads.
 */
import React, { useState } from 'react';
import clsx from 'clsx';
import { Terminal, ChevronDown, ChevronRight } from 'lucide-react';
import type { TelemetryFrame } from '../../types/live';

interface LiveSequenceDebugProps {
  latest: TelemetryFrame | null;
}

export const LiveSequenceDebug: React.FC<LiveSequenceDebugProps> = ({ latest }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="scientific-panel p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          <span className="text-xs font-mono font-semibold text-[var(--text-muted)] uppercase tracking-widest">
            Acquisition Diagnostics & Raw Frame
          </span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 text-[11px] font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
        >
          {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          <span>{isOpen ? 'Collapse Payload' : 'Expand Payload'}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
        <div className="scientific-panel-sub p-2">
          <div className="text-[9px] text-[var(--text-subtle)] uppercase">Sequence #</div>
          <div className="font-semibold text-[var(--text-primary)] tabular-nums">
            {latest?.sequence_number ?? '—'}
          </div>
        </div>

        <div className="scientific-panel-sub p-2">
          <div className="text-[9px] text-[var(--text-subtle)] uppercase">Buffer Status</div>
          <div className={clsx(
            'font-semibold uppercase',
            latest?.buffer_status === 'SIMULATED' ? 'text-[var(--accent-current)]' :
            latest?.buffer_status === 'READY' ? 'text-[var(--accent-healthy)]' :
            'text-[var(--accent-thermal)]'
          )}>
            {latest?.buffer_status ?? '—'}
          </div>
        </div>

        <div className="scientific-panel-sub p-2">
          <div className="text-[9px] text-[var(--text-subtle)] uppercase">Sample Rate</div>
          <div className="font-semibold text-[var(--text-primary)]">
            {latest ? `${latest.sample_rate.toFixed(1)} Hz` : '—'}
          </div>
        </div>

        <div className="scientific-panel-sub p-2">
          <div className="text-[9px] text-[var(--text-subtle)] uppercase">Timestamp (UTC)</div>
          <div className="font-semibold text-[var(--text-primary)] truncate">
            {latest ? new Date(latest.timestamp * 1000).toISOString().split('T')[1].replace('Z', '') : '—'}
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="scientific-panel-sub p-3 font-mono text-[11px] overflow-x-auto text-[var(--text-secondary)]">
          <div className="text-[10px] text-[var(--text-subtle)] mb-1 uppercase tracking-wider">Raw TelemetryFrame JSON</div>
          <pre className="whitespace-pre-wrap leading-relaxed">
            {latest ? JSON.stringify(latest, null, 2) : '// No frame available'}
          </pre>
        </div>
      )}
    </div>
  );
};
