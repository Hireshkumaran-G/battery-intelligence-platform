import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '../../store/useAppStore';
import { fetchArtifactsList, fetchGenericArtifact, getRawArtifactDownloadUrl } from '../../api/artifacts';
import { ScientificTable } from '../../components/common/ScientificTable';
import { Database, FileSpreadsheet, Loader2 } from 'lucide-react';
import clsx from 'clsx';

export const ArtifactExplorerSection: React.FC = () => {
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
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-200 tracking-wide font-sans flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
          Research Artifacts Explorer & Data Inspector
        </h2>
        <span className="text-xs font-mono text-slate-400">
          Source: bip/classification_artifacts/ (11 Verified Studies)
        </span>
      </div>

      {/* Artifact Selector Tabs Bar */}
      <div className="scientific-panel rounded p-2 overflow-x-auto border border-slate-800 flex items-center gap-1.5 bg-slate-950/60">
        {isListLoading ? (
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 p-1">
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
                    ? 'bg-slate-800 text-cyan-400 border-cyan-500/40 shadow-sm font-medium'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-850'
                )}
              >
                <Database className="w-3 h-3 text-slate-500" />
                <span>{art.filename}</span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-slate-950 text-slate-500">
                  {art.rows_count}
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* Active Table Viewer */}
      {isDataLoading || !currentArtifactData ? (
        <div className="scientific-panel rounded p-12 flex flex-col items-center justify-center space-y-3 border border-slate-800">
          <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
          <span className="text-xs font-mono text-slate-400">Loading artifact data...</span>
        </div>
      ) : (
        <ScientificTable
          data={currentArtifactData.records}
          columns={columns}
          title={currentArtifactData.meta.title}
          subtitle={currentArtifactData.meta.description}
          downloadUrl={getRawArtifactDownloadUrl(currentArtifactData.meta.filename)}
          downloadFilename={currentArtifactData.meta.filename}
          initialPageSize={15}
        />
      )}
    </div>
  );
};
