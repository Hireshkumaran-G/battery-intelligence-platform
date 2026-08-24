import React from 'react';
import clsx from 'clsx';
import { ChemistryProfile } from '../../types/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { BatteryCharging, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ChemistrySummaryCardsProps {
  profiles: ChemistryProfile[];
}

export const ChemistrySummaryCards: React.FC<ChemistrySummaryCardsProps> = ({ profiles }) => {
  const chemColors: Record<string, { border: string; badge: 'voltage' | 'current' | 'thermal'; title: string }> = {
    LFP: {
      border: 'border-sky-500/30 hover:border-sky-500/60',
      badge: 'voltage',
      title: 'text-sky-400',
    },
    NMC: {
      border: 'border-amber-500/30 hover:border-amber-500/60',
      badge: 'current',
      title: 'text-amber-400',
    },
    LCO: {
      border: 'border-rose-500/30 hover:border-rose-500/60',
      badge: 'thermal',
      title: 'text-rose-400',
    },
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-200 tracking-wide font-sans flex items-center gap-2">
          <BatteryCharging className="w-4 h-4 text-cyan-400" />
          Multi-Chemistry Analytical Profiles
        </h2>
        <span className="text-xs font-mono text-slate-400">
          Source: cell_correlation_audit.csv & signed_vs_abs_correlation.csv
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {profiles.map((profile) => {
          const styling = chemColors[profile.chemistry] || chemColors.LFP;

          return (
            <div
              key={profile.chemistry}
              className={clsx(
                'scientific-panel rounded p-4 border transition-all duration-150 flex flex-col justify-between space-y-4',
                styling.border
              )}
            >
              <div>
                {/* Card Header */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className={clsx('text-base font-mono font-bold', styling.title)}>
                      {profile.chemistry}
                    </span>
                    <span className="text-xs text-slate-400 font-sans truncate">
                      {profile.full_name}
                    </span>
                  </div>
                  <StatusBadge variant={styling.badge} label={`${profile.cell_count} Cells`} />
                </div>

                {/* Characteristics List */}
                <div className="mt-3 space-y-2 text-xs font-mono">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-slate-500">OCV Plateau:</span>
                    <span className="text-slate-300 text-right">{profile.voltage_plateau_type}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500">Ripple Sign:</span>
                    <span
                      className={clsx(
                        'font-bold',
                        profile.chemistry === 'NMC' ? 'text-amber-400' : 'text-slate-300'
                      )}
                    >
                      {profile.ripple_correlation_sign}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500">Deg 2 Mean Signed r:</span>
                    <span className="text-slate-200">{profile.mean_r_deg2.toFixed(4)}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500">Detrending SNR:</span>
                    <span className="text-slate-200">{profile.mean_snr_dB.toFixed(1)} dB</span>
                  </div>
                </div>

                {/* Description */}
                <p className="mt-3 text-xs text-slate-400 font-sans leading-relaxed border-t border-slate-800/60 pt-2.5">
                  {profile.description}
                </p>
              </div>

              {/* Censoring Status Indicator */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-mono">EOL Status:</span>
                {profile.eol_censored ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    Right-Censored (SOH &gt; 80%)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" />
                    EOL Observed (RUL Valid)
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
