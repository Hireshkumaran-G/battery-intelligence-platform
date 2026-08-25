/**
 * AnomalyCenterPage.tsx
 *
 * Anomaly Center — Actionable early-warning intelligence for Grid Operations.
 * Structures every anomaly card into:
 * 1. WHAT: Anomaly title & asset context
 * 2. WHY: Physics-informed dynamic signature
 * 3. SEVERITY: NORMAL / LOW / MEDIUM / HIGH / CRITICAL
 * 4. CONFIDENCE: Model statistical confidence %
 * 5. RECOMMENDED ACTION: Operational guidance
 */

import React from 'react';
import { ShieldAlert, AlertTriangle, Clock, CheckCircle, ExternalLink } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { DEMO_ANOMALIES } from '../../data/fleetDemoData';
import { TooltipInfo } from '../../components/common/TooltipInfo';

export const AnomalyCenterPage: React.FC = () => {
  const { setMode, setActiveSection, setSelectedBessPack, acknowledgeAlert, acknowledgedAlertIds } = useAppStore();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg bg-[var(--bg-panel)] border border-[var(--border-main)] font-mono text-xs">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[var(--accent-thermal)]" />
          <span className="font-bold text-[var(--text-primary)] text-sm">BESS ANOMALY CENTER</span>
          <span className="text-[var(--text-subtle)]">|</span>
          <span className="text-[var(--text-secondary)]">Advisory Surveillance & Early Warning Layer</span>
        </div>
        <div className="px-2.5 py-0.5 rounded bg-[var(--accent-live)]/10 text-[var(--accent-live)] font-bold text-[10px] uppercase tracking-wider border border-[var(--accent-live)]/30">
          DEMO ENVIRONMENT • SYNTHETIC ANOMALIES
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
        <div className="scientific-panel p-3.5 space-y-1">
          <div className="text-[var(--text-muted)] text-[10px] uppercase">TOTAL DETECTED ANOMALIES</div>
          <div className="text-xl font-bold text-[var(--text-primary)]">{DEMO_ANOMALIES.length} Flags</div>
          <div className="text-[10px] text-[var(--text-muted)]">3 Active demo flags logged</div>
        </div>

        <div className="scientific-panel p-3.5 space-y-1">
          <div className="text-[var(--text-muted)] text-[10px] uppercase">ACKNOWLEDGED</div>
          <div className="text-xl font-bold text-[var(--accent-healthy)]">
            {acknowledgedAlertIds.length} Alerts
          </div>
          <div className="text-[10px] text-[var(--text-muted)]">Reviewed by Grid Operator</div>
        </div>

        <div className="scientific-panel p-3.5 space-y-1">
          <div className="text-[var(--text-muted)] text-[10px] uppercase">AVG DETECTION CONFIDENCE</div>
          <div className="text-xl font-bold text-[var(--accent-voltage)]">93.5%</div>
          <div className="text-[10px] text-[var(--text-muted)]">Physics-informed model certainty</div>
        </div>
      </div>

      {/* Anomaly Cards List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between font-mono text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h2 className="font-bold text-[var(--text-primary)] uppercase tracking-wider">
              ACTIONABLE ANOMALY INTELLIGENCE CATALOG
            </h2>
          </div>
          <span className="text-[var(--text-muted)]">Structured WHAT / WHY / SEVERITY / CONFIDENCE / ACTION</span>
        </div>

        {DEMO_ANOMALIES.map((alert) => {
          const isAck = acknowledgedAlertIds.includes(alert.id);
          return (
            <div
              key={alert.id}
              className={`scientific-panel p-5 space-y-4 transition-all ${
                isAck ? 'opacity-65 border-l-4 border-l-[var(--text-muted)]' : 'border-l-4 border-l-amber-400'
              }`}
            >
              {/* Top row */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-sub)] pb-3 font-mono text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-sm text-[var(--accent-voltage)]">{alert.id}</span>
                  <span className="text-[var(--text-subtle)]">•</span>
                  <span className="font-bold text-[var(--text-primary)]">{alert.assetId}</span>
                  {alert.cellId && (
                    <span className="text-[var(--text-secondary)] font-normal">({alert.cellId})</span>
                  )}
                  <span className="px-2 py-0.5 rounded text-[10px] bg-[var(--bg-panel-sub)] border border-[var(--border-sub)] text-[var(--text-muted)]">
                    Chemistry: {alert.chemistry}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[var(--text-muted)] text-[11px] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Detected: {alert.timestamp}
                  </span>

                  {/* Severity Pill */}
                  <span
                    className={`px-3 py-1 rounded text-xs font-mono font-bold uppercase tracking-wider ${
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

              {/* Structured 5-Step Intelligence Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left: WHAT & WHY */}
                <div className="space-y-3 font-sans">
                  <div className="p-3 rounded bg-[var(--bg-panel-sub)] border border-[var(--border-sub)] space-y-1">
                    <div className="text-[10px] font-mono font-bold text-[var(--accent-voltage)] uppercase tracking-wider">
                      [1. WHAT IS HAPPENING]
                    </div>
                    <div className="text-sm font-bold text-[var(--text-primary)] leading-tight">
                      {alert.title}
                    </div>
                  </div>

                  <div className="p-3 rounded bg-[var(--bg-panel-sub)] border border-[var(--border-sub)] space-y-1 font-mono text-xs">
                    <div className="text-[10px] font-bold text-[var(--accent-ripple)] uppercase tracking-wider">
                      [2. WHY / DETECTED PHYSICAL SIGNATURE]
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                      {alert.signature}
                    </div>
                  </div>
                </div>

                {/* Right: INTERPRETATION & ACTION */}
                <div className="space-y-3 font-sans">
                  <div className="p-3 rounded bg-[var(--bg-panel-sub)] border border-[var(--border-sub)] space-y-1 font-mono text-xs">
                    <div className="text-[10px] font-bold text-[var(--accent-model)] uppercase tracking-wider">
                      [3. POSSIBLE PHYSICAL INTERPRETATION]
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-sans">
                      {alert.interpretation}
                    </div>
                  </div>

                  <div className="p-3 rounded bg-[var(--bg-panel-sub)] border border-[var(--border-sub)] space-y-1 font-mono text-xs">
                    <div className="text-[10px] font-bold text-[var(--accent-live)] uppercase tracking-wider flex items-center justify-between">
                      <span>[4. RECOMMENDED OPERATOR ACTION]</span>
                      <span className="flex items-center gap-1 text-[var(--accent-healthy)] font-normal text-[10px]">
                        CONFIDENCE: {alert.confidencePercent}% <TooltipInfo term="Confidence" />
                      </span>
                    </div>
                    <div className="text-xs text-[var(--text-primary)] font-bold leading-normal font-sans">
                      {alert.recommendedAction}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="flex flex-wrap justify-between items-center gap-2 pt-2 border-t border-[var(--border-sub)] font-mono text-xs">
                <div className="text-[11px] text-[var(--text-muted)]">
                  Risk Rating: <span className="font-bold text-[var(--text-primary)]">{alert.riskScore} / 100</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedBessPack(alert.assetId);
                      setMode('live');
                      setActiveSection('live-hardware');
                    }}
                    className="px-3.5 py-1.5 rounded bg-[var(--bg-panel-sub)] border border-[var(--border-sub)] hover:border-[var(--border-hover)] text-[var(--text-primary)] transition-all cursor-pointer flex items-center gap-1.5 text-[11px]"
                  >
                    <span>VIEW LIVE ASSET STREAM</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[var(--accent-live)]" />
                  </button>

                  <button
                    onClick={() => acknowledgeAlert(alert.id)}
                    disabled={isAck}
                    className={`px-4 py-1.5 rounded transition-all cursor-pointer font-bold text-[11px] flex items-center gap-1.5 ${
                      isAck
                        ? 'bg-[var(--bg-panel-sub)] text-[var(--text-subtle)] border border-[var(--border-sub)] cursor-not-allowed'
                        : 'bg-[var(--accent-live)] text-slate-950 font-bold hover:brightness-110 shadow-sm'
                    }`}
                  >
                    {isAck ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 text-[var(--accent-healthy)]" />
                        <span>ACKNOWLEDGED</span>
                      </>
                    ) : (
                      <span>ACKNOWLEDGE ALERT</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
