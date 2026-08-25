/**
 * FleetSurveillancePage.tsx
 *
 * Fleet Surveillance View — Answers: "Which battery needs attention first?"
 * Displays all BESS packs with SOH %, RUL forecast, risk classification, and operational status.
 */

import React, { useState } from 'react';
import { BarChart2, ShieldCheck, AlertTriangle, AlertOctagon, Activity, ChevronRight } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { DEMO_BESS_PACKS } from '../../data/fleetDemoData';
import { TooltipInfo } from '../../components/common/TooltipInfo';

export const FleetSurveillancePage: React.FC = () => {
  const { setSelectedBessPack, setMode, setActiveSection } = useAppStore();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredPacks = DEMO_BESS_PACKS.filter((p) => {
    if (statusFilter === 'ALL') return true;
    return p.status === statusFilter;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg bg-[var(--bg-panel)] border border-[var(--border-main)] font-mono text-xs">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-[var(--accent-voltage)]" />
          <span className="font-bold text-[var(--text-primary)] text-sm">BESS FLEET SURVEILLANCE</span>
          <span className="text-[var(--text-subtle)]">|</span>
          <span className="text-[var(--text-secondary)]">Site: Demo BESS-01 (5 Packs / 20 Cells)</span>
        </div>
        <div className="px-2.5 py-0.5 rounded bg-[var(--accent-live)]/10 text-[var(--accent-live)] font-bold text-[10px] uppercase tracking-wider border border-[var(--accent-live)]/30">
          DEMO ENVIRONMENT • SYNTHETIC FLEET METRICS
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-[var(--bg-panel-sub)] border border-[var(--border-sub)] font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[var(--text-muted)] font-semibold uppercase text-[11px]">Filter Status:</span>
          {['ALL', 'HEALTHY', 'MONITORING', 'WARNING', 'CRITICAL'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded transition-all cursor-pointer text-[11px] font-bold ${
                statusFilter === st
                  ? 'bg-[var(--bg-panel)] text-[var(--text-primary)] border border-[var(--border-main)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="text-[11px] text-[var(--text-muted)]">
          Showing {filteredPacks.length} of {DEMO_BESS_PACKS.length} Packs
        </div>
      </div>

      {/* Fleet Table */}
      <div className="scientific-panel overflow-hidden border border-[var(--border-main)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="bg-[var(--bg-panel-sub)] border-b border-[var(--border-main)] text-[var(--text-muted)] uppercase text-[10px]">
                <th className="p-3.5 pl-4">Asset / Pack ID</th>
                <th className="p-3.5">Chemistry</th>
                <th className="p-3.5">
                  <div className="flex items-center gap-1">
                    SOH (%) <TooltipInfo term="SOH" />
                  </div>
                </th>
                <th className="p-3.5">
                  <div className="flex items-center gap-1">
                    RUL Forecast <TooltipInfo term="RUL" />
                  </div>
                </th>
                <th className="p-3.5">
                  <div className="flex items-center gap-1">
                    Risk Level <TooltipInfo term="Risk" />
                  </div>
                </th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Active Alerts</th>
                <th className="p-3.5 pr-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-sub)] text-[var(--text-primary)]">
              {filteredPacks.map((pack) => (
                <tr
                  key={pack.id}
                  className="hover:bg-[var(--bg-panel-sub)]/80 transition-colors"
                >
                  <td className="p-3.5 pl-4 font-bold">
                    <div>{pack.name}</div>
                    <div className="text-[10px] text-[var(--text-muted)] font-normal">{pack.site}</div>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        pack.chemistry === 'LFP'
                          ? 'bg-[var(--accent-voltage)]/15 text-[var(--accent-voltage)]'
                          : pack.chemistry === 'NMC'
                          ? 'bg-[var(--accent-current)]/15 text-[var(--accent-current)]'
                          : 'bg-[var(--accent-thermal)]/15 text-[var(--accent-thermal)]'
                      }`}
                    >
                      {pack.chemistry} ({pack.cellCount} cells)
                    </span>
                  </td>
                  <td className="p-3.5 font-bold text-sm">
                    <span
                      className={
                        pack.avgSohPercent >= 90
                          ? 'text-[var(--accent-healthy)]'
                          : pack.avgSohPercent >= 80
                          ? 'text-amber-400'
                          : 'text-rose-500'
                      }
                    >
                      {pack.avgSohPercent}%
                    </span>
                  </td>
                  <td className="p-3.5">
                    <div>{pack.estRulCycles} cycles</div>
                    <div className="text-[10px] text-[var(--text-muted)]">~{pack.estRulDays} days remaining</div>
                  </td>
                  <td className="p-3.5 font-bold">
                    <span
                      className={
                        pack.riskLevel === 'CRITICAL'
                          ? 'text-rose-500'
                          : pack.riskLevel === 'HIGH'
                          ? 'text-orange-400'
                          : pack.riskLevel === 'MEDIUM'
                          ? 'text-amber-400'
                          : 'text-[var(--accent-healthy)]'
                      }
                    >
                      {pack.riskLevel}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center gap-1.5 font-semibold text-[11px]">
                      {pack.status === 'HEALTHY' && (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent-healthy)]" />
                          <span className="text-[var(--accent-healthy)]">Healthy</span>
                        </>
                      )}
                      {pack.status === 'MONITORING' && (
                        <>
                          <Activity className="w-3.5 h-3.5 text-[var(--accent-voltage)]" />
                          <span className="text-[var(--accent-voltage)]">Monitoring</span>
                        </>
                      )}
                      {pack.status === 'WARNING' && (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-amber-400">Warning</span>
                        </>
                      )}
                      {pack.status === 'CRITICAL' && (
                        <>
                          <AlertOctagon className="w-3.5 h-3.5 text-rose-500" />
                          <span className="text-rose-500">Critical</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="p-3.5 font-semibold">
                    {pack.activeAnomaliesCount > 0 ? (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        {pack.activeAnomaliesCount} Anomaly
                      </span>
                    ) : (
                      <span className="text-[var(--text-subtle)] text-[10px]">None</span>
                    )}
                  </td>
                  <td className="p-3.5 pr-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedBessPack(pack.id);
                        setMode('live');
                        setActiveSection('live-hardware');
                      }}
                      className="px-3 py-1 rounded bg-[var(--bg-panel-sub)] border border-[var(--border-sub)] hover:border-[var(--border-hover)] text-[var(--text-primary)] transition-all cursor-pointer flex items-center gap-1 text-[11px] ml-auto"
                    >
                      <span>INSPECT PACK</span>
                      <ChevronRight className="w-3 h-3 text-[var(--accent-live)]" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
