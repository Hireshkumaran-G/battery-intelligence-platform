/**
 * ResearchArtifactsPage.tsx
 *
 * Dedicated Research Artifacts & Experimental Datasets page for Research Workspace.
 * Displays 11 verified CSV datasets, artifact metadata, schema definitions, and raw data downloads.
 */
import React from 'react';
import { CompactArtifactExplorer } from './CompactArtifactExplorer';
import { Database, Info } from 'lucide-react';

export const ResearchArtifactsPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Page Header */}
      <div className="scientific-panel p-4 space-y-2 border-l-4 border-l-[var(--text-secondary)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-[var(--text-secondary)]" />
            <div>
              <h1 className="text-base sm:text-lg font-mono font-bold text-[var(--text-primary)] tracking-tight">
                RESEARCH ARTIFACTS &amp; EXPERIMENTAL DATASETS
              </h1>
              <p className="text-xs text-[var(--text-muted)] font-mono">
                11 verified classification artifacts, feature matrices, schema definitions, and raw CSV open access
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded bg-[var(--text-secondary)]/10 text-[var(--text-secondary)] border border-[var(--text-secondary)]/30 font-mono text-xs font-bold uppercase">
            VERIFIED DATASETS • 11 STUDIES
          </span>
        </div>
      </div>

      {/* 2. Context / Explanation Banner */}
      <div className="p-3.5 rounded-lg bg-[var(--bg-panel-sub)] border border-[var(--border-sub)] flex items-start gap-3 text-xs font-sans text-[var(--text-secondary)]">
        <Info className="w-4 h-4 text-[var(--text-secondary)] shrink-0 mt-0.5" />
        <div>
          <strong className="font-mono text-[var(--text-primary)] uppercase font-semibold">
            Artifact Registry Context:
          </strong>{' '}
          Access full tabular records and metadata for all 11 scientific classification datasets produced by the BIP degradation pipeline under <code className="text-[var(--accent-ripple)]">bip/classification_artifacts/</code>.
        </div>
      </div>

      {/* 3. Dataset Scope Insight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 font-mono text-xs">
        <div className="scientific-panel p-4 space-y-1 border-l-4 border-l-[var(--accent-voltage)]">
          <div className="text-[10px] text-[var(--text-muted)] uppercase">REGISTERED ARTIFACTS</div>
          <div className="text-xl font-bold text-[var(--accent-voltage)]">11 Files</div>
          <div className="text-[10px] text-[var(--text-muted)]">Verified CSV Schema</div>
        </div>

        <div className="scientific-panel p-4 space-y-1 border-l-4 border-l-[var(--accent-current)]">
          <div className="text-[10px] text-[var(--text-muted)] uppercase">CHEMISTRY SAMPLES</div>
          <div className="text-xl font-bold text-[var(--accent-current)]">20 Cells</div>
          <div className="text-[10px] text-[var(--text-muted)]">LFP • NMC • LCO</div>
        </div>

        <div className="scientific-panel p-4 space-y-1 border-l-4 border-l-[var(--accent-ripple)]">
          <div className="text-[10px] text-[var(--text-muted)] uppercase">DETRENDING ORDERS</div>
          <div className="text-xl font-bold text-[var(--accent-ripple)]">Degree 1 to 6</div>
          <div className="text-[10px] text-[var(--text-muted)]">120 Cell-Order Pairs</div>
        </div>

        <div className="scientific-panel p-4 space-y-1 border-l-4 border-l-[var(--accent-healthy)]">
          <div className="text-[10px] text-[var(--text-muted)] uppercase">REPRODUCIBILITY</div>
          <div className="text-xl font-bold text-[var(--accent-healthy)]">100% Audit Trace</div>
          <div className="text-[10px] text-[var(--text-muted)]">Deterministic Pipelines</div>
        </div>
      </div>

      {/* 4. Compact Artifact Explorer */}
      <CompactArtifactExplorer />
    </div>
  );
};
