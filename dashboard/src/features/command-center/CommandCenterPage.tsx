/**
 * CommandCenterPage.tsx
 *
 * BIP Command Center — BESS Fleet Surveillance & Operator Intelligence.
 * Designed for grid dispatchers and BESS asset managers (E.ON Future Makers Challenge).
 *
 * Answers immediately:
 * 1. WHAT is happening across the fleet?
 * 2. IS anything abnormal?
 * 3. HOW serious is the risk?
 * 4. WHAT action should the operator take?
 *
 * Clearly labeled DEMO ENVIRONMENT / SYNTHETIC BESS TELEMETRY.
 */

import React from 'react';
import {
  Grid,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Activity,
  ArrowRight,
  TrendingDown,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { DEMO_BESS_PACKS, DEMO_ANOMALIES, DEMO_FLEET_EVENTS } from '../../data/fleetDemoData';
import { TooltipInfo } from '../../components/common/TooltipInfo';

export const CommandCenterPage: React.FC = () => {
  const { setActiveSection, setMode, acknowledgeAlert, acknowledgedAlertIds } = useAppStore();

  const totalPacks = DEMO_BESS_PACKS.length;
  const healthyCount = DEMO_BESS_PACKS.filter((p) => p.status === 'HEALTHY').length;
  const warningCount = DEMO_BESS_PACKS.filter((p) => p.status === 'WARNING' || p.status === 'MONITORING').length;
  const criticalCount = DEMO_BESS_PACKS.filter((p) => p.status === 'CRITICAL').length;
  const avgSoh = (
    DEMO_BESS_PACKS.reduce((acc, p) => acc + p.avgSohPercent, 0) / totalPacks
  ).toFixed(1);

  const activeAnomalies = DEMO_ANOMALIES.filter((a) => !acknowledgedAlertIds.includes(a.id));

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-lg bg-[var(--bg-panel)] border border-[var(--border-main)] font-mono text-xs shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--accent-live)] animate-pulse" />
          <span className="font-bold text-[var(--text-primary)]">GRID BESS COMMAND CENTER</span>
          <span className="text-[var(--text-subtle)]">|</span>
          <span className="text-[var(--text-secondary)]">Site: Demo BESS-01</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-[var(--accent-live)]/10 text-[var(--accent-live)] font-bold text-[10px] uppercase tracking-wider border border-[var(--accent-live)]/30">
            DEMO ENVIRONMENT • SYNTHETIC BESS TELEMETRY
          </span>
        </div>
      </div>

      {/* KPI Cards Header */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Monitored Assets */}
        <div className="scientific-panel p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
            <span>MONITORED ASSETS</span>
            <Grid className="w-3.5 h-3.5 text-[var(--accent-ripple)]" />
          </div>
          <div className="text-xl font-mono font-bold text-[var(--text-primary)]">
            {totalPacks} Packs
          </div>
          <div className="text-[10px] font-mono text-[var(--text-muted)]">
            20 Monitored Cells
          </div>
        </div>

        {/* Healthy Assets */}
        <div className="scientific-panel p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
            <span>HEALTHY</span>
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent-healthy)]" />
          </div>
          <div className="text-xl font-mono font-bold text-[var(--accent-healthy)]">
            {healthyCount} Packs
          </div>
          <div className="text-[10px] font-mono text-[var(--text-muted)]">
            Normal operational state
          </div>
        </div>

        {/* Warning / Monitoring */}
        <div className="scientific-panel p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
            <span>WARNING</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-mono font-bold text-amber-400">
            {warningCount} Packs
          </div>
          <div className="text-[10px] font-mono text-[var(--text-muted)]">
            Dynamic drift flagged
          </div>
        </div>

        {/* Critical Assets */}
        <div className="scientific-panel p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
            <span>CRITICAL</span>
            <AlertOctagon className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-xl font-mono font-bold text-rose-500">
            {criticalCount} Pack
          </div>
          <div className="text-[10px] font-mono text-[var(--text-muted)]">
            Requires inspection
          </div>
        </div>

        {/* Avg Fleet SOH */}
        <div className="scientific-panel p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
            <span className="flex items-center gap-1">
              AVG FLEET SOH <TooltipInfo term="SOH" />
            </span>
            <TrendingDown className="w-3.5 h-3.5 text-[var(--accent-voltage)]" />
          </div>
          <div className="text-xl font-mono font-bold text-[var(--text-primary)]">
            {avgSoh}%
          </div>
          <div className="text-[10px] font-mono text-[var(--text-muted)]">
            Reference capacity baseline
          </div>
        </div>

        {/* Active Anomaly Alerts */}
        <div className="scientific-panel p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
            <span>ACTIVE ALERTS</span>
            <Activity className="w-3.5 h-3.5 text-[var(--accent-thermal)] animate-pulse" />
          </div>
          <div className="text-xl font-mono font-bold text-[var(--accent-thermal)]">
            {activeAnomalies.length} Active
          </div>
          <div className="text-[10px] font-mono text-[var(--text-muted)]">
            Actionable intelligence
          </div>
        </div>
      </div>

      {/* Fleet Risk Distribution */}
      <div className="scientific-panel p-4 space-y-3">
        <div className="flex items-center justify-between font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[var(--text-primary)]">BESS FLEET RISK DISTRIBUTION</span>
            <TooltipInfo term="Risk" />
          </div>
          <span className="text-[var(--text-muted)]">Site: Demo BESS-01 (5 Packs)</span>
        </div>

        {/* Risk Distribution Bar */}
        <div className="h-3 rounded-full bg-[var(--bg-panel-sub)] overflow-hidden flex border border-[var(--border-sub)]">
          <div className="h-full bg-[var(--accent-healthy)]" style={{ width: '40%' }} title="Low Risk: Pack-01, Pack-02 (40%)" />
          <div className="h-full bg-amber-400" style={{ width: '20%' }} title="Medium Risk: Pack-03 (20%)" />
          <div className="h-full bg-orange-500" style={{ width: '20%' }} title="High Risk: Pack-04 (20%)" />
          <div className="h-full bg-rose-600" style={{ width: '20%' }} title="Critical Risk: Pack-05 (20%)" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 font-mono text-[11px] text-[var(--text-secondary)] pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-healthy)]" />
            <span>Low Risk (2 Packs / 40%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>Medium Risk (1 Pack / 20%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <span>High Risk (1 Pack / 20%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
            <span>Critical Risk (1 Pack / 20%)</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Active Anomaly Action Cards & Live Stream Shortcut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Anomaly Alerts (Left 2 Columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider">
                ACTIVE ANOMALIES & RECOMMENDED ACTIONS
              </h2>
            </div>
            <button
              onClick={() => setActiveSection('anomaly-center')}
              className="text-xs font-mono text-[var(--accent-voltage)] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View Anomaly Center ({DEMO_ANOMALIES.length})</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {DEMO_ANOMALIES.map((alert) => {
            const isAck = acknowledgedAlertIds.includes(alert.id);
            return (
              <div
                key={alert.id}
                className={`scientific-panel p-4 space-y-3 transition-all ${
                  isAck ? 'opacity-60 border-l-2 border-l-[var(--text-muted)]' : 'border-l-4 border-l-amber-400'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-sub)] pb-2 font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[var(--accent-voltage)]">{alert.id}</span>
                    <span className="text-[var(--text-subtle)]">•</span>
                    <span className="font-semibold text-[var(--text-primary)]">{alert.assetId}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--bg-panel-sub)] border border-[var(--border-sub)] text-[var(--text-muted)]">
                      {alert.chemistry}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-[var(--text-muted)] flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {alert.timestamp}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        alert.severity === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          : alert.severity === 'HIGH'
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      }`}
                    >
                      {alert.severity} SEVERITY
                    </span>
                  </div>
                </div>

                {/* WHAT & WHY */}
                <div className="space-y-1.5 font-sans">
                  <div className="text-xs font-bold text-[var(--text-primary)]">
                    <span className="font-mono text-[var(--text-muted)] uppercase text-[10px] mr-1.5">[WHAT]</span>
                    {alert.title}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] font-mono leading-relaxed bg-[var(--bg-panel-sub)] p-2 rounded border border-[var(--border-sub)]">
                    <span className="text-[var(--accent-ripple)] font-bold mr-1.5">[WHY / SIGNATURE]</span>
                    {alert.signature}
                  </div>
                </div>

                {/* CONFIDENCE & RECOMMENDED ACTION */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs pt-1">
                  <div className="p-2 rounded bg-[var(--bg-panel-sub)] border border-[var(--border-sub)]">
                    <div className="text-[10px] text-[var(--text-muted)] uppercase flex items-center gap-1">
                      Model Confidence <TooltipInfo term="Confidence" />
                    </div>
                    <div className="font-bold text-[var(--accent-healthy)] text-sm mt-0.5">
                      {alert.confidencePercent}%
                    </div>
                  </div>

                  <div className="sm:col-span-2 p-2 rounded bg-[var(--bg-panel-sub)] border border-[var(--border-sub)] space-y-1">
                    <div className="text-[10px] text-[var(--accent-live)] font-bold uppercase">
                      [RECOMMENDED OPERATOR ACTION]
                    </div>
                    <div className="text-[11px] text-[var(--text-primary)] font-sans leading-tight">
                      {alert.recommendedAction}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end items-center gap-2 pt-1 font-mono text-xs">
                  <button
                    onClick={() => {
                      setMode('live');
                      setActiveSection('live-hardware');
                    }}
                    className="px-3 py-1 rounded bg-[var(--bg-panel-sub)] border border-[var(--border-sub)] hover:border-[var(--border-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer flex items-center gap-1 text-[11px]"
                  >
                    <span>INSPECT LIVE STREAM</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => acknowledgeAlert(alert.id)}
                    disabled={isAck}
                    className={`px-3 py-1 rounded transition-all cursor-pointer font-bold text-[11px] ${
                      isAck
                        ? 'bg-[var(--bg-panel-sub)] text-[var(--text-subtle)] border border-[var(--border-sub)] cursor-not-allowed'
                        : 'bg-[var(--accent-live)]/20 text-[var(--accent-live)] border border-[var(--accent-live)]/40 hover:bg-[var(--accent-live)]/30'
                    }`}
                  >
                    {isAck ? '✓ ACKNOWLEDGED' : 'ACKNOWLEDGE ALERT'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Live Stream Connection & Recent Events */}
        <div className="space-y-4">
          {/* Live Telemetry Stream Card */}
          <div className="scientific-panel p-4 space-y-3">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-[var(--accent-live)]" /> LIVE HARDWARE STREAM
              </span>
              <span className="w-2 h-2 rounded-full bg-[var(--accent-live)] animate-pulse" />
            </div>

            <p className="text-xs text-[var(--text-secondary)] font-sans leading-relaxed">
              Acquisition-layer real-time telemetry stream from <span className="font-mono text-[var(--accent-live)] font-semibold">SimulatedTelemetrySource</span> (10 Hz sample rate).
            </p>

            <div className="scientific-panel-sub p-3 space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between text-[var(--text-muted)]">
                <span>ACTIVE SOURCE:</span>
                <span className="text-[var(--accent-live)] font-semibold">Simulator / STM32</span>
              </div>
              <div className="flex justify-between text-[var(--text-muted)]">
                <span>PROTOCOL:</span>
                <span className="text-[var(--text-primary)]">WebSocket / JSON</span>
              </div>
              <div className="flex justify-between text-[var(--text-muted)]">
                <span>RING BUFFER:</span>
                <span className="text-[var(--text-primary)]">500 TelemetryFrames</span>
              </div>
            </div>

            <button
              onClick={() => {
                setMode('live');
                setActiveSection('live-hardware');
              }}
              className="w-full py-2 rounded font-mono font-semibold text-xs bg-[var(--accent-live)] text-slate-950 hover:brightness-110 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>OPEN LIVE HARDWARE DASHBOARD</span>
            </button>
          </div>

          {/* Recent Event Feed */}
          <div className="scientific-panel p-4 space-y-3">
            <div className="flex items-center justify-between font-mono text-xs border-b border-[var(--border-sub)] pb-2">
              <span className="font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[var(--accent-voltage)]" /> RECENT EVENT LOG
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">LOGGED EVENT FEED</span>
            </div>

            <div className="space-y-2 font-mono text-[11px]">
              {DEMO_FLEET_EVENTS.map((evt) => (
                <div
                  key={evt.id}
                  className="p-2 rounded bg-[var(--bg-panel-sub)] border border-[var(--border-sub)] space-y-0.5"
                >
                  <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                    <span>{evt.timestamp}</span>
                    <span
                      className={`font-semibold ${
                        evt.type === 'ALERT'
                          ? 'text-rose-400'
                          : evt.type === 'WARNING'
                          ? 'text-amber-400'
                          : 'text-[var(--accent-live)]'
                      }`}
                    >
                      {evt.type}
                    </span>
                  </div>
                  <div className="text-[11px] text-[var(--text-primary)] font-sans leading-tight">
                    {evt.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
