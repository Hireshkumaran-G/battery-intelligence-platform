/**
 * ResearchOverviewPage.tsx
 *
 * Dedicated landing page for the Research Workspace.
 * Provides a high-level executive summary of BIP research scope,
 * dataset coverage (20 cells, 3 chemistries), research areas, and key evidence.
 */
import React from 'react';
import {
  Layers,
  Zap,
  GitCompare,
  BrainCircuit,
  Search,
  Database,
  CheckCircle,
  ArrowRight,
  Award,
} from 'lucide-react';
import { useAppStore, SectionId } from '../../store/useAppStore';

export const ResearchOverviewPage: React.FC = () => {
  const setActiveSection = useAppStore((state) => state.setActiveSection);

  const handleNavigate = (sectionId: SectionId) => {
    setActiveSection(sectionId);
    const mainContentEl = document.getElementById('main-content-scroll');
    if (mainContentEl) {
      mainContentEl.scrollTop = 0;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Page Header */}
      <div className="scientific-panel p-4 space-y-2 border-l-4 border-l-[var(--accent-voltage)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-[var(--accent-voltage)]" />
            <div>
              <h1 className="text-base sm:text-lg font-mono font-bold text-[var(--text-primary)] tracking-tight">
                RESEARCH WORKSPACE OVERVIEW
              </h1>
              <p className="text-xs text-[var(--text-muted)] font-mono">
                Physics-informed battery degradation research across LFP, NMC, and LCO datasets
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded bg-[var(--accent-voltage)]/10 text-[var(--accent-voltage)] border border-[var(--accent-voltage)]/30 font-mono text-xs font-bold uppercase">
            VERIFIED SCIENTIFIC SCOPE
          </span>
        </div>
      </div>

      {/* 2. Key Metrics Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
        <div className="scientific-panel p-4 space-y-1 border-l-4 border-l-[var(--accent-voltage)]">
          <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">EXPERIMENTAL DATASET</div>
          <div className="text-xl font-bold text-[var(--text-primary)]">20 Cells</div>
          <div className="text-[10px] text-[var(--text-muted)]">8 LFP • 8 NMC • 4 LCO</div>
        </div>

        <div className="scientific-panel p-4 space-y-1 border-l-4 border-l-[var(--accent-current)]">
          <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">CHEMISTRY COVERAGE</div>
          <div className="text-xl font-bold text-[var(--accent-current)]">3 Chemistries</div>
          <div className="text-[10px] text-[var(--text-muted)]">Commercial &amp; NASA Datasets</div>
        </div>

        <div className="scientific-panel p-4 space-y-1 border-l-4 border-l-[var(--accent-ripple)]">
          <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">VERIFIED ARTIFACTS</div>
          <div className="text-xl font-bold text-[var(--accent-ripple)]">11 Datasets</div>
          <div className="text-[10px] text-[var(--text-muted)]">Full CSV Open Access</div>
        </div>

        <div className="scientific-panel p-4 space-y-1 border-l-4 border-l-[var(--accent-healthy)]">
          <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">LOCO MATRIX RMSE</div>
          <div className="text-xl font-bold text-[var(--accent-healthy)]">34.2 Cycles</div>
          <div className="text-[10px] text-[var(--text-muted)]">Physics-ML Domain Transfer</div>
        </div>
      </div>

      {/* 3. Research Areas Grid with [ OPEN ANALYSIS ] Buttons */}
      <div className="space-y-3 font-mono">
        <div className="flex items-center justify-between border-b border-[var(--border-sub)] pb-2 text-xs">
          <span className="font-bold text-[var(--text-primary)] uppercase tracking-wider">
            PRIMARY RESEARCH ANALYSIS AREAS
          </span>
          <span className="text-[10px] text-[var(--text-muted)]">SELECT AN AREA TO LAUNCH ANALYSIS</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Degradation & Lifecycle */}
          <div className="scientific-panel p-4 flex flex-col justify-between space-y-3 border-t-4 border-t-[var(--accent-thermal)] hover:border-[var(--accent-thermal)] transition-all">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[var(--accent-thermal)]" />
                  <span className="font-bold text-[var(--text-primary)] text-sm">Degradation &amp; Lifecycle</span>
                </div>
              </div>
              <p className="text-[11px] font-sans text-[var(--text-secondary)] leading-relaxed">
                Capacity fade envelopes, empirical lifespan bounds, and right-censoring adjustments for long-life LFP cells.
              </p>
            </div>
            <button
              onClick={() => handleNavigate('degradation')}
              className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded bg-[var(--accent-thermal)]/10 text-[var(--accent-thermal)] border border-[var(--accent-thermal)]/30 hover:bg-[var(--accent-thermal)]/20 transition-all font-mono text-xs font-bold cursor-pointer"
            >
              <span>OPEN ANALYSIS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2: Dynamic Signatures */}
          <div className="scientific-panel p-4 flex flex-col justify-between space-y-3 border-t-4 border-t-[var(--accent-ripple)] hover:border-[var(--accent-ripple)] transition-all">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[var(--accent-ripple)]" />
                  <span className="font-bold text-[var(--text-primary)] text-sm">Dynamic Signatures</span>
                </div>
              </div>
              <p className="text-[11px] font-sans text-[var(--text-secondary)] leading-relaxed">
                AC ripple decomposition, signed Pearson correlation, SNR curves, and NMC sign-reversal phenomena under dynamic stress.
              </p>
            </div>
            <button
              onClick={() => handleNavigate('dynamic-signatures')}
              className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded bg-[var(--accent-ripple)]/10 text-[var(--accent-ripple)] border border-[var(--accent-ripple)]/30 hover:bg-[var(--accent-ripple)]/20 transition-all font-mono text-xs font-bold cursor-pointer"
            >
              <span>OPEN ANALYSIS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 3: Cross-Chemistry */}
          <div className="scientific-panel p-4 flex flex-col justify-between space-y-3 border-t-4 border-t-[var(--accent-current)] hover:border-[var(--accent-current)] transition-all">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GitCompare className="w-4 h-4 text-[var(--accent-current)]" />
                  <span className="font-bold text-[var(--text-primary)] text-sm">Cross-Chemistry</span>
                </div>
              </div>
              <p className="text-[11px] font-sans text-[var(--text-secondary)] leading-relaxed">
                Leave-One-Chemistry-Out (LOCO) domain transfer matrix, chemistry interaction effects, and generalization bounds.
              </p>
            </div>
            <button
              onClick={() => handleNavigate('cross-chemistry')}
              className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded bg-[var(--accent-current)]/10 text-[var(--accent-current)] border border-[var(--accent-current)]/30 hover:bg-[var(--accent-current)]/20 transition-all font-mono text-xs font-bold cursor-pointer"
            >
              <span>OPEN ANALYSIS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 4: Model Intelligence */}
          <div className="scientific-panel p-4 flex flex-col justify-between space-y-3 border-t-4 border-t-[var(--accent-model)] hover:border-[var(--accent-model)] transition-all">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-[var(--accent-model)]" />
                  <span className="font-bold text-[var(--text-primary)] text-sm">Model Intelligence</span>
                </div>
              </div>
              <p className="text-[11px] font-sans text-[var(--text-secondary)] leading-relaxed">
                3-Strategy benchmark (Intra-cycle, Dynamic, Physics-ML) and tree feature importance ranking for SOH/RUL prediction.
              </p>
            </div>
            <button
              onClick={() => handleNavigate('model-intelligence')}
              className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded bg-[var(--accent-model)]/10 text-[var(--accent-model)] border border-[var(--accent-model)]/30 hover:bg-[var(--accent-model)]/20 transition-all font-mono text-xs font-bold cursor-pointer"
            >
              <span>OPEN ANALYSIS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 5: Cell Deep-Dive */}
          <div className="scientific-panel p-4 flex flex-col justify-between space-y-3 border-t-4 border-t-[var(--accent-healthy)] hover:border-[var(--accent-healthy)] transition-all">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-[var(--accent-healthy)]" />
                  <span className="font-bold text-[var(--text-primary)] text-sm">Cell Deep-Dive</span>
                </div>
              </div>
              <p className="text-[11px] font-sans text-[var(--text-secondary)] leading-relaxed">
                Individual cell trajectory inspector, multi-degree polynomial sensitivity study, and cycle degradation profile.
              </p>
            </div>
            <button
              onClick={() => handleNavigate('cell-inspector')}
              className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded bg-[var(--accent-healthy)]/10 text-[var(--accent-healthy)] border border-[var(--accent-healthy)]/30 hover:bg-[var(--accent-healthy)]/20 transition-all font-mono text-xs font-bold cursor-pointer"
            >
              <span>OPEN INSPECTOR</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 6: Research Evidence */}
          <div className="scientific-panel p-4 flex flex-col justify-between space-y-3 border-t-4 border-t-[var(--text-secondary)] hover:border-[var(--text-secondary)] transition-all">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-[var(--text-secondary)]" />
                  <span className="font-bold text-[var(--text-primary)] text-sm">Research Artifacts Catalog</span>
                </div>
              </div>
              <p className="text-[11px] font-sans text-[var(--text-secondary)] leading-relaxed">
                11 verified CSV datasets, metadata exploration, raw data download links, and statistical significance proofs.
              </p>
            </div>
            <button
              onClick={() => handleNavigate('artifacts')}
              className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded bg-[var(--bg-panel-sub)] text-[var(--text-primary)] border border-[var(--border-sub)] hover:bg-[var(--bg-panel)] transition-all font-mono text-xs font-bold cursor-pointer"
            >
              <span>EXPLORE ARTIFACTS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Research Evidence & Findings Summary */}
      <div className="scientific-panel p-4 space-y-3 font-mono text-xs">
        <span className="font-bold text-[var(--text-primary)] uppercase tracking-wider block border-b border-[var(--border-sub)] pb-2">
          VERIFIED SCIENTIFIC FINDINGS &amp; EVIDENCE
        </span>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
          <div className="p-3 rounded bg-[var(--bg-panel-sub)] border border-[var(--border-sub)] space-y-1.5">
            <div className="flex items-center gap-1.5 text-[var(--accent-voltage)] font-bold">
              <Award className="w-3.5 h-3.5" />
              <span>LFP RIGHT-CENSORING</span>
            </div>
            <p className="text-[var(--text-secondary)] font-sans text-[11px] leading-relaxed">
              LFP cells display near-zero capacity loss over initial 500 cycles. Standard RUL models fail (NaN RUL); right-censoring correction enforced.
            </p>
          </div>

          <div className="p-3 rounded bg-[var(--bg-panel-sub)] border border-[var(--border-sub)] space-y-1.5">
            <div className="flex items-center gap-1.5 text-[var(--accent-ripple)] font-bold">
              <Zap className="w-3.5 h-3.5" />
              <span>NMC SIGN REVERSAL</span>
            </div>
            <p className="text-[var(--text-secondary)] font-sans text-[11px] leading-relaxed">
              Pearson correlation between AC ripple and SOH reverses sign from +0.82 to -0.74 in NMC cells as degradation crosses 85% SOH.
            </p>
          </div>

          <div className="p-3 rounded bg-[var(--bg-panel-sub)] border border-[var(--border-sub)] space-y-1.5">
            <div className="flex items-center gap-1.5 text-[var(--accent-healthy)] font-bold">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>PHYSICS-ML LOCO GAIN</span>
            </div>
            <p className="text-[var(--text-secondary)] font-sans text-[11px] leading-relaxed">
              Physics-informed feature extraction reduces Leave-One-Chemistry-Out transfer error from 142.8 cycles (unmodified) to 34.2 cycles.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
