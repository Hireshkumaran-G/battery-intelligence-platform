/**
 * LiveHardwarePage.tsx
 *
 * Enhanced Live Hardware Acquisition Dashboard — Grid & BESS Operator Experience.
 * Provides real-time WebSocket acquisition stream, site/asset selector,
 * Data Quality section, Current Operating State card, and Event Timeline.
 *
 * SOH and RUL are strictly excluded from TelemetryFrame by design.
 */
import React, { useState } from 'react';
import { useLiveTelemetry } from '../../hooks/useLiveTelemetry';
import { LiveConnectionBar } from './LiveConnectionBar';
import { LiveVitalPanel } from './LiveVitalPanel';
import { LiveSignalChart } from './LiveSignalChart';
import { LiveRipplePanel } from './LiveRipplePanel';
import { LiveSpectralPanel } from './LiveSpectralPanel';
import { LiveDerivativePanel } from './LiveDerivativePanel';
import { LiveSequenceDebug } from './LiveSequenceDebug';
import { Activity, Cpu, ChevronDown, Clock, Info, Check } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { DEMO_BESS_PACKS, DEMO_FLEET_EVENTS } from '../../data/fleetDemoData';
import { TooltipInfo } from '../../components/common/TooltipInfo';

export const LiveHardwarePage: React.FC = () => {
  const { selectedBessPack, setSelectedBessPack } = useAppStore();
  const [isWhyOpen, setIsWhyOpen] = useState(false);

  const {
    frames,
    latest,
    connectionState,
    sessionMeta,
    connect,
    disconnect,
    clearFrames,
  } = useLiveTelemetry();

  const activePack = DEMO_BESS_PACKS.find((p) => p.id === selectedBessPack) || DEMO_BESS_PACKS[0];

  // Derive operating state from current telemetry
  const currentVal = latest?.current ?? activePack.currentNominal;
  const opState =
    connectionState !== 'connected'
      ? 'PAUSED'
      : currentVal < -0.05
      ? 'DISCHARGING'
      : currentVal > 0.05
      ? 'CHARGING'
      : 'IDLE';

  // Data quality calculations
  const snrVal = latest?.snr;
  const signalQuality = snrVal != null ? Math.min(99.9, Math.max(80.0, 75 + snrVal * 0.8)).toFixed(1) : '98.7';
  const bufferCount = frames.length;

  return (
    <div id="live-hardware" className="space-y-6 pb-16 animate-in fade-in duration-200">
      {/* 1. Live Header & Asset Selector Bar */}
      <div className="scientific-panel p-4 space-y-3 border-l-4 border-l-[var(--accent-live)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-[var(--accent-live)] animate-pulse" />
              <h1 className="text-base sm:text-lg font-mono font-bold tracking-tight text-[var(--text-primary)]">
                LIVE HARDWARE TELEMETRY STREAM
              </h1>
            </div>
            <p className="text-xs text-[var(--text-muted)] font-mono">
              Real-time WebSocket acquisition stream — isolated engineering & acquisition layer
            </p>
          </div>

          {/* Asset Selector Dropdown */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[var(--bg-panel-sub)] px-3 py-1.5 rounded-lg border border-[var(--border-sub)] font-mono text-xs">
              <span className="text-[var(--text-muted)] font-semibold uppercase text-[11px]">SITE:</span>
              <span className="font-bold text-[var(--text-primary)]">Demo BESS-01</span>
              <span className="text-[var(--border-main)]">|</span>
              <span className="text-[var(--text-muted)] font-semibold uppercase text-[11px]">ASSET:</span>
              <select
                value={selectedBessPack}
                onChange={(e) => setSelectedBessPack(e.target.value)}
                className="bg-[var(--bg-panel)] text-[var(--accent-voltage)] font-bold px-2 py-0.5 rounded border border-[var(--border-main)] focus:outline-none cursor-pointer"
              >
                {DEMO_BESS_PACKS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.id} ({p.chemistry})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Compact Asset / Session Context Readout Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 p-2.5 rounded bg-[var(--bg-panel-sub)] border border-[var(--border-sub)] font-mono text-[11px] text-[var(--text-secondary)]">
          <div>
            <span className="text-[var(--text-muted)] block text-[10px]">SITE</span>
            <span className="font-bold text-[var(--text-primary)]">{activePack.site}</span>
          </div>
          <div>
            <span className="text-[var(--text-muted)] block text-[10px]">SELECTED PACK</span>
            <span className="font-bold text-[var(--accent-voltage)]">{activePack.name}</span>
          </div>
          <div>
            <span className="text-[var(--text-muted)] block text-[10px]">CHEMISTRY</span>
            <span className="font-bold text-[var(--accent-current)]">{activePack.chemistry} ({activePack.cellCount} cells)</span>
          </div>
          <div>
            <span className="text-[var(--text-muted)] block text-[10px]">SOURCE</span>
            <span className="font-bold text-[var(--accent-live)] uppercase">SIMULATOR / STM32</span>
          </div>
          <div>
            <span className="text-[var(--text-muted)] block text-[10px]">SAMPLE RATE</span>
            <span className="font-bold text-[var(--text-primary)]">10.0 Hz</span>
          </div>
          <div>
            <span className="text-[var(--text-muted)] block text-[10px]">MCU TARGET</span>
            <span className="font-bold text-[var(--accent-model)] flex items-center gap-1">
              <Cpu className="w-3 h-3" /> STM32F446RE
            </span>
          </div>
          <div>
            <span className="text-[var(--text-muted)] block text-[10px]">LAST UPDATE</span>
            <span className="font-bold text-[var(--accent-live)]">Just now</span>
          </div>
        </div>
      </div>

      {/* 2. Connection & Control Bar */}
      <LiveConnectionBar
        connectionState={connectionState}
        sessionMeta={sessionMeta}
        onConnect={connect}
        onDisconnect={disconnect}
        onClear={clearFrames}
      />

      {/* 3. Operational Overview: Operating State & Data Quality Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
        {/* Operating State Card */}
        <div className="scientific-panel p-4 space-y-2 border-l-4 border-l-[var(--accent-voltage)]">
          <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
            <span className="font-bold uppercase tracking-wider">CURRENT OPERATING STATE</span>
            <span className="w-2 h-2 rounded-full bg-[var(--accent-voltage)] animate-pulse" />
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <span
              className={`text-xl font-bold ${
                opState === 'DISCHARGING'
                  ? 'text-[var(--accent-current)]'
                  : opState === 'CHARGING'
                  ? 'text-[var(--accent-healthy)]'
                  : 'text-[var(--text-primary)]'
              }`}
            >
              {opState}
            </span>
            <span className="text-[11px] text-[var(--text-secondary)]">
              {latest ? `${latest.current.toFixed(2)} A` : `${activePack.currentNominal} A`}
            </span>
          </div>
          <div className="text-[10px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-sub)]">
            State derived from dynamic current magnitude &amp; sign.
          </div>
        </div>

        {/* Data Quality Panel */}
        <div className="scientific-panel p-4 space-y-2 border-l-4 border-l-[var(--accent-healthy)]">
          <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
            <span className="font-bold uppercase tracking-wider flex items-center gap-1">
              DATA QUALITY <TooltipInfo term="SNR" />
            </span>
            <span className="text-[var(--accent-healthy)] font-bold uppercase text-[10px]">GOOD</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
            <div>
              <span className="text-[var(--text-muted)] block text-[10px]">SIGNAL QUALITY:</span>
              <span className="font-bold text-[var(--accent-healthy)]">{signalQuality}%</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] block text-[10px]">MISSING FRAMES:</span>
              <span className="font-bold text-[var(--text-primary)]">0</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] block text-[10px]">RING BUFFER:</span>
              <span className="font-bold text-[var(--text-primary)]">{bufferCount} / 500</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] block text-[10px]">SYNC STATE:</span>
              <span className="font-bold text-[var(--accent-live)] flex items-center gap-1">
                <Check className="w-3 h-3" /> Synchronized
              </span>
            </div>
          </div>
        </div>

        {/* Demo Label Badge */}
        <div className="scientific-panel p-4 space-y-2 border-l-4 border-l-[var(--accent-model)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
              <span className="font-bold uppercase tracking-wider">ACQUISITION ENVIRONMENT</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--accent-live)]/10 text-[var(--accent-live)] font-bold">
                DEMO
              </span>
            </div>
            <div className="text-xs font-bold text-[var(--text-primary)] mt-1.5">
              SimulatedTelemetrySource (Phase 1)
            </div>
            <div className="text-[10px] text-[var(--text-muted)] mt-1 leading-relaxed">
              Generating synthetic voltage/current/ripple signals. Hardware serial port seam is ready for STM32 board connection.
            </div>
          </div>
        </div>
      </div>

      {/* 4. Downstream Intelligence Architecture Banner with Expandable "Why?" */}
      <div className="scientific-panel-sub p-4 space-y-2 border-l-2 border-l-[var(--accent-live)]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)]">
            <Info className="w-4 h-4 text-[var(--accent-live)] shrink-0" />
            <span>
              <strong className="text-[var(--text-primary)]">LIVE ACQUISITION MODE:</strong> Displays raw and derived telemetry from the acquisition layer. SOH, RUL and degradation intelligence are intentionally calculated downstream by BIP.
            </span>
          </div>

          <button
            onClick={() => setIsWhyOpen(!isWhyOpen)}
            className="text-xs font-mono text-[var(--accent-voltage)] hover:underline flex items-center gap-1 cursor-pointer shrink-0"
          >
            <span>{isWhyOpen ? 'Hide Details' : 'Why is SOH/RUL downstream?'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isWhyOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {isWhyOpen && (
          <div className="pt-2 border-t border-[var(--border-sub)] font-mono text-xs text-[var(--text-muted)] leading-relaxed space-y-1.5 animate-in fade-in duration-150">
            <p>
              In production utility architecture, low-level microcontrollers (e.g., STM32) execute timer-triggered DMA double-buffer acquisition and local Fast Fourier Transform (FFT) feature extraction.
            </p>
            <p>
              Heavy electrochemistry models, LOCO cross-chemistry transfer matrices, and long-term SOH/RUL forecasts execute on the cloud/edge FastAPI intelligence server to prevent microcontroller computational bottlenecks and ensure modularity.
            </p>
          </div>
        )}
      </div>

      {/* 5. Vital Electrical Readouts */}
      <div id="live-vitals">
        <LiveVitalPanel latest={latest} />
      </div>

      {/* 6. Rolling Time-Series Signal Plot */}
      <LiveSignalChart frames={frames} />

      {/* 7. Derived Acquisition Quantities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div id="live-ripple">
          <LiveRipplePanel latest={latest} frames={frames} />
        </div>
        <div id="live-spectral">
          <LiveSpectralPanel latest={latest} />
        </div>
        <div id="live-kinetics">
          <LiveDerivativePanel latest={latest} />
        </div>
      </div>

      {/* 8. Recent Events Log Timeline */}
      <div id="live-events" className="scientific-panel p-4 space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-[var(--border-sub)] pb-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--accent-voltage)]" />
            <span className="font-bold text-[var(--text-primary)] uppercase tracking-wider">
              TELEMETRY & ACQUISITION EVENT LOG
            </span>
          </div>
          <span className="text-[10px] text-[var(--text-muted)]">STREAM TIMELINE</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
          {DEMO_FLEET_EVENTS.slice(0, 4).map((evt) => (
            <div key={evt.id} className="p-2.5 rounded bg-[var(--bg-panel-sub)] border border-[var(--border-sub)] space-y-1">
              <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
                <span>{evt.timestamp}</span>
                <span className="text-[var(--accent-live)] font-bold">{evt.source}</span>
              </div>
              <div className="text-[11px] text-[var(--text-primary)] font-sans">
                {evt.description}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 9. Acquisition Sequence & Raw Diagnostics */}
      <div id="live-sequence">
        <LiveSequenceDebug latest={latest} />
      </div>
    </div>
  );
};

