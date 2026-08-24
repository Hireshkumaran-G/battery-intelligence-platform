import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '../../store/useAppStore';
import { fetchArtifactsList, fetchGenericArtifact, getRawArtifactDownloadUrl } from '../../api/artifacts';
import { ScientificTable } from '../../components/common/ScientificTable';
import { Database, FileSpreadsheet, Loader2 } from 'lucide-react';
import clsx from 'clsx';

export const CompactArtifactExplorer: React.FC = () => {
  const { selectedArtifactId, setSelectedArtifactId } = useAppStore();

  const { data: artifactsList, isLoading: isListLoading } = useQuery({
    queryKey: ['artifacts-list'],
    queryFn: fetchArtifactsList,
  });

  const { data: currentArtifactData, isLoading: isDataLoading } = useQuery({
    queryKey: ['artifact-data', selectedArtifactId],
    queryFn: () => fetchGenericArtifact(selectedArtifactId),
    enabled: !!selectedArtifactId,
  });

  const columns = React.useMemo(() => {
    if (!currentArtifactData || !currentArtifactData.meta.columns) return [];
    return currentArtifactData.meta.columns.map((colName) => ({
      key: colName,
      header: colName.replace(/_/g, ' '),
    }));
  }, [currentArtifactData]);

  return (
    <div id="artifacts" className="space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-[var(--text-muted)]" />
          <h2 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider font-mono">
            Supporting Research Artifacts Explorer (11 Studies)
          </h2>
        </div>
        <span className="text-[11px] font-mono text-[var(--text-muted)]">
          bip/classification_artifacts/ &bull; Direct Verified CSV Data
        </span>
      </div>

      {/* Artifact Selector Tabs */}
      <div className="scientific-panel p-2 overflow-x-auto flex items-center gap-1.5 bg-[var(--bg-panel-sub)] border border-[var(--border-main)] transition-colors duration-150">
        {isListLoading ? (
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)] p-1">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Loading registered artifacts...
          </div>
        ) : (
          artifactsList?.map((art) => {
            const isSelected = selectedArtifactId === art.id;
            return (
              <button
                key={art.id}
                onClick={() => setSelectedArtifactId(art.id)}
                className={clsx(
                  'px-2.5 py-1.5 rounded text-xs font-mono whitespace-nowrap transition-colors flex items-center gap-1.5 border',
                  isSelected
                    ? 'bg-[var(--bg-panel)] text-[var(--accent-ripple)] border-[var(--accent-ripple)]/50 font-semibold shadow-sm'
                    : 'bg-[var(--bg-root)] text-[var(--text-muted)] border-[var(--border-sub)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel)]/60'
                )}
              >
                <Database className="w-3 h-3 text-[var(--text-muted)]" />
                <span>{art.filename}</span>
                <span className="text-[10px] px-1 rounded bg-black/10 dark:bg-black/40 text-[var(--text-muted)]">
                  {art.rows_count}
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* Active Table */}
      {isDataLoading || !currentArtifactData ? (
        <div className="scientific-panel p-8 flex flex-col items-center justify-center space-y-2 bg-[var(--bg-panel)] border border-[var(--border-main)]">
          <Loader2 className="w-5 h-5 animate-spin text-[var(--accent-ripple)]" />
          <span className="text-xs font-mono text-[var(--text-muted)]">Loading artifact data...</span>
        </div>
      ) : (
        <ScientificTable
          data={currentArtifactData.records}
          columns={columns}
          title={currentArtifactData.meta.title}
          subtitle={currentArtifactData.meta.description}
          downloadUrl={getRawArtifactDownloadUrl(currentArtifactData.meta.filename)}
          downloadFilename={currentArtifactData.meta.filename}
          initialPageSize={10}
        />
      )}
    </div>
  );
};
