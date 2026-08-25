/**
 * OperatorProfileModal.tsx
 *
 * Popover/Modal displaying Operator Identity and System Status for Grid Operations.
 * Displays:
 * - Role: Grid Operations
 * - Access: Fleet Monitoring, Alerts, Analytics
 * - System: Battery Intelligence Platform v0.2.0
 * - Current Active Site: Demo BESS-01
 */

import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { UserCheck, Shield, Key, X, Server } from 'lucide-react';

export const OperatorProfileModal: React.FC = () => {
  const { isOperatorModalOpen, setOperatorModalOpen } = useAppStore();

  if (!isOperatorModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="scientific-panel w-full max-w-md p-6 space-y-5 border-2 border-[var(--border-main)] shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-sub)] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--accent-live)]/10 border border-[var(--accent-live)]/30 flex items-center justify-center text-[var(--accent-live)]">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-mono font-bold text-[var(--text-primary)]">
                OPERATOR PROFILE
              </h2>
              <div className="text-[11px] font-mono text-[var(--text-muted)]">
                E.ON Future Makers Challenge Session
              </div>
            </div>
          </div>

          <button
            onClick={() => setOperatorModalOpen(false)}
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel-sub)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Card */}
        <div className="space-y-3 font-mono text-xs">
          <div className="scientific-panel-sub p-3 space-y-2">
            <div className="flex justify-between items-center text-[var(--text-muted)] text-[10px] uppercase tracking-wider">
              <span>Role Identity</span>
              <span className="text-[var(--accent-live)] font-semibold flex items-center gap-1">
                <Shield className="w-3 h-3" /> ACTIVE
              </span>
            </div>
            <div className="text-sm font-bold text-[var(--text-primary)]">
              Grid Operations Dispatcher
            </div>
            <div className="text-[11px] text-[var(--text-secondary)]">
              ID: <span className="text-[var(--accent-voltage)] font-semibold">GO-8842-EON</span>
            </div>
          </div>

          {/* Access Permissions */}
          <div className="scientific-panel-sub p-3 space-y-2">
            <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
              <Key className="w-3 h-3 text-[var(--accent-current)]" /> Authorized System Access
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-1.5 rounded bg-[var(--bg-panel)] border border-[var(--border-sub)] text-[var(--text-primary)]">
                ✓ Fleet Monitoring
              </div>
              <div className="p-1.5 rounded bg-[var(--bg-panel)] border border-[var(--border-sub)] text-[var(--text-primary)]">
                ✓ Alert Management
              </div>
              <div className="p-1.5 rounded bg-[var(--bg-panel)] border border-[var(--border-sub)] text-[var(--text-primary)]">
                ✓ Analytics & Diagnostics
              </div>
              <div className="p-1.5 rounded bg-[var(--bg-panel)] border border-[var(--border-sub)] text-[var(--text-primary)]">
                ✓ Telemetry Acquisition
              </div>
            </div>
          </div>

          {/* System & Site Metadata */}
          <div className="scientific-panel-sub p-3 space-y-2 text-[11px]">
            <div className="flex items-center justify-between text-[var(--text-muted)] text-[10px] uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <Server className="w-3 h-3 text-[var(--accent-model)]" /> System Platform
              </span>
              <span className="text-[var(--text-primary)]">BIP v0.2.0</span>
            </div>
            <div className="flex justify-between items-center text-[var(--text-secondary)]">
              <span>Primary Site:</span>
              <span className="font-semibold text-[var(--text-primary)]">Demo BESS-01</span>
            </div>
            <div className="flex justify-between items-center text-[var(--text-secondary)]">
              <span>Telemetry Source:</span>
              <span className="font-semibold text-[var(--accent-current)]">SimulatedTelemetrySource</span>
            </div>
            <div className="flex justify-between items-center text-[var(--text-secondary)]">
              <span>Target MCU:</span>
              <span className="font-semibold text-[var(--accent-model)]">STM32F446RE</span>
            </div>
          </div>
        </div>

        {/* Footer close */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={() => setOperatorModalOpen(false)}
            className="px-4 py-1.5 rounded text-xs font-mono font-semibold bg-[var(--bg-panel-sub)] border border-[var(--border-sub)] hover:border-[var(--border-hover)] text-[var(--text-primary)] transition-all cursor-pointer"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
